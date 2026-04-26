/**
 * Programa el envío diario del informe de uso de tokens OpenAI por correo (mismo mailer que el resto de la app).
 *
 * Destinatarios: `OPENAI_COST_REPORT_EMAILS` (coma-separado) sustituye la lista; si no hay,
 * `OPENAI_COST_REPORT_EMAIL` (uno solo, retrocompat); si tampoco, dos correos por defecto.
 */
import { OPENAI_MODEL } from '../constants/openai.js';
import mailer from '../config/mailer.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import openaiService from './openaiService.js';
import { enqueueEmail } from './emailQueueService.js';

const DEFAULT_REPORT_EMAIL = 'marcelo.ull@antoapps.com';

function getReportEmail() {
  const legacy = process.env.OPENAI_COST_REPORT_EMAIL?.trim();
  if (legacy) {
    return legacy;
  }
  return DEFAULT_REPORT_EMAIL;
}

const rawHour = parseInt(process.env.OPENAI_COST_REPORT_HOUR_UTC || '8', 10);
const REPORT_HOUR_UTC = Number.isFinite(rawHour) ? Math.min(23, Math.max(0, rawHour)) : 8;

let lastReportSentForDay = null;

function getYesterdayUtcDateKey() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getOpenAIPricingPer1M(model) {
  const normalized = String(model || '').toLowerCase();
  const inputFromEnv = Number(process.env.OPENAI_DAILY_REPORT_INPUT_USD_PER_1M);
  const outputFromEnv = Number(process.env.OPENAI_DAILY_REPORT_OUTPUT_USD_PER_1M);
  if (Number.isFinite(inputFromEnv) && Number.isFinite(outputFromEnv)) {
    return { input: inputFromEnv, output: outputFromEnv };
  }

  // Fallback conservador para estimación operativa (actualizable vía env sin deploy).
  if (normalized.includes('gpt-5.5')) {
    return { input: 2.5, output: 10.0 };
  }
  return { input: 0.15, output: 0.6 }; // gpt-5.4-mini / mini-like
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
  const dayStartUtc = new Date(`${yesterday}T00:00:00.000Z`);
  const dayEndUtc = new Date(`${yesterday}T23:59:59.999Z`);
  const [registrations, verifiedRegistrations, dau] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: dayStartUtc, $lte: dayEndUtc } }),
    User.countDocuments({
      createdAt: { $gte: dayStartUtc, $lte: dayEndUtc },
      emailVerified: true
    }),
    User.countDocuments({
      $or: [
        { 'stats.lastActive': { $gte: dayStartUtc, $lte: dayEndUtc } },
        { lastLogin: { $gte: dayStartUtc, $lte: dayEndUtc } }
      ]
    })
  ]);

  const promptTokens = Number(stats?.promptTokens ?? 0);
  const completionTokens = Number(stats?.completionTokens ?? 0);
  const totalTokens = Number(stats?.totalTokens ?? 0);
  const pricing = getOpenAIPricingPer1M(OPENAI_MODEL);
  const estimatedCostUsd =
    (promptTokens / 1_000_000) * pricing.input + (completionTokens / 1_000_000) * pricing.output;
  const tokensPerActiveUser = dau > 0 ? totalTokens / dau : 0;
  const environment = process.env.NODE_ENV || 'development';
  const to = getReportEmail();

  // No bloquear el scheduler por I/O externo. Encolamos con reintentos.
  const enq = enqueueEmail(
    () =>
      mailer.sendOpenAIDailyCostReport(to, {
        dateKey: yesterday,
        stats,
        model: OPENAI_MODEL,
        environment,
        registrations,
        verifiedRegistrations,
        dau,
        estimatedCostUsd,
        tokensPerActiveUser
      }),
    { type: 'openai_daily_cost_report', to }
  );

  if (enq.accepted) {
    lastReportSentForDay = yesterday;
    logger.info(`📊 Informe diario OpenAI enviado (${yesterday} UTC) → ${to}`, {
      registrations,
      verifiedRegistrations,
      dau,
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
      tokensPerActiveUser: Number(tokensPerActiveUser.toFixed(2))
    });
  }
}

export function startOpenAIDailyCostReportScheduler() {
  setInterval(() => {
    tickOpenAIDailyCostReport().catch((err) => {
      logger.error('❌ Error en tick informe diario OpenAI', { error: err.message });
    });
  }, 60 * 1000);
}
