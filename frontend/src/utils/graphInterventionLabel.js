/**
 * Etiquetas de intervención en grafos «Lo que te ayuda».
 * Filtra IDs internos del backend que no son técnicas reales.
 */

/** Memoria RAG de patrones personales (#203); no es una técnica visible. */
export const INTERNAL_GRAPH_INTERVENTION_ID = 'personal-pattern';

const INTERNAL_GRAPH_INTERVENTION_IDS = new Set([INTERNAL_GRAPH_INTERVENTION_ID]);

/**
 * @param {string} interventionId
 */
export function isInternalGraphIntervention(interventionId) {
  return INTERNAL_GRAPH_INTERVENTION_IDS.has(String(interventionId || '').trim());
}

/**
 * @param {{ interventionId?: string } | null | undefined} edge
 */
export function shouldShowGraphInterventionEdge(edge) {
  return !isInternalGraphIntervention(edge?.interventionId);
}

/**
 * @param {Array<{ interventionId?: string }>} edges
 */
export function filterPublicGraphInterventionEdges(edges) {
  if (!Array.isArray(edges)) return [];
  return edges.filter(shouldShowGraphInterventionEdge);
}

/**
 * @param {{ targetId?: string, interventionId?: string } | null | undefined} row
 */
export function shouldShowGraphCorrelation(row) {
  const id = String(row?.targetId || row?.interventionId || '').trim();
  return id && !isInternalGraphIntervention(id);
}

/**
 * @param {Array<{ targetId?: string, interventionId?: string }>} rows
 */
export function filterPublicGraphCorrelations(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(shouldShowGraphCorrelation);
}

/**
 * @param {string} label
 */
export function stripTechnicalInterventionSuffix(label) {
  return String(label || '')
    .replace(/\s*\((psicoeducación|psicoed|micro-guía|micro-guia|tcc|interno)\)\s*$/i, '')
    .trim();
}

/**
 * @param {string} label
 * @param {string} id
 */
export function resolveGraphInterventionLabel(label, id) {
  if (isInternalGraphIntervention(id)) return null;
  const raw = stripTechnicalInterventionSuffix(label || id || '');
  if (!raw || raw === INTERNAL_GRAPH_INTERVENTION_ID) return null;
  return raw;
}
