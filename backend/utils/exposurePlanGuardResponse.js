/**
 * Respuestas HTTP para guardas de exposición (#87 / #190).
 */

const EXPOSURE_GUARD_ERROR_CODES = {
  stepIndexInvalid: 'STEP_INDEX_INVALID',
  stepLocked: 'STEP_LOCKED',
  stepAlreadyCompleted: 'STEP_ALREADY_COMPLETED',
  stepNeedsAttempt: 'STEP_NEEDS_ATTEMPT',
};

/**
 * @param {string} errorKey
 * @param {ReturnType<typeof import('./exposurePlanApiCopy.js').exposurePlanApiCopy>} copy
 */
export function buildExposureGuardErrorBody(errorKey, copy) {
  const errMap = {
    stepIndexInvalid: copy.stepIndexInvalid,
    stepLocked: copy.stepLocked,
    stepAlreadyCompleted: copy.stepAlreadyCompleted,
    stepNeedsAttempt: copy.stepNeedsAttempt,
  };
  return {
    success: false,
    error: errMap[errorKey] || copy.stepIndexInvalid,
    code: EXPOSURE_GUARD_ERROR_CODES[errorKey] || 'EXPOSURE_GUARD_ERROR',
  };
}

export { EXPOSURE_GUARD_ERROR_CODES };
export default { buildExposureGuardErrorBody, EXPOSURE_GUARD_ERROR_CODES };
