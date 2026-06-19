/**
 * Búsqueda vectorial topicFree (#126): Atlas $vectorSearch con fallback scan+cosine.
 */
import mongoose from 'mongoose';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import { isTopicFreeEmbeddingsEnabled } from './topicFreeEmbeddingService.js';
import { cosineSimilarity } from '../utils/vectorMath.js';

const DEFAULT_INDEX = 'topic_free_embedding_index';
const DEFAULT_NUM_CANDIDATES = 150;
const DEFAULT_SCAN_LIMIT = 200;
const AFFINITY_EVENT_TYPES = new Set(['clicked', 'completed']);
const MEMORY_EVENT_TYPE = 'memory_index';
const MEMORY_INTERVENTION_ID = 'personal-pattern';

export function getAtlasVectorIndexName() {
  return (process.env.ATLAS_TOPIC_FREE_VECTOR_INDEX || DEFAULT_INDEX).trim() || DEFAULT_INDEX;
}

export function isAtlasVectorSearchEnabled() {
  if (!isTopicFreeEmbeddingsEnabled()) return false;
  const flag = String(process.env.ATLAS_VECTOR_SEARCH_ENABLED ?? '').trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'off') return false;
  return flag === 'true' || flag === '1' || flag === 'on';
}

export function getVectorSearchMode() {
  if (!isTopicFreeEmbeddingsEnabled()) return 'off';
  if (isAtlasVectorSearchEnabled()) return 'atlas';
  return 'scan';
}

function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return value;
}

/**
 * Pipeline MongoDB Atlas Vector Search (#126).
 */
export function buildAtlasVectorSearchPipeline({
  userId,
  queryVector,
  since = null,
  limit = 20,
  numCandidates = DEFAULT_NUM_CANDIDATES,
  eventTypes = null,
  interventionId = null,
} = {}) {
  const filter = { userId: toObjectId(userId) };
  if (since instanceof Date && !Number.isNaN(since.getTime())) {
    filter.createdAt = { $gte: since };
  }
  if (Array.isArray(eventTypes) && eventTypes.length > 0) {
    filter.eventType = { $in: eventTypes };
  }
  if (interventionId) {
    filter.interventionId = String(interventionId);
  }
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safeCandidates = Math.max(safeLimit, Math.min(Number(numCandidates) || DEFAULT_NUM_CANDIDATES, 500));

  return [
    {
      $vectorSearch: {
        index: getAtlasVectorIndexName(),
        path: 'topicFreeEmbedding',
        queryVector,
        numCandidates: safeCandidates,
        limit: safeLimit,
        filter,
      },
    },
    {
      $project: {
        interventionId: 1,
        conversationId: 1,
        topicFree: 1,
        eventType: 1,
        topicTag: 1,
        topicFreeEmbedding: 1,
        createdAt: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];
}

/**
 * Definición del índice vectorial para Atlas Search (documentación / setup manual).
 */
export function getAtlasTopicFreeVectorIndexDefinition() {
  const dimensions = Number(process.env.TOPIC_FREE_EMBEDDING_DIMENSIONS) || 1536;
  return {
    name: getAtlasVectorIndexName(),
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'topicFreeEmbedding',
          numDimensions: dimensions,
          similarity: 'cosine',
        },
        {
          type: 'filter',
          path: 'userId',
        },
        {
          type: 'filter',
          path: 'createdAt',
        },
        {
          type: 'filter',
          path: 'eventType',
        },
        {
          type: 'filter',
          path: 'interventionId',
        },
      ],
    },
  };
}

function filterAffinityEvents(events) {
  return (events || []).filter((ev) => {
    const id = String(ev?.interventionId || '').trim();
    const type = String(ev?.eventType || '').trim();
    return id && AFFINITY_EVENT_TYPES.has(type);
  });
}

