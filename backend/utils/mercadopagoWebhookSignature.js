/**
 * Validación de firma de webhooks Mercado Pago (x-signature).
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
import crypto from 'crypto';

/**
 * Extrae el id del recurso notificado (payment, etc.) del body JSON.
 * @param {object} body
 * @returns {string|null}
 */
export function extractMercadoPagoWebhookResourceId(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.data && body.data.id != null) return String(body.data.id);
  if (body.id != null) return String(body.id);
  return null;
}

/**
 * @param {object} params
 * @param {string} params.rawXSignature - Header x-signature completo (ej. ts=...,v1=...)
 * @param {string} params.xRequestId - Header x-request-id
 * @param {string} params.dataId - id del recurso (data.id)
 * @param {string} params.secret - Secreto del panel de webhooks
 * @param {number} [params.maxTsSkewSec=600]
 * @returns {{ valid: boolean, reason?: string }}
 */
export function verifyMercadoPagoWebhookSignature({
  rawXSignature,
  xRequestId,
  dataId,
  secret,
  maxTsSkewSec = 600
}) {
  if (!rawXSignature || !secret || !dataId || !xRequestId) {
    return { valid: false, reason: 'missing_params' };
  }

  const parts = String(rawXSignature).split(',');
  let ts;
  let v1;
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === 'ts') ts = v;
    if (k === 'v1') v1 = v;
  }

  if (!ts || !v1) {
    return { valid: false, reason: 'malformed_signature_header' };
  }

  const tsNum = parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) {
    return { valid: false, reason: 'invalid_ts' };
  }

  const skew = Math.abs(Math.floor(Date.now() / 1000) - tsNum);
  if (skew > maxTsSkewSec) {
    return { valid: false, reason: 'timestamp_skew' };
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmacHex = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const a = Buffer.from(hmacHex, 'hex');
    const b = Buffer.from(String(v1).trim(), 'hex');
    if (a.length !== b.length || a.length === 0) {
      return { valid: false, reason: 'length_mismatch' };
    }
    const ok = crypto.timingSafeEqual(a, b);
    return ok ? { valid: true } : { valid: false, reason: 'hmac_mismatch' };
  } catch {
    return { valid: false, reason: 'compare_error' };
  }
}
