/**
 * Lógica UI de avance en jerarquía de exposición (#87 / #190).
 */

/**
 * @param {number} attemptCount
 * @returns {boolean}
 */
export function canMarkExposureStepComplete(attemptCount) {
  return Number(attemptCount) > 0;
}

/**
 * Textos del diálogo de confirmación al avanzar de paso (#190).
 * @param {{
 *   stepLabel?: string,
 *   nextStepLabel?: string,
 *   isLastStep?: boolean,
 *   texts?: {
 *     currentStepFallback?: string,
 *     confirmCompleteTitle?: string,
 *     confirmCompleteBody?: string,
 *     confirmCompleteLastTitle?: string,
 *     confirmCompleteLastBody?: string,
 *   },
 * }} params
 */
export function buildExposureAdvanceConfirmCopy({
  stepLabel = '',
  nextStepLabel = '',
  isLastStep = false,
  texts = {},
} = {}) {
  const step = String(stepLabel || '').trim() || texts.currentStepFallback || 'Paso actual';
  const title = isLastStep
    ? texts.confirmCompleteLastTitle || '¿Completar jerarquía?'
    : texts.confirmCompleteTitle || '¿Listo para avanzar?';
  const message = isLastStep
    ? (texts.confirmCompleteLastBody || 'Completaste «{step}». ¿Continuar?').replace(
        '{step}',
        step,
      )
    : (texts.confirmCompleteBody || 'Siguiente: «{next}»').replace('{step}', step).replace(
        '{next}',
        String(nextStepLabel || '').trim() || '—',
      );
  return { title, message };
}

export default { canMarkExposureStepComplete, buildExposureAdvanceConfirmCopy };
