/**
 * Continuidad del último chat (#4 + #47): programación diferida y síntesis breve vía LLM (nombre de producto ≠ resumen semanal/mensual).
 */
import mongoose from 'mongoose';
import { normalizeStoredCrisisRiskLevel } from '../constants/crisis.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import SessionSummaryJob from '../models/SessionSummaryJob.js';
import User from '../models/User.js';
import openaiService from './openaiService.js';
import logger from '../utils/logger.js';
import {
  focusCopy,
  focusLocale,
  normalizeFocusLanguage
} from '../utils/focusDashboardCopy.js';

const RISK_RANK = { LOW: 0, WARNING: 1, MEDIUM: 2, HIGH: 3, unknown: -1 };

const MIN_USER_TURNS_FOR_LLM = 3;
const MIN_USER_CHARS_FOR_LLM = 120;
const DEFAULT_DELAY_MIN = 7;
const MIN_DELAY_MIN = 5;
const MAX_DELAY_MIN = 12;
const MESSAGES_FOR_TRANSCRIPT = 48;
const MAX_LLM_ATTEMPTS_CAP = 5;
const LLM_RETRY_DELAY_MS = 20_000;

function clampDelayMinutes(n) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return DEFAULT_DELAY_MIN;
  return Math.min(MAX_DELAY_MIN, Math.max(MIN_DELAY_MIN, x));
}

/**
 * @param {string[]} levels
 * @returns {keyof typeof RISK_RANK}
 */
export function maxRiskTierFromLevels(levels) {
  let best = 'LOW';
  let rank = RISK_RANK.LOW;
  for (const raw of levels) {
    const L = String(raw || 'LOW').toUpperCase();
    if (L === 'HIGH' || L === 'MEDIUM' || L === 'WARNING' || L === 'LOW') {
      const r = RISK_RANK[L];
      if (r > rank) {
        rank = r;
        best = L;
      }
    }
  }
  return best === 'LOW' && rank === RISK_RANK.LOW && !levels.length ? 'low' : best.toLowerCase();
}

/**
 * @param {'low'|'warning'|'medium'|'high'|'unknown'} tier
 */
export function getSummaryLimitsForRiskTier(tier) {
  const t = String(tier || 'low').toLowerCase();
  if (t === 'high' || t === 'medium') {
    return {
      maxBullets: 1,
      bulletMaxChars: 100,
      bridgeMaxChars: 140,
      systemExtra:
        'Riesgo emocional elevado en el hilo: resumen MUY breve, neutro, sin reproducir métodos ni ideación. Enfócate en continuidad y apoyo general; no detalles gráficos.'
    };
  }
  if (t === 'warning') {
    return {
      maxBullets: 2,
      bulletMaxChars: 130,
      bridgeMaxChars: 180,
      systemExtra: 'Malestar relevante: sé conciso; evita rumiación y detalle innecesario.'
    };
  }
  return {
    maxBullets: 3,
    bulletMaxChars: 180,
    bridgeMaxChars: 260,
    systemExtra: 'Tono cálido y profesional-accesible; español neutro.'
  };
}

/**
 * @param {Array<{ role?: string, metadata?: object }>} msgs chronological oldest first
 */
export function collectRiskLevelsFromMessages(msgs) {
  const levels = [];
  if (!Array.isArray(msgs)) return levels;
  for (const m of msgs) {
    const rl = m.metadata?.crisis?.riskLevel ?? m.metadata?.context?.crisis?.riskLevel;
    if (rl == null || String(rl).trim() === '') continue;
    levels.push(normalizeStoredCrisisRiskLevel(rl));
  }
  return levels;
}

/**
 * @param {Array<{ role?: string, content?: string }>} msgs chronological
 */
export function countUserTurnStats(msgs) {
  let turns = 0;
  let chars = 0;
  if (!Array.isArray(msgs)) return { userTurns: 0, userChars: 0 };
  for (const m of msgs) {
    if (m.role !== 'user') continue;
    turns += 1;
    chars += String(m.content || '').trim().length;
  }
  return { userTurns: turns, userChars: chars };
}

