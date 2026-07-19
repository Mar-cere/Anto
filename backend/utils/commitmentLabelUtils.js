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

const MAX_CONCRETE_LABEL = 100;
export const SHORT_SOFT_RESUME_LABEL_ES = 'Volver a este tema cuando te venga bien';
export const SHORT_SOFT_RESUME_LABEL_EN = 'Come back to this topic when you want';

/** Eco de burbuja del chat: no sirve como etiqueta de compromiso. */
export function looksLikeChatBubbleLabel(text) {
  const t = String(text || '').trim();
  if (!t) return true;
  if (t.length > MAX_CONCRETE_LABEL) return true;
  if ((t.match(/[?.!¿¡]/g) || []).length >= 2) return true;
  if (
    /^(est[aá]\s+bien|entiendo|tiene\s+sentido|te\s+escucho|suena\s+a|s[ií],\s+ambas|it'?s\s+(ok|okay|fine)|i\s+understand)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

export function isSoftResumeCommitmentLabel(label) {
  const n = normalizeCommitmentLabel(label);
  if (!n) return false;
  return (
    n.includes('volver a este tema') ||
    n.includes('come back to this topic') ||
    n.includes('retomar este tramo') ||
    n.includes('retomar este tema') ||
    (n.includes('cuando te venga bien') && n.length <= 64)
  );
}

/** Labels válidos para follow-up en chat (#202). */
export function isUsableCommitmentFollowUpLabel(label) {
  const raw = String(label || '').trim();
  if (!raw) return false;
  if (looksLikeChatBubbleLabel(raw)) return false;
  if (isSoftResumeCommitmentLabel(raw)) return false;
  if (isGenericInterventionCatalogLabel(raw)) return false;
  return true;
}
