/**
 * Layout bipartito tema → intervención para el grafo visual (#218 / #127).
 */
import { resolveTopicFreeDisplayLabel } from './graphSourceLabel.js';
import { filterPublicGraphInterventionEdges } from './graphInterventionLabel.js';

const DEFAULT_MAX_TOPICS = 7;
const DEFAULT_MAX_INTERVENTIONS = 10;
const DEFAULT_MAX_TOPIC_FREE = 8;
const ROW_GAP = 14;
const PADDING_X = 14;
const PADDING_Y = 44;
const NODE_MIN_HEIGHT = 40;
const LINE_HEIGHT = 15;
const SOURCE_COL_RATIO = 0.44;
const TARGET_COL_RATIO = 0.44;

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

export function measureLabelLines(text, maxCharsPerLine = 26, maxLines = 3) {
  const s = String(text || '').trim();
  if (!s) {
    return { lines: [''], height: NODE_MIN_HEIGHT };
  }

  const words = s.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = '';
    }
    if (word.length > maxCharsPerLine) {
      lines.push(`${word.slice(0, maxCharsPerLine - 1)}…`);
      current = '';
    } else {
      current = word;
    }
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
    const last = lines[maxLines - 1];
    lines[maxLines - 1] =
      last.length > maxCharsPerLine ? `${last.slice(0, maxCharsPerLine - 1)}…` : last;
  }

  const height = Math.max(NODE_MIN_HEIGHT, lines.length * LINE_HEIGHT + 18);
  return { lines, height };
}

function layoutBipartiteGraph({
  sourceItems,
  targetItems,
  linkRows,
  canvasWidth,
  sourceKind = 'source',
}) {
  const innerWidth = Math.max(canvasWidth - PADDING_X * 2, 200);
  const sourceColW = Math.floor(innerWidth * SOURCE_COL_RATIO);
  const targetColW = Math.floor(innerWidth * TARGET_COL_RATIO);
  const targetX = canvasWidth - PADDING_X - targetColW;
  const charsSource = Math.max(14, Math.floor(sourceColW / 6.5));
  const charsTarget = Math.max(12, Math.floor(targetColW / 6.5));

  let sourceY = PADDING_Y;
  const sourceById = new Map();
  const sources = sourceItems.map((item) => {
    const { lines, height } = measureLabelLines(item.label, charsSource, 3);
    const node = {
      id: item.id,
      label: lines[0] || truncateLabel(item.label),
      fullLabel: item.label,
      lines,
      x: PADDING_X,
      y: sourceY,
      width: sourceColW,
      height,
      anchorX: PADDING_X + sourceColW,
      anchorY: sourceY + height / 2,
      weight: item.weight,
      kind: 'source',
      nodeKind: sourceKind,
    };
    sourceById.set(item.id, node);
    sourceY += height + ROW_GAP;
    return node;
  });

  let targetY = PADDING_Y;
  const targetById = new Map();
  const targets = targetItems.map((item) => {
    const { lines, height } = measureLabelLines(item.label, charsTarget, 2);
    const node = {
      id: item.id,
      label: lines[0] || truncateLabel(item.label),
      fullLabel: item.label,
      lines,
      x: targetX,
      y: targetY,
      width: targetColW,
      height,
      anchorX: targetX,
      anchorY: targetY + height / 2,
      weight: item.weight,
      kind: 'target',
      nodeKind: 'intervention',
    };
    targetById.set(item.id, node);
    targetY += height + ROW_GAP;
    return node;
  });

  const links = (linkRows || [])
    .map((row) => {
      const source = sourceById.get(row.sourceId);
      const target = targetById.get(row.targetId);
      if (!source || !target) return null;
      return {
        ...row.payload,
        key: row.key,
        weight: row.weight,
        x1: source.anchorX,
        y1: source.anchorY,
        x2: target.anchorX,
        y2: target.anchorY,
        sourceId: row.sourceId,
        targetId: row.targetId,
      };
    })
    .filter(Boolean);

  const height = Math.max(sourceY, targetY, PADDING_Y + NODE_MIN_HEIGHT) + PADDING_Y;
  const maxWeight = Math.max(...links.map((l) => l.weight), 0.001);

  return { sources, targets, links, height, maxWeight };
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
  const list = filterPublicGraphInterventionEdges(
    Array.isArray(edges) ? edges.filter((e) => e?.topicTag && e?.interventionId) : [],
  );
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

  const sourceItems = topicKeys.map((topicTag) => ({
    id: topicTag,
    label: topicTag,
    weight: topicWeights.get(topicTag) || 0,
  }));
  const targetItems = interventionKeys.map((label) => ({
    id: label,
    label,
    weight: interventionWeights.get(label) || 0,
  }));

  const { sources, targets, links, height, maxWeight } = layoutBipartiteGraph({
    sourceItems,
    targetItems,
    linkRows: filtered.map((edge) => {
      const topicTag = String(edge.topicTag);
      const interventionLabel = String(edge.interventionLabel || edge.interventionId);
      return {
        key: `${topicTag}:${edge.interventionId}`,
        sourceId: topicTag,
        targetId: interventionLabel,
        weight: computeEdgeWeight(edge),
        payload: {
          topicTag,
          interventionId: edge.interventionId,
          interventionLabel,
          edge,
          linkKind: 'topicTag',
        },
      };
    }),
    canvasWidth,
    sourceKind: 'topic',
  });

  return {
    topics: sources,
    interventions: targets,
    links,
    width: canvasWidth,
    height,
    maxWeight,
  };
}