/** Evita caracteres de control / null bytes en texto persistido (LLM o placeholder). */
export function sanitizeContinuationText(s, maxLen) {
  const t = String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  if (!maxLen || maxLen <= 0) return t;
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > Math.floor(maxLen * 0.55)) {
    return slice.slice(0, lastSpace).trim();
  }
  return slice.trim();
}

function formatSessionEndedHint(sessionEndedAt, language = 'es') {
  const d = new Date(sessionEndedAt);
  if (Number.isNaN(d.getTime())) return '';
  const locale = focusLocale(language);
  const dateLabel = d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  if (language === 'en') {
    return `The conversation ended on ${dateLabel}. Do not use "today" unless that calendar date is literally today when you write. Prefer neutral phrasing ("you planned", "you talked about") or the weekday/date if needed.`;
  }
  return `La conversación terminó el ${dateLabel}. No uses "hoy" salvo que esa fecha calendario sea literalmente hoy al redactar. Prefiere redacción neutra ("planificaste", "hablaste de") o el día/fecha si hace falta.`;
}

function buildSnippet(bullets, bridge, language = 'es') {
  const first = bullets[0] ? String(bullets[0]).replace(/\s+/g, ' ').trim() : '';
  const b = bridge ? String(bridge).replace(/\s+/g, ' ').trim() : '';
  const fallback = focusCopy(language).lastSessionSnippetFallback;
  const raw = first || b || fallback;
  return raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
}

function parseJsonObject(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const tryParse = (t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  };
  let o = tryParse(s);
  if (o) return o;
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) o = tryParse(fence[1].trim());
  return o;
}

function maxLlmAttempts() {
  const raw = parseInt(process.env.LAST_SESSION_SUMMARY_MAX_ATTEMPTS || '2', 10);
  if (!Number.isFinite(raw)) return 2;
  return Math.min(MAX_LLM_ATTEMPTS_CAP, Math.max(1, raw));
}

async function isJobStillProcessing(jobId) {
  if (!jobId) return false;
  const j = await SessionSummaryJob.findById(jobId).select('status').lean();
  return j?.status === 'processing';
}

/**
 * Persiste en User solo si el job sigue `processing`; evita pisar datos tras reschedule/cancel.
 */
async function persistAndCompleteJob(jobId, persistFn) {
  if (!(await isJobStillProcessing(jobId))) return;
  try {
    await persistFn();
  } catch (err) {
    logger.error('[lastSessionSummary] persist fallida', {
      jobId: String(jobId),
      error: err?.message
    });
    await SessionSummaryJob.updateOne(
      { _id: jobId, status: 'processing' },
      { $set: { status: 'failed', lastError: String(err?.message || err).slice(0, 1900) } }
    );
    return;
  }
  await SessionSummaryJob.updateOne({ _id: jobId, status: 'processing' }, { $set: { status: 'done' } });
}

/**
 * Programa un único job pendiente por usuario (reemplaza anteriores pending).
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|mongoose.Types.ObjectId} conversationId
 * @param {{ delayMinutes?: number }} [opts]
 */
export async function scheduleLastSessionSummary(userId, conversationId, opts = {}) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(conversationId)) {
    const err = new Error('INVALID_IDS');
    err.code = 'INVALID_IDS';
    throw err;
  }
  const uid = new mongoose.Types.ObjectId(String(userId));
  const cid = new mongoose.Types.ObjectId(String(conversationId));
  const conv = await Conversation.findOne({ _id: cid, userId: uid }).select('_id').lean();
  if (!conv) {
    const err = new Error('CONVERSATION_NOT_FOUND');
    err.code = 'CONVERSATION_NOT_FOUND';
    throw err;
  }

  const hasMessages = await Message.exists({ conversationId: cid });
  if (!hasMessages) {
    return {
      scheduled: false,
      reason: 'NO_MESSAGES'
    };
  }

  const lastMsg = await Message.findOne({ conversationId: cid })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();

  const baselineLastMessageAt = lastMsg?.createdAt ? new Date(lastMsg.createdAt) : new Date(0);
  const delayMinutes = clampDelayMinutes(opts.delayMinutes);
  const runAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await SessionSummaryJob.updateMany(
    { userId: uid, status: { $in: ['pending', 'processing'] } },
    { $set: { status: 'cancelled' } }
  );
  const job = await SessionSummaryJob.create({
    userId: uid,
    conversationId: cid,
    runAt,
    baselineLastMessageAt,
    status: 'pending',
    attempts: 0
  });

  return {
    scheduled: true,
    runAt: job.runAt.toISOString(),
    delayMinutes,
    baselineLastMessageAt: baselineLastMessageAt.toISOString()
  };
}

