/**
 * Validación y filtrado de compromisos en el cliente (#202).
 */

const BEHAVIORAL_ACTIVATION_LABELS = new Set([
  'activacion conductual',
  'behavioral activation',
]);

const GENERIC_INTERVENTION_LABELS = new Set([
  ...BEHAVIORAL_ACTIVATION_LABELS,
  'ejercicio de respiracion',
  'breathing exercise',
  'tecnica de grounding',
  'grounding technique',
  'recordatorio de mindfulness',
  'mindfulness reminder',
  'autocuidado',
  'self care',
  'self-care',
  'ejercicio de autocompasion',
  'self compassion exercise',
  'diario de gratitud',
  'gratitude journal',
  'autorregistro abc',
  'abc record',
  'jerarquia de exposicion',
  'exposure hierarchy',
  'pensamiento automatico',
  'automatic thought record',
]);

export function normalizeCommitmentLabel(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function isGenericInterventionLabel(label) {
  const normalized = normalizeCommitmentLabel(label);
  if (!normalized) return false;
  return GENERIC_INTERVENTION_LABELS.has(normalized);
}

export function isBehavioralActivationLabel(label) {
  const normalized = normalizeCommitmentLabel(label);
  if (!normalized) return false;
  return BEHAVIORAL_ACTIVATION_LABELS.has(normalized);
}

export function isConcreteCommitmentLabel(label, stepLabel = '') {
  const normalized = normalizeCommitmentLabel(label);
  if (normalized.length < 2) return false;
  if (stepLabel && normalized === normalizeCommitmentLabel(stepLabel)) return false;
  return !isGenericInterventionLabel(normalized);
}

/**
 * Oculta seguimiento en dashboard cuando el compromiso BA duplica la fila del plan semanal
 * o la etiqueta es genérica (sin acción concreta).
 */
export function shouldHideDashboardCommitmentFollowUp(commitment, { hasBaWeekRow = false } = {}) {
  if (!commitment) return true;
  if (hasBaWeekRow && commitment.interventionId === 'behavioral_activation') return true;
  if (hasBaWeekRow && isBehavioralActivationLabel(commitment.label)) return true;
  if (isGenericInterventionLabel(commitment.label)) return true;
  return false;
}

const MAX_DASHBOARD_FOLLOW_UP_ATTEMPTS = 2; // alineado con backend MAX_FOLLOW_UP_ATTEMPTS

/**
 * Solo mostrar en dashboard cuando hay seguimiento o renegociación accionable.
 * Evita filas vacías con solo «Tu compromiso».
 */
export function isDashboardCommitmentActionable(commitment, options = {}) {
  if (!commitment || commitment.status !== 'active') return false;
  if (shouldHideDashboardCommitmentFollowUp(commitment, options)) return false;

  const attempts = Number(commitment.followUpAttempts || 0);
  if (attempts >= MAX_DASHBOARD_FOLLOW_UP_ATTEMPTS) return false;

  if (commitment.followUpAnswer === 'pending' && commitment.followUpDue === true) {
    return true;
  }

  if (
    commitment.followUpAnswer === 'no' &&
    attempts >= 1 &&
    attempts < MAX_DASHBOARD_FOLLOW_UP_ATTEMPTS
  ) {
    return true;
  }

  return false;
}

export function filterDashboardCommitments(commitments, options = {}) {
  return (commitments || []).filter((item) => isDashboardCommitmentActionable(item, options));
}

export function formatCommitmentFollowUpPrompt(template, label) {
  const safeLabel = String(label || '').trim();
  if (!safeLabel) return template.replace(/\{label\}/g, '').replace(/[«»""]/g, '').trim();
  return template.replace(/\{label\}/g, safeLabel);
}
