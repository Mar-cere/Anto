/**
 * Mensajes de error de API de exposición (#87 / #190) para toasts en UI.
 * @param {object|null|undefined} payload
 * @param {{ toastError?: string, stepLocked?: string, completeNeedsAttempt?: string, stepAlreadyCompleted?: string }} texts
 */
export function resolveExposurePlanErrorMessage(payload, texts = {}) {
  if (!payload || typeof payload !== 'object') {
    return texts.toastError || '';
  }
  const code = String(payload.code || '').toUpperCase();
  switch (code) {
    case 'STEP_LOCKED':
      return texts.stepLocked || payload.error || texts.toastError || '';
    case 'STEP_NEEDS_ATTEMPT':
      return texts.completeNeedsAttempt || payload.error || texts.toastError || '';
    case 'STEP_ALREADY_COMPLETED':
      return texts.stepAlreadyCompleted || payload.error || texts.toastError || '';
    default:
      return payload.error || texts.toastError || '';
  }
}

export default { resolveExposurePlanErrorMessage };