async function savePlaceholderSummary(
  userId,
  conversationId,
  { userTurns, riskTier, language = 'es', sessionEndedAt = null }
) {
  const lang = normalizeFocusLanguage(language);
  const c = focusCopy(lang);
  const bridge = sanitizeContinuationText(c.lastSessionPlaceholderBridge, 600);
  const snippet = sanitizeContinuationText(c.lastSessionPlaceholderSnippet, 280);
  const endedAt = sessionEndedAt ? new Date(sessionEndedAt) : new Date();
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        lastSessionSummary: {
          conversationId,
          bullets: [],
          bridge,
          snippet,
          riskTier,
          placeholder: true,
          userTurnCount: userTurns,
          language: lang,
          generatedAt: new Date(),
          sessionEndedAt: endedAt
        }
      }
    }
  );
}

/**
 * @param {import('../models/SessionSummaryJob.js').default} job
 */
async function processOneJob(job) {
  if (!job?.userId || !job?.conversationId || !job?._id) {
    logger.error('[lastSessionSummary] job incompleto', { jobId: job?._id });
    if (job?._id) {
      await SessionSummaryJob.updateOne(
        { _id: job._id },
        { $set: { status: 'failed', lastError: 'incomplete_job' } }
      );
    }
    return;
  }

  const userId = job.userId;
  const conversationId = job.conversationId;
  const sessionEndedAt = job.baselineLastMessageAt
    ? new Date(job.baselineLastMessageAt)
    : new Date();

  const userDoc = await User.findById(userId).select('preferences.language').lean();
  const language = normalizeFocusLanguage(userDoc?.preferences?.language);

  const newer = await Message.exists({
    conversationId,
    createdAt: { $gt: job.baselineLastMessageAt }
  });
  if (newer) {
    await SessionSummaryJob.updateOne({ _id: job._id }, { $set: { status: 'cancelled' } });
    return;
  }

  const msgs = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(MESSAGES_FOR_TRANSCRIPT)
    .select('role content metadata')
    .lean();

  const { userTurns, userChars } = countUserTurnStats(msgs);
  const riskLevels = collectRiskLevelsFromMessages(msgs);
  const riskTier = maxRiskTierFromLevels(riskLevels);

  if (userTurns < MIN_USER_TURNS_FOR_LLM || userChars < MIN_USER_CHARS_FOR_LLM) {
    await persistAndCompleteJob(job._id, () =>
      savePlaceholderSummary(userId, conversationId, {
        userTurns,
        riskTier,
        language,
        sessionEndedAt
      })
    );
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    logger.warn('[lastSessionSummary] OPENAI_API_KEY ausente; placeholder');
    await persistAndCompleteJob(job._id, () =>
      savePlaceholderSummary(userId, conversationId, {
        userTurns,
        riskTier,
        language,
        sessionEndedAt
      })
    );
    return;
  }

  if (!(await isJobStillProcessing(job._id))) return;

  const limits = getSummaryLimitsForRiskTier(riskTier);
  const transcript = msgs
    .map((m) => `${m.role}: ${String(m.content || '').slice(0, 2000)}`)
    .join('\n')
    .slice(0, 24000);

  const model = process.env.LAST_SESSION_SUMMARY_MODEL || 'gpt-4o-mini';
  const langDirective =
    language === 'en'
      ? 'Neutral English; no numbered lists inside strings; do not diagnose; do not invent facts not stated.'
      : 'Español neutro; sin listas numeradas dentro de strings; no diagnosticar; no inventar hechos no dichos.';

  const sessionHint = formatSessionEndedHint(sessionEndedAt, language);
  const userPrompt = `${sessionHint ? `${sessionHint}\n\n` : ''}Transcript (chronological order, truncated if needed):\n${transcript}\n\nReturn ONLY JSON with exact shape:\n{"bullets":["..."],"bridge":"..."}\n- bullets: at most ${limits.maxBullets} strings, each max ${limits.bulletMaxChars} characters.\n- bridge: 1-2 short sentences for next time, max ${limits.bridgeMaxChars} characters total.\n- ${langDirective}`;

  const systemLang =
    language === 'en'
      ? 'You write a brief continuity summary for emotional wellbeing conversations in an app (not a clinical report or weekly activity summary).'
      : 'Eres un asistente que redacta una síntesis breve de continuidad para conversaciones de bienestar emocional en una app (no es un informe clínico ni un resumen de actividad semanal).';

  const systemTail =
    language === 'en'
      ? 'Goal: help the person remember the thread without rumination. Output: valid JSON only, no markdown.'
      : 'Objetivo: ayudar a la persona a recordar el hilo sin rumiación. Salida: solo JSON válido, sin markdown.';

  try {
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        {
          role: 'system',
          content: `${systemLang} ${limits.systemExtra} ${systemTail}`
        },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 400,
      temperature: 0.25
    });

    if (!(await isJobStillProcessing(job._id))) return;

    const raw = completion?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonObject(raw);
    let bullets = Array.isArray(parsed?.bullets)
      ? parsed.bullets
          .map((x) => sanitizeContinuationText(x, limits.bulletMaxChars))
          .filter(Boolean)
      : [];
    let bridge = sanitizeContinuationText(parsed?.bridge, limits.bridgeMaxChars);

    bullets = bullets.slice(0, limits.maxBullets).map((b) => b.slice(0, limits.bulletMaxChars));
    bridge = bridge.slice(0, limits.bridgeMaxChars);

    if (!bullets.length && !bridge) {
      await persistAndCompleteJob(job._id, () =>
        savePlaceholderSummary(userId, conversationId, {
          userTurns,
          riskTier,
          language,
          sessionEndedAt
        })
      );
    } else {
      const snippet = buildSnippet(bullets, bridge, language);
      const safeSnippet = sanitizeContinuationText(snippet, 280);
      const safeBridge = sanitizeContinuationText(bridge || snippet, 600);
      const safeBullets = bullets.map((b) => sanitizeContinuationText(b, 400)).filter(Boolean);
      await persistAndCompleteJob(job._id, () =>
        User.updateOne(
          { _id: userId },
          {
            $set: {
              lastSessionSummary: {
                conversationId,
                bullets: safeBullets.slice(0, 5),
                bridge: safeBridge || safeSnippet,
                snippet: safeSnippet,
                riskTier,
                placeholder: false,
                userTurnCount: userTurns,
                language,
                generatedAt: new Date(),
                sessionEndedAt
              }
            }
          }
        )
      );
    }
  } catch (e) {
    logger.error('[lastSessionSummary] generación fallida', { error: e?.message, jobId: String(job._id) });
    const current = await SessionSummaryJob.findById(job._id).select('status attempts').lean();
    if (current?.status !== 'processing') return;

    const attempts = Number(current.attempts) || 0;
    const maxTry = maxLlmAttempts();
    if (attempts + 1 < maxTry) {
      await SessionSummaryJob.updateOne(
        { _id: job._id, status: 'processing' },
        {
          $set: {
            status: 'pending',
            runAt: new Date(Date.now() + LLM_RETRY_DELAY_MS),
            attempts: attempts + 1,
            lastError: String(e?.message || e).slice(0, 500)
          }
        }
      );
      logger.warn('[lastSessionSummary] reintento programado', {
        jobId: String(job._id),
        attempt: attempts + 1,
        maxTry
      });
    } else {
      await SessionSummaryJob.updateOne(
        { _id: job._id, status: 'processing' },
        { $set: { status: 'failed', lastError: String(e?.message || e).slice(0, 1900) } }
      );
    }
  }
}

