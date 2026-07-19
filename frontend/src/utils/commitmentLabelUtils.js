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

/** «Volver a este tema…»: útil para aparcar, no para preguntar «¿pudiste hacerlo?». */
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

/**
 * Labels válidos para chips de follow-up en chat: acción concreta, no eco ni soft-resume.
 */
export function isUsableCommitmentFollowUpLabel(label) {
  const raw = String(label || '').trim();
  if (!raw) return false;
  if (looksLikeChatBubbleCommitmentLabel(raw)) return false;
  if (isSoftResumeCommitmentLabel(raw)) return false;
  if (isGenericInterventionLabel(raw)) return false;
  return isConcreteCommitmentLabel(raw);
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
 *
 * @param {object} commitment
 * @param {{ hasBaWeekRow?: boolean, hasChatContinuity?: boolean, continuityConversationId?: string|null }} [options]
 */
export function isDashboardCommitmentActionable(commitment, options = {}) {
  if (!commitment || commitment.status !== 'active') return false;
  if (shouldHideDashboardCommitmentFollowUp(commitment, options)) return false;
  // No mostrar ecos de burbuja del chat (p. ej. «Está bien no saberlo ahora…»)
  if (looksLikeChatBubbleCommitmentLabel(commitment.label)) return false;
  if (!isConcreteCommitmentLabel(commitment.label)) return false;

  const attempts = Number(commitment.followUpAttempts || 0);
  if (attempts >= MAX_DASHBOARD_FOLLOW_UP_ATTEMPTS) return false;

  const followUpDue = commitment.followUpDue === true;
  const pending = commitment.followUpAnswer === 'pending';

  // Continuidad del chat ya invita a retomar el hilo: no duplicar con «guardado para más adelante».
  // Sí mostrar cuando toca follow-up (Sí / En parte / Aún no) — otra tarea.
  if (
    options.hasChatContinuity &&
    pending &&
    !followUpDue &&
    commitmentBelongsToContinuityThread(commitment, options.continuityConversationId)
  ) {
    return false;
  }

  if (pending) {
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

/**
 * @param {object} commitment
 * @param {string|null|undefined} continuityConversationId
 */
export function commitmentBelongsToContinuityThread(commitment, continuityConversationId) {
  const cid = String(continuityConversationId || '').trim();
  if (!cid) return true; // misma intención de «volver al chat» aunque no haya id
  const commitmentCid = String(commitment?.conversationId || '').trim();
  if (!commitmentCid) return true;
  return commitmentCid === cid;
}

export function filterDashboardCommitments(commitments, options = {}) {
  return (commitments || []).filter((item) => isDashboardCommitmentActionable(item, options));
}

export function formatCommitmentFollowUpPrompt(template, label) {
  const safeLabel = String(label || '').trim();
  if (!safeLabel) return template.replace(/\{label\}/g, '').replace(/[«»""]/g, '').trim();
  return template.replace(/\{label\}/g, safeLabel);
}
