/**
 * Extracción de patrones experienciales al cierre de sesión (#203).
 * Espejo de lastSessionSummaryService: schedule + worker tick + LLM JSON.
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import ExperientialPatternJob from '../models/ExperientialPatternJob.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { openaiService } from './index.js';
import {
  createExperientialPattern,
  hasExperientialPatternsConsent,
  isExperientialExtractEnabled,
  isExperientialPatternsEnabled,
} from './experientialPatternService.js';
import { normalizeStoredCrisisRiskLevel } from '../constants/crisis.js';
import { failsClinicalGuardrails, sanitizeObservationalText } from '../utils/clinicalContentGuardrails.js';
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../constants/crisis.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import metricsService from './metricsService.js';

const MIN_USER_TURNS = 3;
const MIN_USER_CHARS = 80;
const MESSAGES_LIMIT = 40;
const SNAPSHOT_CONTENT_MAX = 2000;
const CONFIDENCE_THRESHOLD = 0.75;
const MAX_PATTERNS = 2;
const DEFAULT_DELAY_MINUTES = 7;
const CLEAR_SNAPSHOT_DELAY_MINUTES = 1;
const STALE_MS = () =>
  Math.max(60_000, Number(process.env.EXPERIENTIAL_EXTRACT_STALE_MS) || 15 * 60 * 1000);
const MAX_ATTEMPTS = () =>
  Math.max(1, Math.min(5, Number(process.env.EXPERIENTIAL_EXTRACT_MAX_ATTEMPTS) || 2));
const TICK_MS = () =>
  Math.max(30_000, Number(process.env.EXPERIENTIAL_EXTRACT_TICK_MS) || 120_000);

const CATEGORIES = new Set(['time_of_day', 'emotion', 'relationship', 'coping', 'other']);

let workerTimer = null;

function clampDelayMinutes(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_DELAY_MINUTES;
  return Math.max(1, Math.min(30, Math.floor(n)));
}

function parseJsonObject(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function countUserStats(msgs) {
  let userTurns = 0;
  let userChars = 0;
  for (const m of msgs || []) {
    if (m?.role !== 'user') continue;
    userTurns += 1;
    userChars += String(m.content || '').trim().length;
  }
  return { userTurns, userChars };
}

/**
 * Normaliza mensajes para transcriptSnapshot (exportable para tests).
 */
export function buildTranscriptSnapshotFromMessages(msgs = []) {
  const list = Array.isArray(msgs) ? msgs : [];
  return list
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system'))
    .slice(-MESSAGES_LIMIT)
    .map((m) => ({
      role: m.role,
      content: String(m.content || '').slice(0, SNAPSHOT_CONTENT_MAX),
      metadata: m.metadata && typeof m.metadata === 'object' ? m.metadata : undefined,
      createdAt: m.createdAt ? new Date(m.createdAt) : null,
    }));
}

/**
 * Resuelve mensajes para extract: snapshot del job o Message.find en vivo.
 */
export function resolveMessagesForExperientialExtractJob(job, liveMessages = null) {
  const snap = Array.isArray(job?.transcriptSnapshot) ? job.transcriptSnapshot : null;
  if (snap && snap.length > 0) {
    return snap.map((m) => ({
      role: m.role,
      content: m.content,
      metadata: m.metadata,
      createdAt: m.createdAt,
    }));
  }
  if (Array.isArray(liveMessages)) {
    return [...liveMessages].reverse();
  }
  return [];
}

function conversationHasCrisis(msgs) {
  for (const m of msgs || []) {
    const risk = normalizeStoredCrisisRiskLevel(m?.metadata?.riskLevel || m?.metadata?.crisis?.riskLevel);
    // Alineado a observacional: WARNING también bloquea extract.
    if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'WARNING') return true;
    if (m?.role === 'user' && hasExplicitSuicidalOrSelfHarmLexicon(m.content)) return true;
  }
  return false;
}

