/**
 * Error Alert Service
 *
 * Envía un email cuando ocurre un error relevante, con rate-limit para evitar spam.
 * Se encola (no bloquea requests) usando emailQueueService.
 */
import logger from '../utils/logger.js';
import { enqueueEmail } from './emailQueueService.js';

const ENABLED = process.env.ENABLE_ERROR_EMAIL_ALERTS === 'true';
const TO = (process.env.ERROR_ALERT_EMAIL_TO || 'marcelo.ull@antoapps.com').trim();
const COOLDOWN_MS = Math.max(
  60_000,
  parseInt(process.env.ERROR_ALERT_EMAIL_COOLDOWN_MS || '300000', 10) || 300000
); // default 5 min

// Evitar spam: key -> lastSentAt
const lastSentByKey = new Map();

function safeString(v, max = 2000) {
  const s = typeof v === 'string' ? v : v == null ? '' : String(v);
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function buildKey({ kind, path, code, name }) {
  return [kind, path || '-', code || '-', name || '-'].join('|');
}

function shouldSend(key) {
  const now = Date.now();
  const last = lastSentByKey.get(key) || 0;
  if (now - last < COOLDOWN_MS) return false;
  lastSentByKey.set(key, now);
  return true;
}

function buildHtml(payload) {
  const rows = Object.entries(payload)
    .map(([k, v]) => {
      const value = safeString(v, 5000).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<tr><td style="padding:6px 10px;border:1px solid #eee;color:#444;"><b>${k}</b></td><td style="padding:6px 10px;border:1px solid #eee;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;white-space:pre-wrap;">${value}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fafafa;padding:20px;">
  <h2 style="margin:0 0 12px 0;">🚨 Error en backend Anto</h2>
  <p style="margin:0 0 14px 0;color:#333;">Resumen con timestamp y contexto para debugging.</p>
  <table style="border-collapse:collapse;background:#fff;">${rows}</table>
  <p style="margin-top:14px;color:#666;font-size:12px;">Rate-limit: 1 email por clave cada ${(COOLDOWN_MS / 60000).toFixed(1)} min.</p>
</body></html>`;
}

async function enqueueAlertEmail({ subject, html }) {
  try {
    const { default: mailer } = await import('../config/mailer.js');
    return await mailer.sendCustomEmail({ to: TO, subject, html });
  } catch (err) {
    logger.warn('[ErrorAlert] No se pudo enviar email de alerta', { error: err?.message });
    return false;
  }
}

/**
 * Encolar alerta por error de request (Express).
 */
export function notifyRequestError(req, err) {
  if (!ENABLED) return;
  if (!TO) return;

  const statusCode = err?.statusCode || err?.status || err?.response?.status || 500;
  // Evitar alertas por 4xx comunes (validación/auth); solo 5xx y degradaciones explícitas
  const isServerError = statusCode >= 500;
  const isDegraded = err?.code === 'CIRCUIT_BREAKER_OPEN';
  if (!isServerError && !isDegraded) return;

  const key = buildKey({
    kind: 'request',
    path: req?.path,
    code: err?.code,
    name: err?.name
  });
  if (!shouldSend(key)) return;

  const timestamp = new Date().toISOString();
  const subject = `[Anto][backend] Error ${isDegraded ? 'degradado' : '500+'} — ${req?.method || 'HTTP'} ${req?.path || ''}`;
  const html = buildHtml({
    timestamp,
    kind: 'request',
    method: req?.method,
    path: req?.path,
    statusCode,
    ip: req?.ip,
    userAgent: req?.get?.('user-agent'),
    requestId: req?.get?.('x-request-id') || req?.headers?.['x-request-id'],
    userId: req?.user?._id || req?.user?.userId,
    errorName: err?.name,
    errorCode: err?.code,
    message: err?.message,
    stack: err?.stack
  });

  enqueueEmail(() => enqueueAlertEmail({ subject, html }), { type: 'error_alert', to: TO });
}

/**
 * Encolar alerta por error fatal de proceso.
 */
export function notifyFatalError(reason, err) {
  if (!ENABLED) return;
  if (!TO) return;

  const key = buildKey({ kind: 'fatal', path: reason, code: err?.code, name: err?.name });
  if (!shouldSend(key)) return;

  const timestamp = new Date().toISOString();
  const subject = `[Anto][backend] FATAL — ${safeString(reason, 120)}`;
  const html = buildHtml({
    timestamp,
    kind: 'fatal',
    reason,
    nodeEnv: process.env.NODE_ENV,
    service: process.env.RENDER_SERVICE_NAME || process.env.HOSTNAME,
    errorName: err?.name,
    errorCode: err?.code,
    message: err?.message,
    stack: err?.stack
  });

  enqueueEmail(() => enqueueAlertEmail({ subject, html }), { type: 'fatal_error_alert', to: TO, maxAttempts: 2 });
}