const BATCH = 8;
const DEFAULT_STALE_PROCESSING_MS = 15 * 60 * 1000;

/**
 * Si el proceso murió durante `processing`, el job quedaría colgado. Reencola tras umbral (env: LAST_SESSION_SUMMARY_STALE_MS).
 */
async function requeueStaleProcessingJobs() {
  const raw = parseInt(process.env.LAST_SESSION_SUMMARY_STALE_MS || String(DEFAULT_STALE_PROCESSING_MS), 10);
  const staleMs = Number.isFinite(raw)
    ? Math.min(60 * 60 * 1000, Math.max(2 * 60 * 1000, raw))
    : DEFAULT_STALE_PROCESSING_MS;
  const cutoff = new Date(Date.now() - staleMs);
  const res = await SessionSummaryJob.updateMany(
    { status: 'processing', updatedAt: { $lt: cutoff } },
    { $set: { status: 'pending' } }
  );
  if (res.modifiedCount > 0) {
    logger.warn('[lastSessionSummary] jobs processing obsoletos reencolados', { count: res.modifiedCount });
  }
}

/**
 * Procesa jobs pendientes vencidos (llamar desde interval del servidor).
 */
export async function runDueSessionSummaryJobs() {
  await requeueStaleProcessingJobs();
  const now = new Date();
  for (let i = 0; i < BATCH; i++) {
    const job = await SessionSummaryJob.findOneAndUpdate(
      { status: 'pending', runAt: { $lte: now } },
      { $set: { status: 'processing' } },
      { sort: { runAt: 1 }, new: true }
    ).lean();

    if (!job) break;

    try {
      await processOneJob(job);
    } catch (e) {
      logger.error('[lastSessionSummary] processOneJob', { error: e?.message });
      await SessionSummaryJob.updateOne(
        { _id: job._id },
        { $set: { status: 'failed', lastError: String(e?.message || e).slice(0, 1900) } }
      );
    }
  }
}

