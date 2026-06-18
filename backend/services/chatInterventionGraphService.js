import crypto from 'crypto';
import mongoose from 'mongoose';
import { getInterventionCatalogEntry, isValidInterventionId } from '../constants/interventionCatalog.js';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import Conversation from '../models/Conversation.js';
import { persistTopicFreeEmbeddingsForDocs } from './topicFreeEmbeddingService.js';
import {
  buildTopicFreeFromContinuityItem,
  buildTopicFreeFromUserContent,
} from '../utils/interventionTopicFree.js';
import {
  sanitizeInterventionEventMeta,
  sanitizeInterventionSource,
  sanitizeInterventionTopicFree,
  sanitizeInterventionTopicTag,
} from '../utils/interventionEventGuards.js';
import {
  mapInterventionIdToEngagementSignal,
  recordEngagementSignal,
} from './engagementStreakService.js';

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

async function resolveGraphConversationId(userId) {
  const uid = toObjectId(userId);
  const latest = await Conversation.findOne({ userId: uid, isGuest: { $ne: true } })
    .sort({ updatedAt: -1 })
    .select('_id')
    .lean();
  if (latest?._id) return latest._id;

  const conversation = await Conversation.create({ userId: uid });
  return conversation._id;
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
  const select =
    '+topicFreeEmbedding sessionId topicTag topicFree riskLevel assistantMessageId interventionType createdAt conversationId';
  const queryBase = {
    userId: toObjectId(userId),
    interventionId: String(interventionId),
    eventType: 'shown',
    createdAt: { $gte: since },
  };

  let lastShown = await ChatInterventionEvent.findOne({
    ...queryBase,
    conversationId: toObjectId(conversationId),
  })
    .sort({ createdAt: -1 })
    .select(select)
    .lean();

  // Biblioteca vs chat activo: heredar shown aunque esté en otra conversación del mismo usuario.
  if (!lastShown) {
    lastShown = await ChatInterventionEvent.findOne(queryBase)
      .sort({ createdAt: -1 })
      .select(select)
      .lean();
  }

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
  userContent = null,
  riskLevel = null,
  source = 'chat_suggestions_v1',
}) {
  if (!userId || !conversationId || !Array.isArray(suggestions) || suggestions.length === 0) return;

  const now = new Date();
  const sessionId = await resolveSessionId({ userId, conversationId, now });
  const topicTag = safeTopicTag(emotionalAnalysis, contextualAnalysis);
  const topicFree = buildTopicFreeFromUserContent(userContent);

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
        topicFree,
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
  const inserted = await ChatInterventionEvent.insertMany(docs, { ordered: false });
  void persistTopicFreeEmbeddingsForDocs(inserted, { updateModel: ChatInterventionEvent }).catch(
    () => {},
  );
}

