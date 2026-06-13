/**
 * Orquestación grafo #218 fase 3: conceptos semánticos + correlaciones (#126 / #217).
 */
import chatInterventionGraphService from './chatInterventionGraphService.js';
import { buildMultimodalCorrelations } from './multimodalCorrelationService.js';
import {
  buildTopicFreeConceptGraph,
  indexTopicFreeEmbeddings,
} from './topicFreeConceptClusterService.js';
import { enrichTopicFreeEventsWithEmbeddings } from './topicFreeEmbeddingService.js';
import {
  findSimilarTopicFreeEvents,
  getVectorSearchMode,
  isAtlasVectorSearchEnabled,
} from './topicFreeVectorSearchService.js';

async function fetchEmbeddingIndexForTopicFree(userId, since, topicFreeTexts) {
  const texts = [...new Set((topicFreeTexts || []).map((t) => String(t).trim()))].filter(Boolean);
  if (texts.length === 0) return new Map();

  const events = await chatInterventionGraphService
    .findTopicFreeAffinityEvents({ userId, since, limit: 200 })
    .catch(() => []);

  const enriched = await enrichTopicFreeEventsWithEmbeddings(events);
  const index = indexTopicFreeEmbeddings(enriched);

  for (const text of texts) {
    if (index.has(text)) continue;
    const partial = enriched.find((ev) => String(ev?.topicFree || '').trim() === text);
    if (partial?.topicFreeEmbedding) {
      index.set(text, {
        topicFree: text,
        embedding: partial.topicFreeEmbedding,
        topicTag: partial.topicTag,
      });
    }
  }

  return index;
}

/**
 * Enriquece payload del grafo con nodos concepto y correlaciones multimodales.
 */
export async function buildInterventionGraphPhase3Payload({
  userId,
  since,
  topicTagEdges = [],
  topicFreeEdges = [],
  queryEmbedding = null,
}) {
  const embeddingIndex = await fetchEmbeddingIndexForTopicFree(
    userId,
    since,
    topicFreeEdges.map((e) => e.topicFree),
  );

  const { conceptNodes, conceptEdges } = buildTopicFreeConceptGraph(
    topicFreeEdges,
    embeddingIndex,
    { maxConcepts: 12, minSimilarity: 0.78 },
  );

  const { correlations, summary } = await buildMultimodalCorrelations({
    userId,
    since,
    topicTagEdges,
    conceptEdges,
    conceptNodes,
  });

  let vectorSearchPreview = [];
  if (queryEmbedding?.length && userId) {
    vectorSearchPreview = await findSimilarTopicFreeEvents({
      userId,
      queryVector: queryEmbedding,
      since,
      limit: 5,
    }).catch(() => []);
  }

  return {
    conceptNodes,
    conceptEdges,
    correlations,
    correlationSummary: summary,
    vectorSearch: {
      mode: getVectorSearchMode(),
      atlasEnabled: isAtlasVectorSearchEnabled(),
      previewCount: vectorSearchPreview.length,
    },
  };
}

export default {
  buildInterventionGraphPhase3Payload,
};
