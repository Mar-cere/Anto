/**
 * Copy de seguimiento de compromisos en el dashboard (con contexto explícito).
 */

const GENERIC_INTERVENTION_LABELS = new Set([
  'activación conductual',
  'activacion conductual',
  'behavioral activation',
  'jerarquía de exposición',
  'jerarquia de exposicion',
  'exposure hierarchy',
  'registro abc',
  'abc record',
  'registro de pensamientos automáticos',
  'registro de pensamientos automaticos',
  'automatic thought record',
  'ejercicio de respiración',
  'ejercicio de respiracion',
  'breathing exercise',
  'técnica de grounding',
  'tecnica de grounding',
  'grounding technique',
]);

const INTERVENTION_FOLLOW_UP_KEYS = {
  behavioral_activation: 'FOCUS_COMMITMENT_FOLLOW_UP_BA',
  exposure_hierarchy: 'FOCUS_COMMITMENT_FOLLOW_UP_EXPOSURE',
  abc_record: 'FOCUS_COMMITMENT_FOLLOW_UP_ABC',
  automatic_thought_record: 'FOCUS_COMMITMENT_FOLLOW_UP_AT',
  breathing_exercise: 'FOCUS_COMMITMENT_FOLLOW_UP_BREATHING',
  grounding_technique: 'FOCUS_COMMITMENT_FOLLOW_UP_GROUNDING',
};

function normalizeLabelKey(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isGenericCommitmentLabel(label) {
  return GENERIC_INTERVENTION_LABELS.has(normalizeLabelKey(label));
}

function resolveInterventionId(item) {
  const fromMeta = String(item?.sourceMeta?.interventionId || '').trim();
  if (fromMeta) return fromMeta;
  const label = normalizeLabelKey(item?.label);
  if (label.includes('activación conductual') || label.includes('activacion conductual')) {
    return 'behavioral_activation';
  }
  if (label.includes('exposición') || label.includes('exposicion') || label.includes('exposure')) {
    return 'exposure_hierarchy';
  }
  if (label === 'registro abc' || label === 'abc record') return 'abc_record';
  if (label.includes('pensamientos automáticos') || label.includes('automatic thought')) {
    return 'automatic_thought_record';
  }
  return null;
}

/**
 * @param {{ label?: string, sourceMeta?: { interventionId?: string } }} item
 * @param {Record<string, string>} texts sección DASH
 */
export function buildCommitmentFollowUpPrompt(item, texts = {}) {
  const label = String(item?.label || '').trim();
  if (!label) return texts.FOCUS_COMMITMENT_FOLLOW_UP || '';

  const interventionId = resolveInterventionId(item);
  const genericKey = interventionId ? INTERVENTION_FOLLOW_UP_KEYS[interventionId] : null;
  if (genericKey && texts[genericKey]) {
    return texts[genericKey];
  }

  if (isGenericCommitmentLabel(label) && texts.FOCUS_COMMITMENT_FOLLOW_UP_GENERIC) {
    return texts.FOCUS_COMMITMENT_FOLLOW_UP_GENERIC.replace('{label}', label);
  }

  const template = texts.FOCUS_COMMITMENT_FOLLOW_UP_NAMED || texts.FOCUS_COMMITMENT_FOLLOW_UP;
  if (!template) return `¿Cómo te fue con «${label}»?`;
  return template.replace('{label}', label);
}

/**
 * @param {{ label?: string, sourceMeta?: { interventionId?: string } }} item
 * @param {Record<string, string>} texts sección DASH
 */
export function buildCommitmentDisplayTitle(item, texts = {}) {
  const label = String(item?.label || '').trim();
  if (!label) return texts.FOCUS_COMMITMENT_FALLBACK_TITLE || 'Tu compromiso';

  if (!isGenericCommitmentLabel(label)) return label;

  const interventionId = resolveInterventionId(item);
  if (interventionId === 'behavioral_activation' && texts.FOCUS_COMMITMENT_TITLE_BA) {
    return texts.FOCUS_COMMITMENT_TITLE_BA;
  }
  if (interventionId === 'exposure_hierarchy' && texts.FOCUS_COMMITMENT_TITLE_EXPOSURE) {
    return texts.FOCUS_COMMITMENT_TITLE_EXPOSURE;
  }

  return label;
}
