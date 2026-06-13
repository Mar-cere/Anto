/**
 * Clustering semántico de snippets topicFree → nodos concepto (#218 fase 3 / #126).
 */
import crypto from 'crypto';
import { pickClusterDisplayLabel } from '../utils/graphSourceLabel.js';
import { cosineSimilarity } from '../utils/vectorMath.js';

const DEFAULT_MIN_SIMILARITY = 0.78;
const DEFAULT_MAX_CONCEPTS = 12;

function conceptIdFromLabel(label) {
  return crypto.createHash('sha256').update(String(label)).digest('hex').slice(0, 12);
}

function pickRepresentativeLabel(samples, language = 'es') {
  return pickClusterDisplayLabel(samples, language);
}

/**
 * Agrupa snippets topicFree por similitud coseno (greedy, sin re-embedding).
 * @param {Array<{ topicFree: string, embedding?: number[] }>} items
 */
export function clusterTopicFreeItems(
  items,
  { minSimilarity = DEFAULT_MIN_SIMILARITY, maxConcepts = DEFAULT_MAX_CONCEPTS, language = 'es' } = {},
) {
  const valid = (items || []).filter(
    (item) =>
      item?.topicFree &&
      Array.isArray(item?.embedding) &&
      item.embedding.length > 0,
  );
  if (valid.length === 0) {
    return { conceptNodes: [], assignments: new Map() };
  }

  const clusters = [];

  for (const item of valid) {
    let assigned = false;
    for (const cluster of clusters) {
      const sim = cosineSimilarity(item.embedding, cluster.centroid);
      if (sim >= minSimilarity) {
        cluster.members.push(item);
        cluster.samples.push(item.topicFree);
        const dim = cluster.centroid.length;
        cluster.centroid = cluster.centroid.map(
          (v, i) => (v * (cluster.members.length - 1) + item.embedding[i]) / cluster.members.length,
        );
        if (cluster.topicTags && item.topicTag) {
          cluster.topicTags.add(String(item.topicTag));
        }
        assigned = true;
        break;
      }
    }
    if (!assigned && clusters.length < maxConcepts) {
      clusters.push({
        members: [item],
        samples: [item.topicFree],
        centroid: [...item.embedding],
        topicTags: new Set(item.topicTag ? [String(item.topicTag)] : []),
      });
    }
  }

  const conceptNodes = clusters.map((cluster, index) => {
    const label = pickRepresentativeLabel(cluster.samples, language);
    return {
      id: `concept_${conceptIdFromLabel(label)}_${index}`,
      label: label.slice(0, 128),
      memberCount: cluster.members.length,
      topicTags: [...(cluster.topicTags || [])].slice(0, 6),
      samples: [...new Set(cluster.samples)].slice(0, 4),
    };
  });

  const assignments = new Map();
  clusters.forEach((cluster, index) => {
    const conceptId = conceptNodes[index]?.id;
    if (!conceptId) return;
    cluster.members.forEach((member) => {
      assignments.set(String(member.topicFree), conceptId);
    });
  });

  return { conceptNodes, assignments };
}

/**
 * Aristas concepto → intervención a partir de topicFreeEdges agregados.
 */
export function buildConceptInterventionEdges(topicFreeEdges, assignments) {
  if (!assignments?.size || !Array.isArray(topicFreeEdges) || topicFreeEdges.length === 0) {
    return [];
  }

  const bucket = new Map();
  for (const edge of topicFreeEdges) {
    const topicFree = String(edge?.topicFree || '').trim();
    const interventionId = String(edge?.interventionId || '').trim();
    if (!topicFree || !interventionId) continue;
    const conceptId = assignments.get(topicFree);
    if (!conceptId) continue;

    const key = `${conceptId}:${interventionId}`;
    const prev = bucket.get(key) || {
      conceptId,
      interventionId,
      interventionLabel: edge.interventionLabel || interventionId,
      shown: 0,
      clicked: 0,
      dismissed: 0,
      completed: 0,
      ctr: 0,
      completionRate: 0,
    };
    prev.shown += Number(edge.shown) || 0;
    prev.clicked += Number(edge.clicked) || 0;
    prev.dismissed += Number(edge.dismissed) || 0;
    prev.completed += Number(edge.completed) || 0;
    bucket.set(key, prev);
  }

  return [...bucket.values()].map((row) => ({
    ...row,
    ctr: row.shown > 0 ? row.clicked / row.shown : 0,
    completionRate: row.clicked > 0 ? row.completed / row.clicked : 0,
    weight:
      row.shown * 0.2 +
      row.clicked * 0.45 +
      row.completed * 1.0 +
      (row.shown > 0 ? row.clicked / row.shown : 0) * 0.35 +
      (row.clicked > 0 ? row.completed / row.clicked : 0) * 0.5,
  }));
}

/**
 * Resuelve embeddings por snippet desde eventos históricos.
 */
export function indexTopicFreeEmbeddings(events) {
  const map = new Map();
  for (const ev of events || []) {
    const text = String(ev?.topicFree || '').trim();
    const embedding = ev?.topicFreeEmbedding;
    if (!text || !Array.isArray(embedding) || embedding.length === 0) continue;
    if (!map.has(text)) {
      map.set(text, { topicFree: text, embedding, topicTag: ev?.topicTag || null });
    }
  }
  return map;
}

/**
 * Pipeline completo: unique topicFree de edges + embeddings → conceptos + aristas.
 */
export function buildTopicFreeConceptGraph(topicFreeEdges, embeddingIndex, options = {}) {
  const uniqueTexts = [...new Set((topicFreeEdges || []).map((e) => String(e?.topicFree || '').trim()))].filter(
    Boolean,
  );
  const items = uniqueTexts
    .map((topicFree) => {
      const row = embeddingIndex?.get?.(topicFree);
      if (!row?.embedding) return null;
      return {
        topicFree,
        embedding: row.embedding,
        topicTag: row.topicTag,
      };
    })
    .filter(Boolean);

  const { conceptNodes, assignments } = clusterTopicFreeItems(items, options);
  const conceptEdges = buildConceptInterventionEdges(topicFreeEdges, assignments);
  return { conceptNodes, conceptEdges, assignments };
}

export default {
  clusterTopicFreeItems,
  buildConceptInterventionEdges,
  indexTopicFreeEmbeddings,
  buildTopicFreeConceptGraph,
};