export async function scheduleExperientialPatternExtract(userId, conversationId, opts = {}) {
  if (!isExperientialPatternsEnabled() || !isExperientialExtractEnabled()) {
    return { scheduled: false, reason: 'FEATURE_OFF' };
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(conversationId)) {
    const err = new Error('INVALID_IDS');
    err.code = 'INVALID_IDS';
    throw err;
  }
  if (!(await hasExperientialPatternsConsent(userId))) {
    return { scheduled: false, reason: 'NO_CONSENT' };
  }

  const uid = new mongoose.Types.ObjectId(String(userId));
  const cid = new mongoose.Types.ObjectId(String(conversationId));
  const conv = await Conversation.findOne({ _id: cid, userId: uid }).select('_id').lean();
  if (!conv) {
    const err = new Error('CONVERSATION_NOT_FOUND');
    err.code = 'CONVERSATION_NOT_FOUND';
    throw err;
  }

  const hasMessages = await Message.exists({ conversationId: cid, role: 'user' });
  if (!hasMessages) {
    return { scheduled: false, reason: 'NO_MESSAGES' };
  }

  const lastMsg = await Message.findOne({ conversationId: cid })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();
  const baselineLastMessageAt = lastMsg?.createdAt ? new Date(lastMsg.createdAt) : new Date(0);
  const captureSnapshot = opts.captureSnapshot === true;
  const delayMinutes = clampDelayMinutes(
    opts.delayMinutes ?? (captureSnapshot ? CLEAR_SNAPSHOT_DELAY_MINUTES : DEFAULT_DELAY_MINUTES),
  );
  const runAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  // Con snapshot nuevo (clear): reemplaza jobs previos del hilo.
  // Sin snapshot (salida normal): no cancela extracts ya capturados al borrar.
  const cancelFilter = captureSnapshot
    ? {
        userId: uid,
        conversationId: cid,
        status: { $in: ['pending', 'processing'] },
      }
    : {
        userId: uid,
        conversationId: cid,
        status: { $in: ['pending', 'processing'] },
        $or: [
          { transcriptSnapshot: { $exists: false } },
          { transcriptSnapshot: null },
          { transcriptSnapshot: { $size: 0 } },
        ],
      };
  await ExperientialPatternJob.updateMany(cancelFilter, { $set: { status: 'cancelled' } });

  let transcriptSnapshot;
  if (captureSnapshot) {
    const recentMsgs = await Message.find({ conversationId: cid })
      .sort({ createdAt: -1 })
      .limit(MESSAGES_LIMIT)
      .select('role content metadata createdAt')
      .lean();
    transcriptSnapshot = buildTranscriptSnapshotFromMessages([...recentMsgs].reverse());
    if (!transcriptSnapshot.some((m) => m.role === 'user')) {
      return { scheduled: false, reason: 'NO_MESSAGES' };
    }
  }

  const jobPayload = {
    userId: uid,
    conversationId: cid,
    runAt,
    baselineLastMessageAt,
    status: 'pending',
    attempts: 0,
  };
  if (transcriptSnapshot) {
    jobPayload.transcriptSnapshot = transcriptSnapshot;
  }

  const job = await ExperientialPatternJob.create(jobPayload);

  return {
    scheduled: true,
    runAt: job.runAt.toISOString(),
    delayMinutes,
    baselineLastMessageAt: baselineLastMessageAt.toISOString(),
    hasTranscriptSnapshot: Boolean(transcriptSnapshot?.length),
  };
}

async function isJobStillProcessing(jobId) {
  const j = await ExperientialPatternJob.findById(jobId).select('status').lean();
  return j?.status === 'processing';
}

/**
 * Extrae candidatos desde transcript (exportable para tests con mock LLM).
 */
