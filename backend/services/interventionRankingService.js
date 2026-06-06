/**
 * Ranking de intervenciones a partir del grafo #127 (histórico del usuario).
 */
import chatInterventionGraphService from './chatInterventionGraphService.js';

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

export async function fetchRankingScoresForUser({
  userId,
  emotionalAnalysis = null,
  contextualAnalysis = null,
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
  return buildRankingScoreMap(edges, topicTag);
}

export default {
  scoreInterventionEdge,
  buildRankingScoreMap,
  rankInterventionIds,
  fetchRankingScoresForUser,
  safeTopicTag,
};