/**
 * @param {string|mongoose.Types.ObjectId} userId
 */
const RISK_TIER_API = new Set(['low', 'warning', 'medium', 'high', 'unknown']);

const RECONCILE_TOLERANCE_MS = 60_000;

/**
 * Alinea la continuidad del dashboard con la conversación más reciente cuando el
 * resumen persistido pertenece a otra sesión o quedó desactualizado.
 *
 * @param {object|null} stored
 * @param {Array<{ conversationId?: string, updatedAt?: Date|string, lastMessagePreview?: string, lastMessageRole?: string, messageCount?: number }>} recentConversations
 * @param {{ language?: 'es'|'en', now?: Date }} [opts]
 */
export function reconcileChatContinuitySummary(stored, recentConversations = [], opts = {}) {
  const lang = normalizeFocusLanguage(opts.language);
  const c = focusCopy(lang);
  const now = opts.now instanceof Date ? opts.now : new Date();
  const latest = Array.isArray(recentConversations) ? recentConversations[0] : null;

  if (!latest?.conversationId || !latest.updatedAt) {
    return stored || null;
  }

  const latestAt = new Date(latest.updatedAt).getTime();
  if (!Number.isFinite(latestAt)) return stored || null;

  const storedConvId = stored?.conversationId ? String(stored.conversationId) : null;
  const latestConvId = String(latest.conversationId);
  const sameConversation = Boolean(storedConvId && storedConvId === latestConvId);
  const storedAt = stored?.sessionEndedAt
    ? new Date(stored.sessionEndedAt).getTime()
    : stored?.generatedAt
      ? new Date(stored.generatedAt).getTime()
      : 0;

  const storedIsFresh =
    stored &&
    sameConversation &&
    Number.isFinite(storedAt) &&
    storedAt >= latestAt - RECONCILE_TOLERANCE_MS &&
    stored.placeholder !== true;

  if (storedIsFresh) return stored;

  const needsRefresh =
    !stored ||
    !sameConversation ||
    (sameConversation && Number.isFinite(storedAt) && latestAt > storedAt + RECONCILE_TOLERANCE_MS) ||
    stored.placeholder === true;

  if (!needsRefresh) return stored;

  const preview = sanitizeContinuationText(String(latest.lastMessagePreview || ''), 100);
  let snippet = c.lastSessionRecentActivitySnippet;
  if (preview && latest.lastMessageRole === 'user') {
    const clipped = preview.length >= 100 ? `${preview}…` : preview;
    snippet = `${c.lastSessionRecentUserPrefix}${clipped}${c.lastSessionRecentUserSuffix}`;
  } else if (preview) {
    snippet = preview.length >= 100 ? `${preview}…` : preview;
  }

  return {
    conversationId: latestConvId,
    bullets: [],
    bridge: '',
    snippet,
    riskTier: stored?.riskTier && RISK_TIER_API.has(String(stored.riskTier).toLowerCase())
      ? String(stored.riskTier).toLowerCase()
      : 'unknown',
    placeholder: false,
    recentActivityPending: true,
    userTurnCount: Number.isFinite(latest.messageCount) ? latest.messageCount : 0,
    language: lang,
    generatedAt: new Date(latestAt).toISOString(),
    sessionEndedAt: new Date(latestAt).toISOString(),
  };
}

