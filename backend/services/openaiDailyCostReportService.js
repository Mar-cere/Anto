/**
 * Programa el envío diario del informe de uso de tokens OpenAI por correo (mismo mailer que el resto de la app).
 *
 * Destinatarios: `OPENAI_COST_REPORT_EMAILS` (coma-separado) sustituye la lista; si no hay,
 * `OPENAI_COST_REPORT_EMAIL` (uno solo, retrocompat); si tampoco, dos correos por defecto.
 */
import { OPENAI_MODEL } from '../constants/openai.js';
import mailer from '../config/mailer.js';
import logger from '../utils/logger.js';
import openaiService from './openaiService.js';

const DEFAULT_REPORT_EMAILS = ['marcelo0.nicolas@gmail.com', 'marcelo.ull@antoapps.com'];

function getReportEmails() {
  const list = process.env.OPENAI_COST_REPORT_EMAILS?.trim();
  if (list) {
    return list.split(',').map((e) => e.trim()).filter(Boolean);
  }
  const legacy = process.env.OPENAI_COST_REPORT_EMAIL?.trim();
  if (legacy) {
    return [legacy];
  }
  return [...DEFAULT_REPORT_EMAILS];
}

const rawHour = parseInt(process.env.OPENAI_COST_REPORT_HOUR_UTC || '8', 10);
const REPORT_HOUR_UTC = Number.isFinite(rawHour) ? Math.min(23, Math.max(0, rawHour)) : 8;

let lastReportSentForDay = null;

function getYesterdayUtcDateKey() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function tickOpenAIDailyCostReport() {
  const now = new Date();
  if (now.getUTCHours() !== REPORT_HOUR_UTC || now.getUTCMinutes() >= 15) {
    return;
  }

  const yesterday = getYesterdayUtcDateKey();
  if (lastReportSentForDay === yesterday) {
    return;
  }

  const stats = await openaiService.getTokenUsageForUtcDay(yesterday);
  const environment = process.env.NODE_ENV || 'development';
  const recipients = getReportEmails();

  let allOk = true;
  for (const to of recipients) {
    const ok = await mailer.sendOpenAIDailyCostReport(to, {
      dateKey: yesterday,
      stats,
      model: OPENAI_MODEL,
      environment
    });
    if (!ok) allOk = false;
  }

  if (allOk) {
    lastReportSentForDay = yesterday;
    logger.info(`📊 Informe diario OpenAI enviado (${yesterday} UTC) → ${recipients.join(', ')}`);
  }
}

export function startOpenAIDailyCostReportScheduler() {
  setInterval(() => {
    tickOpenAIDailyCostReport().catch((err) => {
      logger.error('❌ Error en tick informe diario OpenAI', { error: err.message });
    });
  }, 60 * 1000);
}
