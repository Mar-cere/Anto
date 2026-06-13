/**
 * Telemetría de tecleo agregada (#215).
 */
import mongoose from 'mongoose';
import ChatTypingTelemetryEvent from '../models/ChatTypingTelemetryEvent.js';
import Conversation from '../models/Conversation.js';

const MIN_DRAFT_MS = 400;
const DEDUPE_WINDOW_MS = 5000;

export function computeCognitiveLoadScore({
  draftDurationMs = 0,
  avgFlightTimeMs = 0,
  backspaceRate = 0,
  revisionCount = 0,
} = {}) {
  const dwellNorm = Math.min(1, Number(draftDurationMs) / 120000);
  const flightNorm = Math.min(1, Number(avgFlightTimeMs) / 900);
  const revisionNorm = Math.min(1, Number(revisionCount) / 5);
  const backspaceNorm = Math.min(1, Math.max(0, Number(backspaceRate)));
  return Math.min(
    1,
    backspaceNorm * 0.38 + revisionNorm * 0.28 + dwellNorm * 0.2 + flightNorm * 0.14,
  );
}

export function sanitizeTypingTelemetryPayload(payload = {}) {
  const draftDurationMs = Math.max(0, Math.min(Number(payload.draftDurationMs) || 0, 600000));
  const avgFlightTimeMs = Math.max(0, Math.min(Number(payload.avgFlightTimeMs) || 0, 10000));
  const backspaceRate = Math.max(0, Math.min(Number(payload.backspaceRate) || 0, 1));
  const revisionCount = Math.max(0, Math.min(Number(payload.revisionCount) || 0, 50));
  const charCountFinal = Math.max(0, Math.min(Number(payload.charCountFinal) || 0, 4000));
  const hasSignal =
    draftDurationMs >= MIN_DRAFT_MS &&
    (charCountFinal > 0 || revisionCount > 0 || backspaceRate > 0);
  if (!hasSignal) return null;
  return {
    draftDurationMs,
    avgFlightTimeMs,
    backspaceRate,
    revisionCount,
    charCountFinal,
    cognitiveLoadScore: computeCognitiveLoadScore({
      draftDurationMs,
      avgFlightTimeMs,
      backspaceRate,
      revisionCount,
    }),
  };
}

async function assertConversationOwnedByUser(userId, conversationId) {
  if (!conversationId) return true;
  if (!mongoose.Types.ObjectId.isValid(String(conversationId))) return false;
  const conv = await Conversation.findOne({
    _id: conversationId,
    userId,
  })
    .select('_id')
    .lean();
  return Boolean(conv?._id);
}

async function findRecentDuplicate({ userId, conversationId, charCountFinal }) {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const query = {
    userId,
    submittedAt: { $gte: since },
    charCountFinal,
  };
  if (conversationId) query.conversationId = conversationId;
  else query.conversationId = null;

  return ChatTypingTelemetryEvent.findOne(query).select('_id').lean();
}

export async function recordTypingTelemetryEvent({
  userId,
  conversationId = null,
  sessionId = null,
  payload = {},
}) {
  if (!userId) return null;
  const sanitized = sanitizeTypingTelemetryPayload(payload);
  if (!sanitized) return null;

  if (conversationId) {
    const owned = await assertConversationOwnedByUser(userId, conversationId);
    if (!owned) return null;
  }

  const dup = await findRecentDuplicate({
    userId,
    conversationId,
    charCountFinal: sanitized.charCountFinal,
  });
  if (dup?._id) return dup;

  return ChatTypingTelemetryEvent.create({
    userId,
    conversationId,
    sessionId: sessionId ? String(sessionId).slice(0, 64) : null,
    ...sanitized,
    submittedAt: new Date(),
  });
}

export async function aggregateTypingTelemetry({ userId, since, until = null }) {
  if (!userId || !(since instanceof Date)) {
    return { count: 0, avgCognitiveLoad: 0, avgBackspaceRate: 0, avgDraftDurationMs: 0 };
  }
  const query = { userId, submittedAt: { $gte: since } };
  if (until instanceof Date) query.submittedAt.$lt = until;

  const rows = await ChatTypingTelemetryEvent.find(query)
    .select('cognitiveLoadScore backspaceRate draftDurationMs revisionCount avgFlightTimeMs')
    .lean();
  if (rows.length === 0) {
    return { count: 0, avgCognitiveLoad: 0, avgBackspaceRate: 0, avgDraftDurationMs: 0 };
  }

  let load = 0;
  let backspace = 0;
  let dwell = 0;
  for (const row of rows) {
    load += Number(row.cognitiveLoadScore) || 0;
    backspace += Number(row.backspaceRate) || 0;
    dwell += Number(row.draftDurationMs) || 0;
  }
  const count = rows.length;
  return {
    count,
    avgCognitiveLoad: load / count,
    avgBackspaceRate: backspace / count,
    avgDraftDurationMs: dwell / count,
    highLoadSessions: rows.filter((r) => (Number(r.cognitiveLoadScore) || 0) >= 0.62).length,
  };
}

export default {
  computeCognitiveLoadScore,
  sanitizeTypingTelemetryPayload,
  recordTypingTelemetryEvent,
  aggregateTypingTelemetry,
};