export async function getLastSessionSummaryForUser(userId) {
  if (!mongoose.isValidObjectId(userId)) return null;
  const uid = new mongoose.Types.ObjectId(String(userId));
  const u = await User.findById(uid)
    .select('lastSessionSummary')
    .lean();
  const s = u?.lastSessionSummary;
  if (!s || !s.generatedAt) return null;
  if (s.conversationId) {
    const convOk = await Conversation.exists({ _id: s.conversationId, userId: uid });
    if (!convOk) return null;
  }
  const tierRaw = String(s.riskTier || 'unknown').toLowerCase();
  const riskTier = RISK_TIER_API.has(tierRaw) ? tierRaw : 'unknown';
  return {
    conversationId: s.conversationId ? String(s.conversationId) : null,
    bullets: Array.isArray(s.bullets) ? s.bullets.map((x) => String(x ?? '')) : [],
    bridge: typeof s.bridge === 'string' ? s.bridge : '',
    snippet: typeof s.snippet === 'string' ? s.snippet : '',
    riskTier,
    placeholder: s.placeholder === true,
    userTurnCount: Number.isFinite(s.userTurnCount) ? s.userTurnCount : 0,
    language: s.language === 'en' ? 'en' : 'es',
    generatedAt: s.generatedAt instanceof Date ? s.generatedAt.toISOString() : s.generatedAt,
    sessionEndedAt:
      s.sessionEndedAt instanceof Date
        ? s.sessionEndedAt.toISOString()
        : s.sessionEndedAt || null
  };
}

export function startLastSessionSummaryWorker() {
  const enabled = process.env.ENABLE_LAST_SESSION_SUMMARY !== 'false';
  if (!enabled) {
    logger.info('📋 Continuidad del chat: worker desactivado (ENABLE_LAST_SESSION_SUMMARY=false)');
    return { stop: () => {} };
  }
  const intervalMs = parseInt(process.env.LAST_SESSION_SUMMARY_TICK_MS || '45000', 10);
  const safeMs = Number.isFinite(intervalMs) ? Math.min(300000, Math.max(15000, intervalMs)) : 45000;
  const id = setInterval(() => {
    runDueSessionSummaryJobs().catch((e) =>
      logger.error('[lastSessionSummary] tick', { error: e?.message })
    );
  }, safeMs);
  logger.info(`📋 Continuidad del chat: worker cada ${safeMs}ms`);
  return {
    stop: () => clearInterval(id)
  };
}
