import crypto from 'crypto';
import mongoose from 'mongoose';
import { isValidInterventionId } from '../constants/interventionCatalog.js';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';

const DEFAULT_SESSION_GAP_MINUTES = 45;
const DEFAULT_EVENT_DEDUPE_SECONDS = 8;
const DEFAULT_SHOWN_CONTEXT_LOOKBACK_HOURS = 12;

function safeTopicTag(emotionalAnalysis, contextualAnalysis) {
  const raw =
    emotionalAnalysis?.topic ||
    contextualAnalysis?.tema ||
    contextualAnalysis?.topic ||
    contextualAnalysis?.topicTag ||
    'general';
  const t = String(raw || 'general').trim().toLowerCase().slice(0, 64);
  return t || 'general';
}

function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return value;
}

async function resolveSessionId({ userId, conversationId, now = new Date() }) {
  const last = await ChatInterventionEvent.findOne({
    userId,
    conversationId,
  })
    .sort({ createdAt: -1 })
    .select('sessionId createdAt')
    .lean();

  if (!last?.sessionId || !last?.createdAt) return crypto.randomUUID();
  const gapMinutes = (now.getTime() - new Date(last.createdAt).getTime()) / (1000 * 60);
  if (!Number.isFinite(gapMinutes) || gapMinutes >= DEFAULT_SESSION_GAP_MINUTES) {
    return crypto.randomUUID();
  }
  return String(last.sessionId);
}

