/** Alineado con backend/services/exposurePlanPrefillService.js */
export const EXPOSURE_PREFILL_MAX_GOAL = 200;
export const EXPOSURE_PREFILL_MAX_STEP = 500;

function clampField(value, maxLength) {
  const text = String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

/**
 * @param {object|null|undefined} params
 */
export function parseExposurePlanRouteParams(params) {
  const raw = params && typeof params === 'object' ? params : {};
  const fromChat = raw.fromChat === true;
  const prefillGoal = fromChat ? clampField(raw.prefillGoal, EXPOSURE_PREFILL_MAX_GOAL) : '';

  let prefillSteps = [];
  if (fromChat && Array.isArray(raw.prefillSteps)) {
    prefillSteps = raw.prefillSteps
      .map((step) => clampField(step, EXPOSURE_PREFILL_MAX_STEP))
      .filter(Boolean)
      .slice(0, 15);
  }

  return {
    fromChat,
    prefillGoal,
    prefillSteps,
  };
}
