/**
 * Intervenciones internas del grafo que no deben exponerse al cliente (#203).
 */
import { MEMORY_INTERVENTION_ID } from '../services/personalPatternRagService.js';

const INTERNAL_GRAPH_INTERVENTION_IDS = new Set([MEMORY_INTERVENTION_ID]);

/**
 * @param {string} interventionId
 */
export function isInternalGraphIntervention(interventionId) {
  return INTERNAL_GRAPH_INTERVENTION_IDS.has(String(interventionId || '').trim());
}

/**
 * @param {{ interventionId?: string } | null | undefined} edge
 */
export function shouldExposeGraphInterventionEdge(edge) {
  return !isInternalGraphIntervention(edge?.interventionId);
}

/**
 * @param {Array<{ interventionId?: string }>} edges
 */
export function filterPublicGraphInterventionEdges(edges) {
  if (!Array.isArray(edges)) return [];
  return edges.filter(shouldExposeGraphInterventionEdge);
}

/**
 * @param {{ targetId?: string, interventionId?: string } | null | undefined} row
 */
export function shouldExposeGraphCorrelation(row) {
  const id = String(row?.targetId || row?.interventionId || '').trim();
  return id && !isInternalGraphIntervention(id);
}

/**
 * @param {Array<{ targetId?: string, interventionId?: string }>} rows
 */
export function filterPublicGraphCorrelations(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(shouldExposeGraphCorrelation);
}

export default {
  isInternalGraphIntervention,
  shouldExposeGraphInterventionEdge,
  filterPublicGraphInterventionEdges,
  shouldExposeGraphCorrelation,
  filterPublicGraphCorrelations,
};
