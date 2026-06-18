/**
 * Códigos de error de chat vía socket que no deben activar fallback SSE.
 */
export const SOCKET_CHAT_NON_FALLBACK_CODES = new Set([
  'CONVERSATION_FORBIDDEN',
  'SUBSCRIPTION_REQUIRED',
  'RATE_LIMIT',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'MESSAGE_IN_FLIGHT',
  'INVALID_SESSION_INTENTION',
]);

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function shouldFallbackChatTransportToSse(err) {
  if (!err || typeof err !== 'object') return false;
  if (err.name === 'AbortError' || err.code === 'ABORTED') return false;
  const code = String(err.code || '').trim().toUpperCase();
  if (!code) return false;
  if (SOCKET_CHAT_NON_FALLBACK_CODES.has(code)) return false;
  return code === 'SOCKET_UNAVAILABLE' || code === 'SOCKET_TIMEOUT';
}

export default { SOCKET_CHAT_NON_FALLBACK_CODES, shouldFallbackChatTransportToSse };
