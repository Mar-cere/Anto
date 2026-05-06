/**
 * Resumen de última sesión de chat (#4 + #47): programación diferida y generación vía LLM.
 */
import mongoose from 'mongoose';
import { normalizeStoredCrisisRiskLevel } from '../constants/crisis.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import SessionSummaryJob from '../models/SessionSummaryJob.js';
import User from '../models/User.js';
import openaiService from './openaiService.js';
import logger from '../utils/logger.js';

const RISK_RANK = { LOW: 0, WARNING: 1, MEDIUM: 2, HIGH: 3, unknown: -1 };

const MIN_USER_TURNS_FOR_LLM = 3;
const MIN_USER_CHARS_FOR_LLM = 120;
const DEFAULT_DELAY_MIN = 7;
const MIN_DELAY_MIN = 5;
const MAX_DELAY_MIN = 12;
const MESSAGES_FOR_TRANSCRIPT = 48;

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

function buildSnippet(bullets, bridge) {
  const first = bullets[0] ? String(bullets[0]).replace(/\s+/g, ' ').trim() : '';
  const b = bridge ? String(bridge).replace(/\s+/g, ' ').trim() : '';
  const raw = first || b || 'Resumen de tu última conversación.';
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

  const lastMsg = await Message.findOne({ conversationId: cid })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();

  const baselineLastMessageAt = lastMsg?.createdAt ? new Date(lastMsg.createdAt) : new Date(0);
  const delayMinutes = clampDelayMinutes(opts.delayMinutes);
  const runAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await SessionSummaryJob.deleteMany({ userId: uid, status: 'pending' });
  const job = await SessionSummaryJob.create({
    userId: uid,
    conversationId: cid,
    runAt,
    baselineLastMessageAt,
    status: 'pending'
  });

  return {
    scheduled: true,
    runAt: job.runAt.toISOString(),
    delayMinutes,
    baselineLastMessageAt: baselineLastMessageAt.toISOString()
  };
}

async function savePlaceholderSummary(userId, conversationId, { userTurns, riskTier }) {
  const bridge =
    'Esta sesión fue breve. Cuando quieras podés seguir en el chat; aquí no hace falta un resumen largo.';
  const snippet = 'Sesión breve — seguí cuando quieras.';
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
          generatedAt: new Date()
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
    await savePlaceholderSummary(userId, conversationId, { userTurns, riskTier });
    await SessionSummaryJob.updateOne({ _id: job._id }, { $set: { status: 'done' } });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    logger.warn('[lastSessionSummary] OPENAI_API_KEY ausente; placeholder');
    await savePlaceholderSummary(userId, conversationId, { userTurns, riskTier });
    await SessionSummaryJob.updateOne({ _id: job._id }, { $set: { status: 'done' } });
    return;
  }

  const limits = getSummaryLimitsForRiskTier(riskTier);
  const transcript = msgs
    .map((m) => `${m.role}: ${String(m.content || '').slice(0, 2000)}`)
    .join('\n')
    .slice(0, 24000);

  const model = process.env.LAST_SESSION_SUMMARY_MODEL || 'gpt-4o-mini';

  const userPrompt = `Transcript (orden cronológico, truncado si hace falta):\n${transcript}\n\nDevuelve SOLO un JSON con forma exacta:\n{"bullets":["..."],"bridge":"..."}\n- bullets: como mucho ${limits.maxBullets} strings, cada una máximo ${limits.bulletMaxChars} caracteres.\n- bridge: 1-2 frases cortas para la próxima vez, máximo ${limits.bridgeMaxChars} caracteres en total.\n- Español neutro; sin listas numeradas dentro de strings; no diagnosticar; no inventar hechos no dichos.`;

  try {
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        {
          role: 'system',
          content: `Eres un asistente que resume conversaciones de bienestar emocional en una app. ${limits.systemExtra} Objetivo: ayudar a la persona a recordar el hilo sin rumiación. Salida: solo JSON válido, sin markdown.`
        },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 400,
      temperature: 0.25
    });

    const raw = completion?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonObject(raw);
    let bullets = Array.isArray(parsed?.bullets) ? parsed.bullets.map((x) => String(x).trim()).filter(Boolean) : [];
    let bridge = String(parsed?.bridge || '').trim();

    bullets = bullets.slice(0, limits.maxBullets).map((b) => b.slice(0, limits.bulletMaxChars));
    bridge = bridge.slice(0, limits.bridgeMaxChars);

    if (!bullets.length && !bridge) {
      await savePlaceholderSummary(userId, conversationId, { userTurns, riskTier });
    } else {
      const snippet = buildSnippet(bullets, bridge);
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            lastSessionSummary: {
              conversationId,
              bullets,
              bridge: bridge || snippet,
              snippet,
              riskTier,
              placeholder: false,
              userTurnCount: userTurns,
              generatedAt: new Date()
            }
          }
        }
      );
    }
    await SessionSummaryJob.updateOne({ _id: job._id }, { $set: { status: 'done' } });
  } catch (e) {
    logger.error('[lastSessionSummary] generación fallida', { error: e?.message, jobId: String(job._id) });
    await SessionSummaryJob.updateOne(
      { _id: job._id },
      { $set: { status: 'failed', lastError: String(e?.message || e).slice(0, 1900) } }
    );
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

export async function getLastSessionSummaryForUser(userId) {
  if (!mongoose.isValidObjectId(userId)) return null;
  const u = await User.findById(userId)
    .select('lastSessionSummary')
    .lean();
  const s = u?.lastSessionSummary;
  if (!s || !s.generatedAt) return null;
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
    generatedAt: s.generatedAt instanceof Date ? s.generatedAt.toISOString() : s.generatedAt
  };
}

export function startLastSessionSummaryWorker() {
  const enabled = process.env.ENABLE_LAST_SESSION_SUMMARY !== 'false';
  if (!enabled) {
    logger.info('📋 Resumen última sesión: worker desactivado (ENABLE_LAST_SESSION_SUMMARY=false)');
    return { stop: () => {} };
  }
  const intervalMs = parseInt(process.env.LAST_SESSION_SUMMARY_TICK_MS || '45000', 10);
  const safeMs = Number.isFinite(intervalMs) ? Math.min(300000, Math.max(15000, intervalMs)) : 45000;
  const id = setInterval(() => {
    runDueSessionSummaryJobs().catch((e) =>
      logger.error('[lastSessionSummary] tick', { error: e?.message })
    );
  }, safeMs);
  logger.info(`📋 Resumen última sesión: worker cada ${safeMs}ms`);
  return {
    stop: () => clearInterval(id)
  };
}
