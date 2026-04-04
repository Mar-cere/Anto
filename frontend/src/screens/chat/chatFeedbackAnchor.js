/**
 * Determina qué mensaje del asistente debe mostrar la fila "¿Te resultó útil?".
 * Solo el más reciente elegible (evita repetir la pregunta en todo el historial).
 */

import { MESSAGE_ROLES, MESSAGE_TYPES } from './chatScreenConstants';

function isValidMongoMessageId(id) {
  const s = id != null ? String(id) : '';
  return /^[a-f0-9]{24}$/i.test(s);
}

/** Tarjetas de sugerencias debajo del asistente: no mezclar con la fila de feedback */
function itemBlocksFeedbackRow(item) {
  const m = item?.userMessage || item?.assistantMessage || item;
  const t = m?.type ?? item?.type;
  return t === 'suggestions';
}

/**
 * @param {unknown[]} messages
 * @param {boolean} feedbackEnabled
 * @returns {string | null} id del mensaje o null
 */
export function getFeedbackTargetMessageId(messages, feedbackEnabled) {
  if (!feedbackEnabled || !messages?.length) return null;
  let candidateIndex = -1;
  let candidateId = null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const item = messages[i];
    const message = item.userMessage || item.assistantMessage || item;
    if (!message || message.role === MESSAGE_ROLES.USER) continue;
    if (message.type === 'suggestions') continue;
    if (message.metadata?.streaming) continue;
    if (!(message.content || '').trim().length) continue;
    const rawId = message._id || message.id;
    if (!isValidMongoMessageId(rawId)) continue;
    if (message.type === MESSAGE_TYPES.ERROR) continue;
    candidateIndex = i;
    candidateId = String(rawId);
    break;
  }
  if (candidateId == null || candidateIndex < 0) return null;
  for (let j = candidateIndex + 1; j < messages.length; j += 1) {
    if (itemBlocksFeedbackRow(messages[j])) return null;
  }
  return candidateId;
}
