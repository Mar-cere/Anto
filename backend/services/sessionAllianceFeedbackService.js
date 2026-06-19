/**
 * WAI post-sesión (#98): elegibilidad, envío, skip y recordatorio.
 */
import mongoose from 'mongoose';
import SessionAllianceFeedback from '../models/SessionAllianceFeedback.js';
import User from '../models/User.js';
import {
  SESSION_WAI_AXIS_KEYS,
  SESSION_WAI_MIN_USER_CHARS,
  SESSION_WAI_MIN_USER_TURNS,
  SESSION_WAI_SCORE_MAX,
  SESSION_WAI_SCORE_MIN,
  SESSION_WAI_STATUS,
} from '../constants/sessionAllianceFeedback.js';
import metricsService from './metricsService.js';

function normalizeLanguage(language) {
  return String(language || 'es').trim().toLowerCase() === 'en' ? 'en' : 'es';
}

export function isSessionWaiExcludedFromInsight(insight) {
  if (!insight?.eligible) return true;
  if (insight.crisisTier) return true;
  if (insight.sessionPhase === 'crisis_recovered' || insight.sessionPhase === 'acute') {
    return true;
  }
  return false;
}

export function meetsSessionWaiThreshold(insight) {
  const turns = Number(insight?.userTurns) || 0;
  const chars = Number(insight?.userChars) || 0;
  return turns >= SESSION_WAI_MIN_USER_TURNS && chars >= SESSION_WAI_MIN_USER_CHARS;
}

function buildSessionMetaFromInsight(insight) {
  return {
    userTurns: insight?.userTurns ?? null,
    userChars: insight?.userChars ?? null,
    durationMinutes: insight?.durationMinutes ?? null,
    headlineSource: insight?.headlineSource ?? null,
    sessionPhase: insight?.sessionPhase ?? null,
    crisisTier: insight?.crisisTier ?? null,
    dominantEmotionKey: insight?.dominantEmotion?.key ?? null,
    dominantEmotionIntensity: insight?.dominantEmotion?.intensity ?? null,
    sessionIntention: insight?.sessionIntention ?? null,
  };
}

function validateScores(scores) {
  if (!scores || typeof scores !== 'object') return null;
  const normalized = {};
  for (const key of SESSION_WAI_AXIS_KEYS) {
    const raw = scores[key];
    const n = Number(raw);
    if (!Number.isFinite(n) || n < SESSION_WAI_SCORE_MIN || n > SESSION_WAI_SCORE_MAX) {
      return null;
    }
    normalized[key] = Math.round(n);
  }
  return normalized;
}

async function loadUserWaiReminder(userId) {
  const user = await User.findById(userId).select('stats.sessionWai').lean();
  const sw = user?.stats?.sessionWai || {};
  return {
    pendingReminder: Boolean(sw.pendingReminder),
    lastSkippedConversationId: sw.lastSkippedConversationId
      ? String(sw.lastSkippedConversationId)
      : null,
    lastSkippedAt: sw.lastSkippedAt ? new Date(sw.lastSkippedAt).toISOString() : null,
    lastSubmittedAt: sw.lastSubmittedAt ? new Date(sw.lastSubmittedAt).toISOString() : null,
  };
}

async function setUserWaiReminder(userId, patch) {
  const $set = {};
  for (const [key, value] of Object.entries(patch)) {
    $set[`stats.sessionWai.${key}`] = value;
  }
  await User.updateOne({ _id: userId }, { $set });
}

export async function getSessionAllianceFeedbackForConversation(userId, conversationId) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const cid = new mongoose.Types.ObjectId(String(conversationId));
  return SessionAllianceFeedback.findOne({ userId: uid, conversationId: cid }).lean();
}

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.conversationId
 * @param {object} params.insight - resultado de buildSessionInsight
 * @param {string} [params.language]
 */
export async function buildSessionWaiClientPayload({
  userId,
  conversationId,
  insight,
  language = 'es',
}) {
  const base = {
    eligible: false,
    alreadyRecorded: false,
    status: null,
    reminder: { show: false, hadPreviousSkip: false },
    thresholds: {
      minUserTurns: SESSION_WAI_MIN_USER_TURNS,
      minUserChars: SESSION_WAI_MIN_USER_CHARS,
    },
    axisKeys: [...SESSION_WAI_AXIS_KEYS],
  };

  if (!userId || !conversationId || !insight?.eligible) {
    return base;
  }

  if (isSessionWaiExcludedFromInsight(insight) || !meetsSessionWaiThreshold(insight)) {
    return base;
  }

  const existing = await getSessionAllianceFeedbackForConversation(userId, conversationId);
  const reminderState = await loadUserWaiReminder(userId);
  const hadPreviousSkip =
    reminderState.pendingReminder &&
    reminderState.lastSkippedConversationId &&
    reminderState.lastSkippedConversationId !== String(conversationId);

  return {
    ...base,
    eligible: true,
    alreadyRecorded: Boolean(existing),
    status: existing?.status ?? null,
    scores: existing?.status === SESSION_WAI_STATUS.SUBMITTED ? existing.scores : null,
    reminder: {
      show: hadPreviousSkip && !existing,
      hadPreviousSkip: Boolean(hadPreviousSkip),
      lastSkippedAt: reminderState.lastSkippedAt,
    },
    language: normalizeLanguage(language),
  };
}

