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

/** Etiquetas que son eco de la burbuja del chat (no un acuerdo corto). */
export function looksLikeChatBubbleCommitmentLabel(label) {
  const t = String(label || '').trim();
  if (!t) return true;
  if (t.length > 100) return true;
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
 * Solo mostrar en dashboard cuando el compromiso es accionable o recién guardado.
 * Evita filas fantasma (vacías / genéricas); sí muestra pendientes recién creados
 * (chips de seguimiento solo cuando followUpDue).
 */
export function isDashboardCommitmentActionable(commitment, options = {}) {
  if (!commitment || commitment.status !== 'active') return false;
  if (shouldHideDashboardCommitmentFollowUp(commitment, options)) return false;
  // No mostrar ecos de burbuja del chat (p. ej. «Está bien no saberlo ahora…»)
  if (looksLikeChatBubbleCommitmentLabel(commitment.label)) return false;
  if (!isConcreteCommitmentLabel(commitment.label)) return false;

  const attempts = Number(commitment.followUpAttempts || 0);
  if (attempts >= MAX_DASHBOARD_FOLLOW_UP_ATTEMPTS) return false;

  // Compromiso guardado y pendiente: visible ya (p. ej. tras Guardar en el chat)
  if (commitment.followUpAnswer === 'pending') {
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