export function sanitizeExtractedCandidates(parsed, language = 'es') {
  const items = Array.isArray(parsed?.patterns) ? parsed.patterns : [];
  const out = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const statement = sanitizeObservationalText(item.statement, 160);
    if (!statement || statement.length < 5) continue;
    if (hasExplicitSuicidalOrSelfHarmLexicon(statement) || failsClinicalGuardrails(statement)) {
      continue;
    }
    const confidence = Number(item.confidence);
    if (!Number.isFinite(confidence) || confidence < CONFIDENCE_THRESHOLD) continue;
    const category = CATEGORIES.has(item.category) ? item.category : 'other';
    out.push({
      statement,
      category,
      confidence: Math.min(1, confidence),
      language: language === 'en' ? 'en' : 'es',
    });
    if (out.length >= MAX_PATTERNS) break;
  }
  return out;
}

async function processOneJob(job) {
  if (!job?._id || !job.userId || !job.conversationId) {
    if (job?._id) {
      await ExperientialPatternJob.updateOne(
        { _id: job._id },
        { $set: { status: 'failed', lastError: 'incomplete_job' } },
      );
    }
    return;
  }

  const userId = job.userId;
  const conversationId = job.conversationId;

  if (!(await hasExperientialPatternsConsent(userId))) {
    await ExperientialPatternJob.updateOne(
      { _id: job._id },
      { $set: { status: 'cancelled', lastError: 'no_consent' } },
    );
    return;
  }

  const hasSnapshot =
    Array.isArray(job.transcriptSnapshot) && job.transcriptSnapshot.length > 0;

  if (!hasSnapshot) {
    const newer = await Message.exists({
      conversationId,
      createdAt: { $gt: job.baselineLastMessageAt },
    });
    if (newer) {
      await ExperientialPatternJob.updateOne({ _id: job._id }, { $set: { status: 'cancelled' } });
      return;
    }
  }

  let msgs;
  if (hasSnapshot) {
    msgs = resolveMessagesForExperientialExtractJob(job);
  } else {
    // Últimos N mensajes del cierre (no el inicio del hilo).
    const recentMsgs = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(MESSAGES_LIMIT)
      .select('role content metadata createdAt')
      .lean();
    msgs = resolveMessagesForExperientialExtractJob(job, recentMsgs);
  }

  const { userTurns, userChars } = countUserStats(msgs);
  if (userTurns < MIN_USER_TURNS || userChars < MIN_USER_CHARS || conversationHasCrisis(msgs)) {
    await ExperientialPatternJob.updateOne(
      { _id: job._id, status: 'processing' },
      { $set: { status: 'done', patternsCreated: 0, lastError: 'skipped_threshold_or_crisis' } },
    );
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    await ExperientialPatternJob.updateOne(
      { _id: job._id, status: 'processing' },
      { $set: { status: 'done', patternsCreated: 0, lastError: 'no_openai_key' } },
    );
    return;
  }

  if (!(await isJobStillProcessing(job._id))) return;

  const userDoc = await User.findById(userId).select('preferences.language').lean();
  const language = normalizeApiLanguage(userDoc?.preferences?.language);

  const userLines = msgs
    .filter((m) => m.role === 'user')
    .map((m) => String(m.content || '').slice(0, 500))
    .join('\n')
    .slice(0, 8000);

  const model = process.env.EXPERIENTIAL_EXTRACT_MODEL || 'gpt-4o-mini';
  const system =
    language === 'en'
      ? 'You extract experiential process patterns from user messages for a wellbeing app. No diagnosis. JSON only.'
      : 'Extraes patrones experienciales del proceso a partir de mensajes del usuario en una app de bienestar. Sin diagnóstico. Solo JSON.';

  const userPrompt =
    language === 'en'
      ? `From the USER messages below, extract 0-2 recurring experiential patterns (subjective difficulties, time-of-day struggles, relational themes, coping notes). Skip trivial small talk.\nReturn ONLY JSON:\n{"patterns":[{"statement":"...","category":"time_of_day|emotion|relationship|coping|other","confidence":0.0-1.0}]}\n- statement: max 160 chars, third-person observational paraphrase of what the user said (e.g. "mornings were the hardest")\n- confidence >= 0.75 only if clearly stated\n- empty patterns array if none\n\nUSER messages:\n${userLines}`
      : `A partir de los mensajes del USUARIO, extrae 0-2 patrones experienciales recurrentes (dificultades subjetivas, mañanas/noches, temas relacionales, afrontamiento). Omite charla trivial.\nDevuelve SOLO JSON:\n{"patterns":[{"statement":"...","category":"time_of_day|emotion|relationship|coping|other","confidence":0.0-1.0}]}\n- statement: máx 160 chars, paráfrasis observacional de lo que dijo el usuario (p. ej. "las mañanas eran las más difíciles")\n- confidence >= 0.75 solo si está claramente dicho\n- array vacío si no hay\n\nMensajes del USUARIO:\n${userLines}`;

  try {
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 350,
      temperature: 0.2,
    });

    if (!(await isJobStillProcessing(job._id))) return;

    const raw = completion?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonObject(raw);
    const candidates = sanitizeExtractedCandidates(parsed, language);

    let created = 0;
    for (const c of candidates) {
      const result = await createExperientialPattern(userId, {
        statement: c.statement,
        category: c.category,
        confidence: c.confidence,
        language: c.language,
        conversationId: String(conversationId),
        source: 'session_extract',
        observedAt: job.baselineLastMessageAt || new Date(),
      });
      if (result.pattern) {
        created += 1;
        metricsService
          .recordMetric('experiential_pattern_extracted', { category: c.category }, String(userId))
          .catch(() => {});
        // Puente #203: indexar statement en RAG personal si está habilitado (best-effort).
        import('./personalPatternRagService.js')
          .then(({ indexPersonalPatternFromUserMessage }) =>
            indexPersonalPatternFromUserMessage({
              userId,
              conversationId,
              content: c.statement,
              riskLevel: 'LOW',
              topicTag: c.category || 'general',
            }),
          )
          .catch(() => {});
      }
    }

    await ExperientialPatternJob.updateOne(
      { _id: job._id, status: 'processing' },
      { $set: { status: 'done', patternsCreated: created, lastError: null } },
    );
  } catch (err) {
    const attempts = Number(job.attempts) || 0;
    const next = attempts + 1;
    if (next >= MAX_ATTEMPTS()) {
      await ExperientialPatternJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'failed',
            lastError: String(err?.message || err).slice(0, 2000),
            attempts: next,
          },
        },
      );
      return;
    }
    await ExperientialPatternJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: 'pending',
          runAt: new Date(Date.now() + 2 * 60 * 1000),
          lastError: String(err?.message || err).slice(0, 2000),
          attempts: next,
        },
      },
    );
  }
}