export async function submitSessionAllianceFeedback(userId, conversationId, payload = {}) {
  const insight = payload.insight;
  if (!insight || isSessionWaiExcludedFromInsight(insight) || !meetsSessionWaiThreshold(insight)) {
    return { ok: false, code: 'not_eligible' };
  }

  const scores = validateScores(payload.scores);
  if (!scores) {
    return { ok: false, code: 'invalid_scores' };
  }

  const uid = new mongoose.Types.ObjectId(String(userId));
  const cid = new mongoose.Types.ObjectId(String(conversationId));
  const existing = await SessionAllianceFeedback.findOne({ userId: uid, conversationId: cid }).lean();
  if (existing) {
    return { ok: false, code: 'already_recorded', feedback: existing };
  }

  const now = new Date();
  const lang = normalizeLanguage(payload.language);
  const doc = await SessionAllianceFeedback.create({
    userId: uid,
    conversationId: cid,
    status: SESSION_WAI_STATUS.SUBMITTED,
    scores,
    language: lang,
    sessionMeta: buildSessionMetaFromInsight(insight),
    submittedAt: now,
  }).catch((err) => {
    if (err?.code === 11000) return null;
    throw err;
  });
  if (!doc) {
    const dup = await SessionAllianceFeedback.findOne({ userId: uid, conversationId: cid }).lean();
    return { ok: false, code: 'already_recorded', feedback: dup };
  }

  await setUserWaiReminder(userId, {
    pendingReminder: false,
    lastSubmittedAt: now,
    lastSkippedAt: null,
    lastSkippedConversationId: null,
  });

  const avg =
    SESSION_WAI_AXIS_KEYS.reduce((sum, key) => sum + scores[key], 0) / SESSION_WAI_AXIS_KEYS.length;

  metricsService
    .recordMetric(
      'session_wai_submitted',
      {
        conversationId: String(conversationId),
        avgScore: Number(avg.toFixed(2)),
        language: lang,
      },
      String(userId),
    )
    .catch(() => {});

  return { ok: true, feedback: doc.toObject() };
}

export async function skipSessionAllianceFeedback(userId, conversationId, payload = {}) {
  const insight = payload.insight;
  if (!insight || isSessionWaiExcludedFromInsight(insight) || !meetsSessionWaiThreshold(insight)) {
    return { ok: false, code: 'not_eligible' };
  }

  const uid = new mongoose.Types.ObjectId(String(userId));
  const cid = new mongoose.Types.ObjectId(String(conversationId));
  const existing = await SessionAllianceFeedback.findOne({ userId: uid, conversationId: cid }).lean();
  if (existing) {
    return { ok: false, code: 'already_recorded', feedback: existing };
  }

  const now = new Date();
  const lang = normalizeLanguage(payload.language);
  const doc = await SessionAllianceFeedback.create({
    userId: uid,
    conversationId: cid,
    status: SESSION_WAI_STATUS.SKIPPED,
    scores: null,
    language: lang,
    sessionMeta: buildSessionMetaFromInsight(insight),
    skippedAt: now,
  }).catch((err) => {
    if (err?.code === 11000) return null;
    throw err;
  });
  if (!doc) {
    const dup = await SessionAllianceFeedback.findOne({ userId: uid, conversationId: cid }).lean();
    return { ok: false, code: 'already_recorded', feedback: dup };
  }

  await setUserWaiReminder(userId, {
    pendingReminder: true,
    lastSkippedAt: now,
    lastSkippedConversationId: String(conversationId),
  });

  metricsService
    .recordMetric(
      'session_wai_skipped',
      { conversationId: String(conversationId), language: lang },
      String(userId),
    )
    .catch(() => {});

  return { ok: true, feedback: doc.toObject() };
}

export default {
  isSessionWaiExcludedFromInsight,
  meetsSessionWaiThreshold,
  buildSessionWaiClientPayload,
  submitSessionAllianceFeedback,
  skipSessionAllianceFeedback,
  getSessionAllianceFeedbackForConversation,
};
