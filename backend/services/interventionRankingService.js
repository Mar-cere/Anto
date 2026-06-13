/**
 * Ranking de intervenciones a partir del grafo #127 (histórico del usuario).
 */
import chatInterventionGraphService from './chatInterventionGraphService.js';
import {
  embedTopicFreeText,
  enrichTopicFreeEventsWithEmbeddings,
  getTopicFreeEmbeddingMinSimilarity,
  isTopicFreeEmbeddingsEnabled,
} from './topicFreeEmbeddingService.js';
import { buildTopicFreeFromUserContent } from '../utils/interventionTopicFree.js';
import { cosineSimilarity } from '../utils/vectorMath.js';

const DEFAULT_RANKING_DAYS = 30;
const DEFAULT_GRAPH_LIMIT = 120;

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

/**
 * @param {{ shown?, clicked?, dismissed?, completed?, ctr?, completionRate? }} edge
 */
export function scoreInterventionEdge(edge) {
  if (!edge || typeof edge !== 'object') return 0;
  const shown = Number(edge.shown) || 0;
  const clicked = Number(edge.clicked) || 0;
  const dismissed = Number(edge.dismissed) || 0;
  const completed = Number(edge.completed) || 0;
  const ctr = shown > 0 ? clicked / shown : Number(edge.ctr) || 0;
  const dismissRate = shown > 0 ? dismissed / shown : 0;
  const completionRate = clicked > 0 ? completed / clicked : Number(edge.completionRate) || 0;

  return (
    completionRate * 4 +
    ctr * 2 +
    Math.min(completed, 5) * 0.2 -
    dismissRate * 3 -
    Math.min(shown, 12) * 0.03
  );
}

/**
 * @param {Array<{ _id: { topicTag, interventionId }, shown, clicked, dismissed, completed, ctr, completionRate }>} edges
 * @param {string} topicTag
 * @returns {Map<string, number>}
 */
export function buildRankingScoreMap(edges, topicTag) {
  const map = new Map();
  const topic = String(topicTag || 'general').trim().toLowerCase();
  const list = Array.isArray(edges) ? edges : [];

  list.forEach((edge) => {
    const interventionId = String(edge?._id?.interventionId || '').trim();
    if (!interventionId) return;
    const edgeTopic = String(edge?._id?.topicTag || 'general').trim().toLowerCase();
    const base = scoreInterventionEdge(edge);
    const topicBoost = edgeTopic === topic ? 1 : edgeTopic === 'general' ? 0.35 : 0.15;
    const weighted = base * topicBoost;
    const prev = map.get(interventionId) ?? -Infinity;
    if (weighted > prev) map.set(interventionId, weighted);
  });

  return map;
}

/**
 * Orden estable: mayor score primero; empate conserva orden de reglas.
 * @param {string[]} ids
 * @param {Map<string, number>|Record<string, number>|null|undefined} scoreMap
 */
