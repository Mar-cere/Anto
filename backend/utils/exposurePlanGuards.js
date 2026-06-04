/**
 * Reglas de negocio para pasos de exposición (#87 / #190) — usadas por rutas y tests.
 */

export function normalizeExposureStepIndex(plan, stepIndex) {
  const index = Number(stepIndex);
  if (!plan?.steps?.length) return null;
  if (!Number.isInteger(index) || index < 0 || index >= plan.steps.length) {
    return null;
  }
  return index;
}

/**
 * @returns {{ ok: true, stepIndex: number } | { ok: false, errorKey: string }}
 */
export function evaluateLogExposureAttempt(plan, stepIndex) {
  const index = normalizeExposureStepIndex(plan, stepIndex);
  if (index == null) return { ok: false, errorKey: 'stepIndexInvalid' };
  if (index > plan.currentStepIndex) return { ok: false, errorKey: 'stepLocked' };
  const step = plan.steps[index];
  if (step.status === 'completed') return { ok: false, errorKey: 'stepAlreadyCompleted' };
  return { ok: true, stepIndex: index };
}

/**
 * @returns {{ ok: true, stepIndex: number } | { ok: false, errorKey: string }}
 */
export function evaluateCompleteExposureStep(plan, stepIndex) {
  const index = normalizeExposureStepIndex(plan, stepIndex);
  if (index == null) return { ok: false, errorKey: 'stepIndexInvalid' };
  if (index !== plan.currentStepIndex) return { ok: false, errorKey: 'stepLocked' };
  const step = plan.steps[index];
  if (step.status === 'completed') return { ok: false, errorKey: 'stepAlreadyCompleted' };
  if (!Array.isArray(step.attempts) || step.attempts.length === 0) {
    return { ok: false, errorKey: 'stepNeedsAttempt' };
  }
  return { ok: true, stepIndex: index };
}
