/**
 * Embeddings OpenAI para afinidad topicFree (#218 fase 3 / #126 lite).
 * Opt-in vía TOPIC_FREE_EMBEDDINGS_ENABLED; no bloquea el chat.
 */
import crypto from 'crypto';
import OpenAI from 'openai';
import { cosineSimilarity } from '../utils/vectorMath.js';
import { withTimeout } from '../utils/withTimeout.js';

const DEFAULT_MODEL = 'text-embedding-3-small';
const DEFAULT_MIN_SIMILARITY = 0.68;
const DEFAULT_TIMEOUT_MS = 8000;
const CACHE_MAX_ENTRIES = 500;

let openaiClient = null;
const embeddingCache = new Map();

export function getTopicFreeEmbeddingModel() {
  return (process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
}

export function getTopicFreeEmbeddingMinSimilarity() {
  const parsed = Number(process.env.TOPIC_FREE_EMBEDDING_MIN_SIMILARITY);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 1
    ? parsed
    : DEFAULT_MIN_SIMILARITY;
}

export function isTopicFreeEmbeddingsEnabled() {
  if (process.env.TOPIC_FREE_EMBEDDINGS_ENABLED !== 'true') return false;
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getTopicFreeEmbeddingTimeoutMs() {
  const parsed = Number(process.env.TOPIC_FREE_EMBEDDING_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function buildCacheKey(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function rememberInCache(key, vector) {
  if (embeddingCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = embeddingCache.keys().next().value;
    if (oldest) embeddingCache.delete(oldest);
  }
  embeddingCache.set(key, vector);
}

export function clearTopicFreeEmbeddingCache() {
  embeddingCache.clear();
}

/**
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
export async function embedTopicFreeText(text) {
  const normalized = String(text || '').trim();
  if (!normalized || !isTopicFreeEmbeddingsEnabled()) return null;

  const cacheKey = buildCacheKey(normalized);
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await withTimeout(
      client.embeddings.create({
        model: getTopicFreeEmbeddingModel(),
        input: normalized.slice(0, 8192),
      }),
      getTopicFreeEmbeddingTimeoutMs(),
      { label: 'topicFreeEmbedding' },
    );
    const vector = response?.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) return null;
    rememberInCache(cacheKey, vector);
    return vector;
  } catch (error) {
    console.warn('[topicFreeEmbedding] embed failed:', error?.message || error);
    return null;
  }
}

/**
 * Enriquece eventos históricos sin vector persistido (lazy, best-effort).
 * @param {Array<{ topicFree?, topicFreeEmbedding? }>} events
 */
export async function enrichTopicFreeEventsWithEmbeddings(events) {
  if (!isTopicFreeEmbeddingsEnabled() || !Array.isArray(events) || events.length === 0) {
    return events || [];
  }

  const hasStoredEmbedding = (ev) =>
    Array.isArray(ev?.topicFreeEmbedding) && ev.topicFreeEmbedding.length > 0;

  const missingTexts = [
    ...new Set(
      events
        .filter((ev) => ev?.topicFree && !hasStoredEmbedding(ev))
        .map((ev) => String(ev.topicFree)),
    ),
  ];
  if (missingTexts.length === 0) return events;

  const vectors = new Map();
  for (const text of missingTexts) {
    const vector = await embedTopicFreeText(text);
    if (vector) vectors.set(text, vector);
  }

  return events.map((ev) => {
    if (hasStoredEmbedding(ev)) return ev;
    const vector = vectors.get(String(ev?.topicFree || ''));
    return vector ? { ...ev, topicFreeEmbedding: vector } : ev;
  });
}

/**
 * Persiste embeddings en documentos recién insertados (async, no bloquea request).
 * @param {Array<{ _id, topicFree }>} docs
 */
export async function persistTopicFreeEmbeddingsForDocs(docs, { updateModel } = {}) {
  if (!isTopicFreeEmbeddingsEnabled() || !Array.isArray(docs) || docs.length === 0) return;

  const ChatInterventionEvent = updateModel;
  if (!ChatInterventionEvent?.updateMany) return;

  const byText = new Map();
  for (const doc of docs) {
    const text = String(doc?.topicFree || '').trim();
    const id = doc?._id;
    if (!text || !id) continue;
    if (!byText.has(text)) byText.set(text, []);
    byText.get(text).push(id);
  }

  for (const [text, ids] of byText.entries()) {
    const vector = await embedTopicFreeText(text);
    if (!vector) continue;
    await ChatInterventionEvent.updateMany(
      { _id: { $in: ids } },
      { $set: { topicFreeEmbedding: vector } },
    ).catch((err) => {
      console.warn('[topicFreeEmbedding] persist failed:', err?.message || err);
    });
  }
}

export { cosineSimilarity };

export default {
  isTopicFreeEmbeddingsEnabled,
  getTopicFreeEmbeddingModel,
  getTopicFreeEmbeddingMinSimilarity,
  getTopicFreeEmbeddingTimeoutMs,
  embedTopicFreeText,
  enrichTopicFreeEventsWithEmbeddings,
  persistTopicFreeEmbeddingsForDocs,
  clearTopicFreeEmbeddingCache,
  cosineSimilarity,
};
