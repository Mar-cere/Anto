const CLIENT_REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;

/**
 * Valida clave enviada en params de navegación (evita inyección de strings enormes o raros).
 * @param {unknown} s
 * @returns {boolean}
 */
export function isValidClientRequestId(s) {
  return typeof s === 'string' && CLIENT_REQUEST_ID_PATTERN.test(s);
}

/**
 * Clave de idempotencia para creación desde el chat (POST tareas/hábitos).
 * @returns {string}
 */
export function newClientRequestId() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}
