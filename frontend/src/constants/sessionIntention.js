/**
 * Intención de sesión (#72) — misma lista que el backend (API estable).
 */
export const SESSION_INTENTION_VALUES = ['vent', 'organize', 'technique', 'plan'];

/**
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidSessionIntentionId(id) {
  const s = String(id ?? '').trim();
  return SESSION_INTENTION_VALUES.includes(s);
}
