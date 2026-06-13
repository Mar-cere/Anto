/**
 * Layout bipartito tema → intervención para el grafo visual (#218 / #127).
 */

const DEFAULT_MAX_TOPICS = 7;
const DEFAULT_MAX_INTERVENTIONS = 10;
const ROW_HEIGHT = 52;
const PADDING_Y = 36;
const LEFT_X = 88;
const RIGHT_X_OFFSET = 88;

export function computeEdgeWeight(edge) {
  if (!edge || typeof edge !== 'object') return 0;
  const shown = Number(edge.shown) || 0;
  const clicked = Number(edge.clicked) || 0;
  const completed = Number(edge.completed) || 0;
  const ctr = Number(edge.ctr) || 0;
  const completionRate = Number(edge.completionRate) || 0;
  return (
    shown * 0.2 +
    clicked * 0.45 +
    completed * 1.0 +
    ctr * 0.35 +
    completionRate * 0.5
  );
}

export function normalizeStrokeWidth(weight, maxWeight, minW = 1.2, maxW = 5) {
  const safeMax = Math.max(Number(maxWeight) || 0, 0.001);
  const w = Math.max(Number(weight) || 0, 0);
  return minW + (w / safeMax) * (maxW - minW);
}

function aggregateByKey(edges, keyFn) {
  const map = new Map();
  for (const edge of edges || []) {
    const key = keyFn(edge);
    if (!key) continue;
    const prev = map.get(key) || 0;
    map.set(key, prev + computeEdgeWeight(edge));
  }
  return map;
}

function topKeys(weightMap, limit) {
  return [...weightMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function truncateLabel(text, max = 22) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * @param {Array} edges — filas del API /interventions/graph
 * @param {object} options
 * @returns {{ topics, interventions, links, width, height, maxWeight }}
 */
export function buildInterventionGraphModel(
  edges,
  {
    maxTopics = DEFAULT_MAX_TOPICS,
    maxInterventions = DEFAULT_MAX_INTERVENTIONS,
    canvasWidth = 340,
  } = {},
) {
  const list = Array.isArray(edges) ? edges.filter((e) => e?.topicTag && e?.interventionId) : [];
  if (list.length === 0) {
    return {
      topics: [],
      interventions: [],
      links: [],
      width: canvasWidth,
      height: 120,
      maxWeight: 0,
    };
  }

  const topicWeights = aggregateByKey(list, (e) => String(e.topicTag));
  const interventionWeights = aggregateByKey(list, (e) =>
    String(e.interventionLabel || e.interventionId),
  );

  const topicKeys = topKeys(topicWeights, maxTopics);
  const interventionKeys = topKeys(interventionWeights, maxInterventions);
  const topicSet = new Set(topicKeys);
  const interventionSet = new Set(interventionKeys);

  const filtered = list.filter(
    (e) =>
      topicSet.has(String(e.topicTag)) &&
      interventionSet.has(String(e.interventionLabel || e.interventionId)),
  );

  const topics = topicKeys.map((topicTag, index) => ({
    id: topicTag,
    label: truncateLabel(topicTag),
    x: LEFT_X,
    y: PADDING_Y + index * ROW_HEIGHT,
    weight: topicWeights.get(topicTag) || 0,
  }));

  const interventions = interventionKeys.map((label, index) => ({
    id: label,
    label: truncateLabel(label),
    x: Math.max(canvasWidth - RIGHT_X_OFFSET, LEFT_X + 120),
    y: PADDING_Y + index * ROW_HEIGHT,
    weight: interventionWeights.get(label) || 0,
  }));

  const topicIndex = new Map(topics.map((t, i) => [t.id, i]));
  const interventionIndex = new Map(interventions.map((t, i) => [t.id, i]));

  const links = filtered.map((edge) => {
    const topicTag = String(edge.topicTag);
    const interventionLabel = String(edge.interventionLabel || edge.interventionId);
    const weight = computeEdgeWeight(edge);
    const topic = topics[topicIndex.get(topicTag)];
    const intervention = interventions[interventionIndex.get(interventionLabel)];
    if (!topic || !intervention) return null;
    return {
      key: `${topicTag}:${edge.interventionId}`,
      topicTag,
      interventionId: edge.interventionId,
      interventionLabel,
      weight,
      x1: topic.x,
      y1: topic.y,
      x2: intervention.x,
      y2: intervention.y,
      edge,
    };
  }).filter(Boolean);

  const rowCount = Math.max(topics.length, interventions.length, 1);
  const height = PADDING_Y * 2 + (rowCount - 1) * ROW_HEIGHT;
  const maxWeight = Math.max(...links.map((l) => l.weight), 0.001);

  return {
    topics,
    interventions,
    links,
    width: canvasWidth,
    height,
    maxWeight,
  };
}

export function formatTopicTagLabel(topicTag, language = 'es') {
  const tag = String(topicTag || 'general').trim().toLowerCase();
  const labels = {
    es: {
      general: 'General',
      trabajo: 'Trabajo',
      ansiedad: 'Ansiedad',
      tristeza: 'Tristeza',
      enojo: 'Enojo',
      sueno: 'Sueño',
      sleep: 'Sueño',
      stress: 'Estrés',
      continuity: 'Continuidad',
      relaciones: 'Relaciones',
      familia: 'Familia',
    },
    en: {
      general: 'General',
      trabajo: 'Work',
      ansiedad: 'Anxiety',
      tristeza: 'Low mood',
      enojo: 'Anger',
      sueno: 'Sleep',
      sleep: 'Sleep',
      stress: 'Stress',
      continuity: 'Continuity',
      relaciones: 'Relationships',
      familia: 'Family',
    },
  };
  const lang = language === 'en' ? 'en' : 'es';
  return labels[lang][tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
}

/**
 * Enriquece labels de temas para la UI.
 */
export function localizeGraphModel(model, language = 'es') {
  if (!model?.topics) return model;
  return {
    ...model,
    topics: model.topics.map((t) => ({
      ...t,
      label: truncateLabel(formatTopicTagLabel(t.id, language)),
    })),
  };
}