async function scanSimilarTopicFreeEvents({ userId, queryVector, since, limit = 20 }) {
  if (!userId || !Array.isArray(queryVector) || queryVector.length === 0) return [];

  const query = {
    userId: toObjectId(userId),
    topicFree: { $exists: true, $nin: [null, ''] },
    eventType: { $in: [...AFFINITY_EVENT_TYPES] },
    topicFreeEmbedding: { $exists: true, $not: { $size: 0 } },
  };
  if (since instanceof Date && !Number.isNaN(since.getTime())) {
    query.createdAt = { $gte: since };
  }

  const docs = await ChatInterventionEvent.find(query)
    .select('+topicFreeEmbedding interventionId topicFree eventType topicTag createdAt')
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(DEFAULT_SCAN_LIMIT, 400)))
    .lean();

  const ranked = docs
    .map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.topicFreeEmbedding),
    }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 100)));

  return ranked;
}

/**
 * Eventos topicFree semánticamente similares (clicked/completed).
 * @returns {Promise<Array>}
 */
export async function findSimilarTopicFreeEvents({
  userId,
  queryVector,
  since = null,
  limit = 20,
} = {}) {
  if (!userId || !Array.isArray(queryVector) || queryVector.length === 0) return [];

  if (isAtlasVectorSearchEnabled()) {
    try {
      const pipeline = buildAtlasVectorSearchPipeline({ userId, queryVector, since, limit });
      const results = await ChatInterventionEvent.aggregate(pipeline);
      const filtered = filterAffinityEvents(results);
      if (filtered.length > 0) return filtered;
    } catch (error) {
      console.warn('[topicFreeVectorSearch] atlas failed, fallback scan:', error?.message || error);
    }
  }

  return scanSimilarTopicFreeEvents({ userId, queryVector, since, limit });
}

function filterMemoryIndexEvents(events) {
  return (events || []).filter((ev) => {
    const id = String(ev?.interventionId || '').trim();
    const type = String(ev?.eventType || '').trim();
    return id === MEMORY_INTERVENTION_ID && type === MEMORY_EVENT_TYPE;
  });
}

async function scanSimilarMemoryIndexEvents({ userId, queryVector, since, limit = 20 }) {
  if (!userId || !Array.isArray(queryVector) || queryVector.length === 0) return [];

  const query = {
    userId: toObjectId(userId),
    interventionId: MEMORY_INTERVENTION_ID,
    eventType: MEMORY_EVENT_TYPE,
    topicFree: { $exists: true, $nin: [null, ''] },
    topicFreeEmbedding: { $exists: true, $not: { $size: 0 } },
  };
  if (since instanceof Date && !Number.isNaN(since.getTime())) {
    query.createdAt = { $gte: since };
  }

  const docs = await ChatInterventionEvent.find(query)
    .select('+topicFreeEmbedding interventionId conversationId topicFree eventType topicTag createdAt')
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(DEFAULT_SCAN_LIMIT, 400)))
    .lean();

  return docs
    .map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.topicFreeEmbedding),
    }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 100)));
}

/**
 * Eventos memory_index (#203) semánticamente similares.
 */
export async function findSimilarMemoryIndexEvents({
  userId,
  queryVector,
  since = null,
  limit = 20,
} = {}) {
  if (!userId || !Array.isArray(queryVector) || queryVector.length === 0) return [];

  if (isAtlasVectorSearchEnabled()) {
    try {
      const pipeline = buildAtlasVectorSearchPipeline({
        userId,
        queryVector,
        since,
        limit,
        eventTypes: [MEMORY_EVENT_TYPE],
        interventionId: MEMORY_INTERVENTION_ID,
      });
      const results = await ChatInterventionEvent.aggregate(pipeline);
      const filtered = filterMemoryIndexEvents(results);
      if (filtered.length > 0) return filtered;
    } catch (error) {
      console.warn('[topicFreeVectorSearch] atlas memory failed, fallback scan:', error?.message || error);
    }
  }

  return scanSimilarMemoryIndexEvents({ userId, queryVector, since, limit });
}

export default {
  getAtlasVectorIndexName,
  isAtlasVectorSearchEnabled,
  getVectorSearchMode,
  buildAtlasVectorSearchPipeline,
  getAtlasTopicFreeVectorIndexDefinition,
  findSimilarTopicFreeEvents,
  findSimilarMemoryIndexEvents,
};
