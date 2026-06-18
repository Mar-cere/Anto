/**
 * Payload de error Socket.IO para chat (alineado con códigos HTTP/SSE).
 * @param {unknown} error
 * @returns {{ message: string, code?: string }}
 */
export function buildSocketChatErrorPayload(error) {
  const message =
    (error && typeof error === 'object' && error.message) ||
    (typeof error === 'string' ? error : '') ||
    'Error al procesar el mensaje';
  const rawCode =
    error && typeof error === 'object' && error.code ? String(error.code).trim() : '';
  const code = rawCode ? rawCode.toUpperCase() : undefined;
  return code ? { message, code } : { message };
}

export default { buildSocketChatErrorPayload };
