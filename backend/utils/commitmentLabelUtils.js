/**
 * Utilidades para validar labels de compromisos (#202).
 * Evita guardar solo el nombre de una técnica del catálogo sin acción concreta.
 */
import {
  INTERVENTION_CATALOG,
  getInterventionCatalogLabel,
} from '../constants/interventionCatalog.js';

let genericLabelCache = null;

export function normalizeCommitmentLabel(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

function buildGenericInterventionLabelSet() {
  if (genericLabelCache) return genericLabelCache;
  const set = new Set();
  for (const entry of Object.values(INTERVENTION_CATALOG)) {
    for (const lang of ['es', 'en']) {
      const label = getInterventionCatalogLabel(entry, lang);
      if (label) set.add(normalizeCommitmentLabel(label));
    }
  }
  genericLabelCache = set;
  return set;
}

export function isGenericInterventionCatalogLabel(label) {
  const normalized = normalizeCommitmentLabel(label);
  if (!normalized) return false;
  return buildGenericInterventionLabelSet().has(normalized);
}

export function isBehavioralActivationLabel(label) {
  const normalized = normalizeCommitmentLabel(label);
  if (!normalized) return false;
  const entry = INTERVENTION_CATALOG.behavioral_activation;
  if (!entry) return false;
  return ['es', 'en'].some((lang) => {
    const catalogLabel = getInterventionCatalogLabel(entry, lang);
    return catalogLabel && normalizeCommitmentLabel(catalogLabel) === normalized;
  });
}