/**
 * Grafo fase 2 (#218): nodos topicFree (centro) → intervención (derecha).
 * @param {Array} topicFreeEdges
 */
export function buildTopicFreeGraphModel(
  topicFreeEdges,
  {
    maxTopicFree = DEFAULT_MAX_TOPIC_FREE,
    maxInterventions = DEFAULT_MAX_INTERVENTIONS,
    canvasWidth = 340,
    language = 'es',
  } = {},
) {
  const list = filterPublicGraphInterventionEdges(
    Array.isArray(topicFreeEdges)
      ? topicFreeEdges.filter((e) => e?.topicFree && e?.interventionId)
      : [],
  );
  if (list.length === 0) {
    return {
      topics: [],
      topicFreeNodes: [],
      interventions: [],
      links: [],
      width: canvasWidth,
      height: 120,
      maxWeight: 0,
      mode: 'topicFree',
    };
  }

  const topicFreeWeights = aggregateByKey(list, (e) => String(e.topicFree));
  const interventionWeights = aggregateByKey(list, (e) =>
    String(e.interventionLabel || e.interventionId),
  );

  const topicFreeKeys = topKeys(topicFreeWeights, maxTopicFree);
  const interventionKeys = topKeys(interventionWeights, maxInterventions);
  const topicFreeSet = new Set(topicFreeKeys);
  const interventionSet = new Set(interventionKeys);

  const filtered = list.filter(
    (e) =>
      topicFreeSet.has(String(e.topicFree)) &&
      interventionSet.has(String(e.interventionLabel || e.interventionId)),
  );

  const sourceItems = topicFreeKeys.map((topicFree) => ({
    id: topicFree,
    label: resolveTopicFreeDisplayLabel(topicFree, list, language),
    fullLabel: topicFree,
    weight: topicFreeWeights.get(topicFree) || 0,
  }));
  const targetItems = interventionKeys.map((label) => ({
    id: label,
    label,
    weight: interventionWeights.get(label) || 0,
  }));

  const { sources, targets, links, height, maxWeight } = layoutBipartiteGraph({
    sourceItems,
    targetItems,
    linkRows: filtered.map((edge) => {
      const topicFree = String(edge.topicFree);
      const interventionLabel = String(edge.interventionLabel || edge.interventionId);
      return {
        key: `tf:${topicFree}:${edge.interventionId}`,
        sourceId: topicFree,
        targetId: interventionLabel,
        weight: computeEdgeWeight(edge),
        payload: {
          topicFree,
          topicTag: edge.topicTag,
          interventionId: edge.interventionId,
          interventionLabel,
          edge,
          linkKind: 'topicFree',
        },
      };
    }),
    canvasWidth,
    sourceKind: 'topicFree',
  });

  return {
    topics: [],
    topicFreeNodes: sources,
    interventions: targets,
    links,
    width: canvasWidth,
    height,
    maxWeight,
    mode: 'topicFree',
  };
}

/**
 * Elige el mejor modelo visual según datos disponibles.
 */
