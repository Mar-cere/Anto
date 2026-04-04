/**
 * Determina qué mensaje del asistente debe mostrar la fila "¿Te resultó útil?".
 * Solo el más reciente elegible (evita repetir la pregunta en todo el historial).
 */

import { MESSAGE_ROLES, MESSAGE_TYPES } from './chatScreenConstants';

function isValidMongoMessageId(id) {
  const s = id != null ? String(id) : '';
  return /^[a-f0-9]{24}$/i.test(s);
}

/**
 * @param {unknown[]} messages
 * @param {boolean} feedbackEnabled
 * @returns {string | null} id del mensaje o null
 */
export function getFeedbackTargetMessageId(messages, feedbackEnabled) {
  if (!feedbackEnabled || !messages?.length) return null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const item = messages[i];
    const message = item.userMessage || item.assistantMessage || item;
    if (!message || message.role === MESSAGE_ROLES.USER) continue;
    if (message.type === MESSAGE_TYPES.QUICK_REPLIES || message.type === 'suggestions') continue;
    if (message.metadata?.streaming) continue;
    if (!(message.content || '').trim().length) continue;
    const rawId = message._id || message.id;
    if (!isValidMongoMessageId(rawId)) continue;
    if (message.type === MESSAGE_TYPES.ERROR) continue;
    return String(rawId);
  }
  return null;
}
