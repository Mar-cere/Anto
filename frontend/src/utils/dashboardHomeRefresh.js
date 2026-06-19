/** Mínimo entre refrescos automáticos al volver al Inicio (ms). */
export const HOME_FOCUS_REFRESH_MIN_MS = 20_000;

/**
 * @param {number} lastRefreshAt epoch ms; 0 = nunca
 * @param {number} [now=Date.now()]
 * @param {number} [minMs=HOME_FOCUS_REFRESH_MIN_MS]
 */
export function shouldRefreshHomeOnFocus(
  lastRefreshAt,
  now = Date.now(),
  minMs = HOME_FOCUS_REFRESH_MIN_MS,
) {
  if (!lastRefreshAt || lastRefreshAt <= 0) return true;
  return now - lastRefreshAt >= minMs;
}

/**
 * @param {unknown} focusRes
 * @param {object|null} previous
 * @returns {object|null}
 */
export function mergeFocusResponse(focusRes, previous) {
  if (focusRes && typeof focusRes === 'object' && focusRes.notModified === true) {
    return previous ?? null;
  }
  if (focusRes?.success && focusRes?.data) {
    return focusRes.data;
  }
  return previous ?? null;
}