async function hasShownSuggestionsInActiveSession({ userId, conversationId, now = new Date() }) {
  if (!userId || !conversationId) return false;
  const since = new Date(now.getTime() - DEFAULT_SESSION_GAP_MINUTES * 60 * 1000);
  const existing = await ChatInterventionEvent.findOne({
    userId: toObjectId(userId),
    conversationId: toObjectId(conversationId),
    eventType: 'shown',
    createdAt: { $gte: since },
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

/**
 * Grafo fase 2 (#218): agrega por snippet topicFree → intervención (sesión lógica).
 */
export function buildTopicFreeGraphPipeline({ userId, since, limit = 40 }) {
  const uid = toObjectId(userId);
  return [
    {
      $match: {
        userId: uid,
        createdAt: { $gte: since },
        topicFree: { $type: 'string', $nin: [null, ''] },
        interventionId: { $type: 'string' },
        sessionId: { $type: 'string' },
      },
    },
    {
      $group: {
        _id: {
          sessionId: '$sessionId',
          topicFree: '$topicFree',
          interventionId: '$interventionId',
        },
        topicTag: { $first: '$topicTag' },
        shown: { $max: { $cond: [{ $eq: ['$eventType', 'shown'] }, 1, 0] } },
        clicked: { $max: { $cond: [{ $eq: ['$eventType', 'clicked'] }, 1, 0] } },
        dismissed: { $max: { $cond: [{ $eq: ['$eventType', 'dismissed'] }, 1, 0] } },
        completed: { $max: { $cond: [{ $eq: ['$eventType', 'completed'] }, 1, 0] } },
        lastAt: { $max: '$createdAt' },
      },
    },
    {
      $group: {
        _id: { topicFree: '$_id.topicFree', interventionId: '$_id.interventionId' },
        topicTag: { $first: '$topicTag' },
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
    { $limit: Math.max(1, Math.min(limit, 120)) },
  ];
}

async function aggregateTopicFreeGraph({ userId, since, limit = 40 }) {
  if (!userId || !(since instanceof Date) || Number.isNaN(since.getTime())) {
    return [];
  }
  const pipeline = buildTopicFreeGraphPipeline({ userId, since, limit });
  return ChatInterventionEvent.aggregate(pipeline);
}

async function findTopicFreeAffinityEvents({ userId, since, limit = 100 }) {
  if (!userId || !(since instanceof Date) || Number.isNaN(since.getTime())) {
    return [];
  }
  return ChatInterventionEvent.find({
    userId: toObjectId(userId),
    createdAt: { $gte: since },
    topicFree: { $exists: true, $nin: [null, ''] },
    eventType: { $in: ['clicked', 'completed'] },
  })
    .select('+topicFreeEmbedding interventionId topicFree eventType')
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 200)))
    .lean();
}

async function recordContinuityItemsShown({
  userId,
  conversationId,
  items = [],
  source = 'chat_continuity_v1',
}) {
  if (!userId || !conversationId || !Array.isArray(items) || items.length === 0) return;

  const now = new Date();
  const sessionId = await resolveSessionId({ userId, conversationId, now });
  const docs = [];

  for (const item of items) {
    const interventionId = String(item?.interventionId || '').trim();
    if (!isValidInterventionId(interventionId)) continue;

    const dup = await isDuplicateEvent({
      userId,
      conversationId,
      sessionId,
      interventionId,
      eventType: 'shown',
      now,
    }).catch(() => false);
    if (dup) continue;

    const topicFree = buildTopicFreeFromContinuityItem(item);
    docs.push({
      userId,
      conversationId,
      sessionId,
      assistantMessageId: null,
      interventionId,
      interventionType: String(item?.kind || item?.interventionType || 'technique'),
      topicTag: 'continuity',
      topicFree,
      eventType: 'shown',
      source,
      riskLevel: null,
      meta: { continuityId: item?.id || null },
      createdAt: now,
    });
  }

  if (docs.length === 0) return;
  const inserted = await ChatInterventionEvent.insertMany(docs, { ordered: false });
  void persistTopicFreeEmbeddingsForDocs(inserted, { updateModel: ChatInterventionEvent }).catch(
    () => {},
  );
}

async function recordLibraryInterventionShown({
  userId,
  conversationId,
  interventionId,
  topicTag = 'library',
  topicFree = null,
  source = 'library_v1',
}) {
  const id = String(interventionId || '').trim();
  if (!userId || !conversationId || !isValidInterventionId(id)) return;

  const now = new Date();
  const sessionId = await resolveSessionId({ userId, conversationId, now });
  const entry = getInterventionCatalogEntry(id);
  const safeTopicTag = sanitizeInterventionTopicTag(topicTag, 'library');
  const safeTopicFree = sanitizeInterventionTopicFree(topicFree);
  const safeSource = sanitizeInterventionSource(source, 'library_v1');

  const dup = await isDuplicateEvent({
    userId,
    conversationId,
    sessionId,
    interventionId: id,
    eventType: 'shown',
    now,
  }).catch(() => false);
  if (dup) return;

  const inserted = await ChatInterventionEvent.insertMany(
    [
      {
        userId,
        conversationId,
        sessionId,
        assistantMessageId: null,
        interventionId: id,
        interventionType: entry?.type || 'technique',
        topicTag: safeTopicTag,
        topicFree: safeTopicFree,
        eventType: 'shown',
        source: safeSource,
        riskLevel: null,
        meta: { surface: 'library' },
        createdAt: now,
      },
    ],
    { ordered: false },
  );
  void persistTopicFreeEmbeddingsForDocs(inserted, { updateModel: ChatInterventionEvent }).catch(
    () => {},
  );
}

/**
 * Apertura desde biblioteca/técnicas: shown + clicked en el grafo (#127).
 */
async function recordLibraryInterventionOpened({
  userId,
  interventionId,
  topicTag = 'library',
  topicFree = null,
  source = 'library_v1',
}) {
  const id = String(interventionId || '').trim();
  if (!userId || !isValidInterventionId(id)) return;

  const conversationId = await resolveGraphConversationId(userId).catch(() => null);
  if (!conversationId) return;

  await recordLibraryInterventionShown({
    userId,
    conversationId,
    interventionId: id,
    topicTag,
    topicFree,
    source,
  }).catch(() => {});

  await recordInterventionEvent({
    userId,
    conversationId,
    interventionId: id,
    eventType: 'clicked',
    source,
    meta: { surface: 'library' },
  }).catch(() => {});
}

async function recordUserInterventionEvent({
  userId,
  interventionId,
  eventType,
  source = 'library_v1',
  topicTag = 'library',
  topicFree = null,
  meta = {},
}) {
  const ev = String(eventType || '').trim();
  const id = String(interventionId || '').trim();
  if (!userId || !isValidInterventionId(id)) return;

  const safeTopicTag = sanitizeInterventionTopicTag(topicTag, 'library');
  const safeTopicFree = sanitizeInterventionTopicFree(topicFree);
  const safeSource = sanitizeInterventionSource(source, 'library_v1');
  const safeMeta = sanitizeInterventionEventMeta(meta);

  if (ev === 'opened') {
    await recordLibraryInterventionOpened({
      userId,
      interventionId: id,
      topicTag: safeTopicTag,
      topicFree: safeTopicFree,
      source: safeSource,
    });
    return;
  }

  const conversationId = await resolveGraphConversationId(userId).catch(() => null);
  if (!conversationId) return;

  if (ev === 'shown') {
    await recordLibraryInterventionShown({
      userId,
      conversationId,
      interventionId: id,
      topicTag: safeTopicTag,
      topicFree: safeTopicFree,
      source: safeSource,
    });
    return;
  }

  if (!['clicked', 'dismissed', 'completed'].includes(ev)) return;

  await recordInterventionEvent({
    userId,
    conversationId,
    interventionId: id,
    eventType: ev,
    source: safeSource,
    meta: safeMeta,
  });
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
  if (!userId || !conversationId) return;
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
    topicFreeEmbedding: shownCtx?.topicFreeEmbedding ?? null,
    eventType: ev,
    source,
    riskLevel: riskLevel ? String(riskLevel) : inheritedRiskLevel,
    meta: sanitizeInterventionEventMeta(meta && typeof meta === 'object' ? meta : {}),
    createdAt: now,
  });

  if (ev === 'completed') {
    const signal = mapInterventionIdToEngagementSignal(id);
    if (signal) {
      recordEngagementSignal(userId, signal).catch(() => {});
    }
  }
}

export default {
  recordSuggestionEventsShown,
  recordContinuityItemsShown,
  recordInterventionEvent,
  recordLibraryInterventionOpened,
  recordUserInterventionEvent,
  resolveGraphConversationId,
  hasShownSuggestionsInActiveSession,
  aggregateInterventionGraph,
  aggregateTopicFreeGraph,
  findTopicFreeAffinityEvents,
  buildSessionAggregatedGraphPipeline,
  buildTopicFreeGraphPipeline,
};