export function rankInterventionIds(ids, scoreMap) {
  if (!Array.isArray(ids) || ids.length <= 1) return ids || [];
  const scores =
    scoreMap instanceof Map
      ? scoreMap
      : new Map(Object.entries(scoreMap || {}).map(([k, v]) => [k, Number(v) || 0]));

  if (scores.size === 0) return [...ids];

  return [...ids]
    .map((id, index) => ({
      id,
      index,
      score: scores.get(String(id)) ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((row) => row.id);
}

function tokenizeTopicFreeText(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 3),
  );
}

function computeTokenOverlap(left, right) {
  if (!left?.size || !right?.size) return 0;
  let shared = 0;
  left.forEach((token) => {
    if (right.has(token)) shared += 1;
  });
  return shared / Math.sqrt(left.size * right.size);
}

function eventAffinityWeight(eventType, baseWeight) {
  return baseWeight * (eventType === 'completed' ? 1.25 : 0.85);
}

function mergeBoostMapsMax(left, right) {
  const merged = new Map(left instanceof Map ? left : []);
  if (!(right instanceof Map)) return merged;
  right.forEach((value, id) => {
    merged.set(id, Math.max(merged.get(id) ?? 0, value));
  });
  return merged;
}

/**
 * Boost léxico (#218 lite).
 */
export function buildTopicFreeLexicalBoost(events, userContent) {
  const snippet = buildTopicFreeFromUserContent(userContent);
  if (!snippet) return new Map();
  const currentTokens = tokenizeTopicFreeText(snippet);
  if (currentTokens.size === 0) return new Map();

  const map = new Map();
  for (const ev of events || []) {
    const overlap = computeTokenOverlap(currentTokens, tokenizeTopicFreeText(ev?.topicFree));
    if (overlap < 0.12) continue;
    const id = String(ev?.interventionId || '').trim();
    if (!id) continue;
    const weight = eventAffinityWeight(ev?.eventType, overlap);
    map.set(id, Math.max(map.get(id) ?? 0, weight));
  }
  return map;
}

/**
 * Boost semántico por cosine similarity (#218 fase 3).
 * @param {Array} events
 * @param {number[]} queryEmbedding
 */
export function buildTopicFreeSemanticBoost(
  events,
  queryEmbedding,
  { minSimilarity = getTopicFreeEmbeddingMinSimilarity() } = {},
) {
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) return new Map();

  const map = new Map();
  for (const ev of events || []) {
    const stored = ev?.topicFreeEmbedding;
    if (!Array.isArray(stored) || stored.length !== queryEmbedding.length) continue;
    const similarity = cosineSimilarity(queryEmbedding, stored);
    if (similarity < minSimilarity) continue;
    const id = String(ev?.interventionId || '').trim();
    if (!id) continue;
    const weight = eventAffinityWeight(ev?.eventType, similarity);
    map.set(id, Math.max(map.get(id) ?? 0, weight));
  }
  return map;
}

/**
 * Boost híbrido léxico + embeddings (máximo por intervención).
 */
export function buildTopicFreeAffinityBoost(events, userContent, options = {}) {
  const lexical = buildTopicFreeLexicalBoost(events, userContent);
  const queryEmbedding = options?.queryEmbedding;
  if (!queryEmbedding?.length) return lexical;

  const semantic = buildTopicFreeSemanticBoost(events, queryEmbedding, options);
  if (semantic.size === 0) return lexical;
  if (lexical.size === 0) return semantic;
  return mergeBoostMapsMax(lexical, semantic);
}

export function mergeRankingScoreMaps(baseMap, boostMap, factor = 0.4) {
  const merged = new Map(baseMap instanceof Map ? baseMap : []);
  if (!(boostMap instanceof Map) || boostMap.size === 0) return merged;
  boostMap.forEach((value, id) => {
    merged.set(id, (merged.get(id) ?? 0) + value * factor);
  });
  return merged;
}

async function fetchTopicFreeAffinityScores({ userId, userContent, days = DEFAULT_RANKING_DAYS }) {
  if (!userId || !userContent) return new Map();
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  let events = await chatInterventionGraphService
    .findTopicFreeAffinityEvents({ userId, since })
    .catch(() => []);

  const snippet = buildTopicFreeFromUserContent(userContent);
  let queryEmbedding = null;
  if (snippet && isTopicFreeEmbeddingsEnabled()) {
    events = await enrichTopicFreeEventsWithEmbeddings(events);
    queryEmbedding = await embedTopicFreeText(snippet);
  }

  return buildTopicFreeAffinityBoost(events, userContent, { queryEmbedding });
}

export async function fetchRankingScoresForUser({
  userId,
  emotionalAnalysis = null,
  contextualAnalysis = null,
  userContent = null,
  days = DEFAULT_RANKING_DAYS,
  limit = DEFAULT_GRAPH_LIMIT,
}) {
  if (!userId) return new Map();
  const topicTag = safeTopicTag(emotionalAnalysis, contextualAnalysis);
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const edges = await chatInterventionGraphService.aggregateInterventionGraph({
    userId,
    since,
    limit,
  });
  let scores = buildRankingScoreMap(edges, topicTag);
  if (userContent) {
    const affinity = await fetchTopicFreeAffinityScores({ userId, userContent, days });
    scores = mergeRankingScoreMaps(scores, affinity);
  }
  return scores;
}

export default {
  scoreInterventionEdge,
  buildRankingScoreMap,
  buildTopicFreeLexicalBoost,
  buildTopicFreeSemanticBoost,
  buildTopicFreeAffinityBoost,
  mergeRankingScoreMaps,
  rankInterventionIds,
  fetchRankingScoresForUser,
  safeTopicTag,
};
