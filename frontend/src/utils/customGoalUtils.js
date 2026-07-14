/**
 * Normalización del objetivo personal del foco (#161).
 */

export const CUSTOM_GOAL_MAX_LEN = 200;

/**
 * @param {unknown} value
 * @returns {string|null} texto limpio o null si queda vacío
 */
export function normalizeCustomGoal(value) {
  const cleaned = String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, CUSTOM_GOAL_MAX_LEN);
}