export function buildConceptGraphModel(
  conceptNodes,
  conceptEdges,
  {
    maxConcepts = 8,
    maxInterventions = DEFAULT_MAX_INTERVENTIONS,
    canvasWidth = 340,
  } = {},
) {
  const nodes = Array.isArray(conceptNodes) ? conceptNodes : [];
  const edges = filterPublicGraphInterventionEdges(
    Array.isArray(conceptEdges) ? conceptEdges : [],
  );
  if (nodes.length === 0 || edges.length === 0) {
    return {
      topics: [],
      topicFreeNodes: [],
      conceptNodes: [],
      interventions: [],
      links: [],
      width: canvasWidth,
      height: 120,
      maxWeight: 0,
      mode: 'concept',
    };
  }

  const conceptWeights = aggregateByKey(edges, (e) => String(e.conceptId));
  const interventionWeights = aggregateByKey(edges, (e) =>
    String(e.interventionLabel || e.interventionId),
  );

  const conceptKeys = topKeys(conceptWeights, maxConcepts);
  const interventionKeys = topKeys(interventionWeights, maxInterventions);
  const conceptSet = new Set(conceptKeys);
  const interventionSet = new Set(interventionKeys);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const filtered = edges.filter(
    (e) =>
      conceptSet.has(String(e.conceptId)) &&
      interventionSet.has(String(e.interventionLabel || e.interventionId)),
  );

  const sourceItems = conceptKeys.map((conceptId) => {
    const raw = nodeById.get(conceptId);
    const rawText = raw?.rawLabel || raw?.label || conceptId;
    return {
      id: conceptId,
      label: raw?.displayLabel || raw?.label || conceptId,
      fullLabel: rawText,
      weight: conceptWeights.get(conceptId) || 0,
      memberCount: raw?.memberCount || 1,
    };
  });
  const targetItems = interventionKeys.map((label) => ({
    id: label,
    label,
    weight: interventionWeights.get(label) || 0,
  }));

  const { sources, targets, links, height, maxWeight } = layoutBipartiteGraph({
    sourceItems,
    targetItems,
    linkRows: filtered.map((edge) => {
      const conceptId = String(edge.conceptId);
      const interventionLabel = String(edge.interventionLabel || edge.interventionId);
      return {
        key: `c:${conceptId}:${edge.interventionId}`,
        sourceId: conceptId,
        targetId: interventionLabel,
        weight: Number(edge.weight) || computeEdgeWeight(edge),
        payload: {
          conceptId,
          interventionId: edge.interventionId,
          interventionLabel,
          edge,
          linkKind: 'concept',
        },
      };
    }),
    canvasWidth,
    sourceKind: 'concept',
  });

  const conceptNodeModels = sources.map((node) => ({
    ...node,
    memberCount: sourceItems.find((s) => s.id === node.id)?.memberCount || 1,
  }));

  return {
    topics: [],
    topicFreeNodes: [],
    conceptNodes: conceptNodeModels,
    interventions: targets,
    links,
    width: canvasWidth,
    height,
    maxWeight,
    mode: 'concept',
  };
}

/**
 * Elige el mejor modelo visual según datos disponibles.
 */
export function buildInterventionGraphViewModel(
  edges,
  topicFreeEdges,
  options = {},
) {
  const conceptNodes = options?.conceptNodes;
  const conceptEdges = options?.conceptEdges;
  const language = options?.language === 'en' ? 'en' : 'es';
  const withLang = { ...options, language };

  if (Array.isArray(conceptNodes) && conceptNodes.length > 0 && Array.isArray(conceptEdges)) {
    const conceptModel = buildConceptGraphModel(conceptNodes, conceptEdges, withLang);
    if (conceptModel.links.length > 0) return conceptModel;
  }

  const tfList = Array.isArray(topicFreeEdges) ? topicFreeEdges : [];
  if (tfList.length > 0) {
    const model = buildTopicFreeGraphModel(tfList, withLang);
    if (model.links.length > 0) return model;
  }
  const base = buildInterventionGraphModel(edges, withLang);
  return { ...base, topicFreeNodes: [], conceptNodes: [], mode: 'topicTag' };
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
  if (!model?.topics?.length) return model;
  const topics = model.topics.map((t) => {
    const localized = formatTopicTagLabel(t.id, language);
    const { lines, height } = measureLabelLines(
      localized,
      Math.max(14, Math.floor((t.width || 120) / 6.5)),
      3,
    );
    return {
      ...t,
      label: lines[0] || localized,
      fullLabel: localized,
      lines,
      height,
      anchorY: t.y + height / 2,
    };
  });
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const links = (model.links || []).map((link) => {
    const topic = topicById.get(link.topicTag || link.sourceId);
    if (!topic) return link;
    return {
      ...link,
      x1: topic.anchorX,
      y1: topic.anchorY,
    };
  });
  return {
    ...model,
    topics,
    links,
  };
}