export async function tickExperientialPatternExtractWorker() {
  if (!isExperientialPatternsEnabled() || !isExperientialExtractEnabled()) return;

  const staleBefore = new Date(Date.now() - STALE_MS());
  await ExperientialPatternJob.updateMany(
    { status: 'processing', updatedAt: { $lt: staleBefore } },
    { $set: { status: 'pending', runAt: new Date() } },
  );

  const job = await ExperientialPatternJob.findOneAndUpdate(
    { status: 'pending', runAt: { $lte: new Date() } },
    { $set: { status: 'processing' } },
    { sort: { runAt: 1 }, new: true },
  );
  if (!job) return;
  await processOneJob(job);
}

export function startExperientialPatternExtractWorker() {
  if (workerTimer || process.env.NODE_ENV === 'test') return;
  if (!isExperientialExtractEnabled()) return;
  workerTimer = setInterval(() => {
    tickExperientialPatternExtractWorker().catch((err) => {
      console.error('[experientialExtract] tick error', err?.message || err);
    });
  }, TICK_MS());
  if (typeof workerTimer.unref === 'function') workerTimer.unref();
  console.info('[experientialExtract] worker started');
}

export function stopExperientialPatternExtractWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

export default {
  scheduleExperientialPatternExtract,
  tickExperientialPatternExtractWorker,
  startExperientialPatternExtractWorker,
  stopExperientialPatternExtractWorker,
  sanitizeExtractedCandidates,
  buildTranscriptSnapshotFromMessages,
  resolveMessagesForExperientialExtractJob,
};