async function findRecentShownContext({ userId, conversationId, interventionId, now }) {
  const since = new Date(now.getTime() - DEFAULT_SHOWN_CONTEXT_LOOKBACK_HOURS * 60 * 60 * 1000);
  const lastShown = await ChatInterventionEvent.findOne({
    userId,
    conversationId,
    interventionId: String(interventionId),
    eventType: 'shown',
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .select('sessionId topicTag topicFree riskLevel assistantMessageId interventionType createdAt')
    .lean();

  return lastShown || null;
}

async function isDuplicateEvent({ userId, conversationId, sessionId, interventionId, eventType, now }) {
  const since = new Date(now.getTime() - DEFAULT_EVENT_DEDUPE_SECONDS * 1000);
  const existing = await ChatInterventionEvent.findOne({
    userId,
    conversationId,
    sessionId: String(sessionId),
    interventionId: String(interventionId),
    eventType: String(eventType),
    createdAt: { $gte: since },
  })
    .select('_id')
    .lean();
  return !!existing?._id;
}

async function recordSuggestionEventsShown({
  userId,
  conversationId,
  assistantMessageId = null,
  suggestions = [],
  emotionalAnalysis,
  contextualAnalysis,
  riskLevel = null,
  source = 'chat_suggestions_v1',
}) {
  if (!userId || !conversationId || !Array.isArray(suggestions) || suggestions.length === 0) return;

  const now = new Date();
  const sessionId = await resolveSessionId({ userId, conversationId, now });
  const topicTag = safeTopicTag(emotionalAnalysis, contextualAnalysis);

  const docs = suggestions
    .map((s) => {
      const interventionId = String(s?.id || '').trim();
      if (!isValidInterventionId(interventionId)) return null;
      return {
        userId,
        conversationId,
        sessionId,
        assistantMessageId,
        interventionId,
        interventionType: typeof s?.interventionType === 'string' ? s.interventionType : 'technique',
        topicTag,
        topicFree: null,
        eventType: 'shown',
        source,
        riskLevel: riskLevel ? String(riskLevel) : null,
        meta: {
          label: typeof s?.label === 'string' ? s.label.slice(0, 120) : null,
          tags: Array.isArray(s?.tags) ? s.tags.slice(0, 12) : [],
          screen: typeof s?.screen === 'string' ? s.screen : null,
        },
        createdAt: now,
      };
    })
    .filter(Boolean);

  if (docs.length === 0) return;
  await ChatInterventionEvent.insertMany(docs, { ordered: false });
}

async function hasShownSuggestionsInActiveSession({ userId, conversationId, now = new Date() }) {
  if (!userId || !conversationId) return false;
  const sessionId = await resolveSessionId({ userId, conversationId, now });
  const existing = await ChatInterventionEvent.findOne({
    userId,
    conversationId,
    sessionId: String(sessionId),
    eventType: 'shown',
  })
    .select('_id')
    .lean();
  return !!existing?._id;
}

/**
 * Pipeline de agregación por sesión lógica (#127): cada (sessionId, topic, intervención) cuenta como 0/1.
 */
export function buildSessionAggregatedGraphPipeline({ userId, since, limit = 60 }) {
  const uid = toObjectId(userId);
  return [
    {
      $match: {
        userId: uid,
        createdAt: { $gte: since },
        interventionId: { $type: 'string' },
        sessionId: { $type: 'string' },
      },
    },
    {
      $group: {
        _id: {
          sessionId: '$sessionId',
          topicTag: '$topicTag',
          interventionId: '$interventionId',
        },
        shown: { $max: { $cond: [{ $eq: ['$eventType', 'shown'] }, 1, 0] } },
        clicked: { $max: { $cond: [{ $eq: ['$eventType', 'clicked'] }, 1, 0] } },
        dismissed: { $max: { $cond: [{ $eq: ['$eventType', 'dismissed'] }, 1, 0] } },
        completed: { $max: { $cond: [{ $eq: ['$eventType', 'completed'] }, 1, 0] } },
        lastAt: { $max: '$createdAt' },
      },
    },
    {
      $group: {
        _id: { topicTag: '$_id.topicTag', interventionId: '$_id.interventionId' },
        shown: { $sum: '$shown' },
        clicked: { $sum: '$clicked' },
        dismissed: { $sum: '$dismissed' },
        completed: { $sum: '$completed' },
        lastAt: { $max: '$lastAt' },
      },
    },
    {
      $addFields: {
        ctr: {
          $cond: [{ $gt: ['$shown', 0] }, { $divide: ['$clicked', '$shown'] }, 0],
        },
        completionRate: {
          $cond: [{ $gt: ['$clicked', 0] }, { $divide: ['$completed', '$clicked'] }, 0],
        },
      },
    },
    { $sort: { shown: -1, clicked: -1, completed: -1 } },
    { $limit: limit },
  ];
}

async function aggregateInterventionGraph({ userId, since, limit }) {
  if (!userId || !(since instanceof Date) || Number.isNaN(since.getTime())) {
    return [];
  }
  const pipeline = buildSessionAggregatedGraphPipeline({ userId, since, limit });
  return ChatInterventionEvent.aggregate(pipeline);
}

async function recordInterventionEvent({
  userId,
  conversationId,
  interventionId,
  eventType,
  assistantMessageId = null,
  emotionalAnalysis = null,
  contextualAnalysis = null,
  riskLevel = null,
  source = 'chat_suggestions_v1',
  meta = {},
}) {
  const ev = String(eventType || '').trim();
  if (!['clicked', 'dismissed', 'completed'].includes(ev)) return;
  const id = String(interventionId || '').trim();
  if (!isValidInterventionId(id)) return;

  const now = new Date();
  const shownCtx = await findRecentShownContext({
    userId,
    conversationId,
    interventionId: id,
    now,
  }).catch(() => null);

  // Preferimos heredar la sesión/tema de la sugerencia mostrada para que el grafo sea consistente.
  const sessionId = shownCtx?.sessionId
    ? String(shownCtx.sessionId)
    : await resolveSessionId({ userId, conversationId, now });
  const topicTag = shownCtx?.topicTag ? String(shownCtx.topicTag) : safeTopicTag(emotionalAnalysis, contextualAnalysis);
  const inheritedRiskLevel =
    shownCtx?.riskLevel != null && shownCtx?.riskLevel !== '' ? String(shownCtx.riskLevel) : null;
  const inheritedAssistantMessageId = shownCtx?.assistantMessageId || null;

  // Deduplicación defensiva (doble tap / doble submit).
  const dup = await isDuplicateEvent({
    userId,
    conversationId,
    sessionId,
    interventionId: id,
    eventType: ev,
    now,
  }).catch(() => false);
  if (dup) return;

  await ChatInterventionEvent.create({
    userId,
    conversationId,
    sessionId,
    assistantMessageId: assistantMessageId || inheritedAssistantMessageId,
    interventionId: id,
    interventionType:
      typeof meta?.interventionType === 'string'
        ? meta.interventionType
        : shownCtx?.interventionType || 'technique',
    topicTag,
    topicFree: shownCtx?.topicFree ?? null,
    eventType: ev,
    source,
    riskLevel: riskLevel ? String(riskLevel) : inheritedRiskLevel,
    meta: meta && typeof meta === 'object' ? meta : {},
    createdAt: now,
  });
}

export default {
  recordSuggestionEventsShown,
  recordInterventionEvent,
  hasShownSuggestionsInActiveSession,
  aggregateInterventionGraph,
  buildSessionAggregatedGraphPipeline,
};

