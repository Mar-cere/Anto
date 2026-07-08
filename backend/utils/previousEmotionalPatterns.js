/**
 * Construye patrones emocionales previos desde el historial de mensajes.
 * El historial suele venir ordenado del más reciente al más antiguo.
 */

const EMOTIONAL_CONTEXT_SELECT = [
  'content',
  'role',
  'metadata.crisis',
  'metadata.context.emotional',
  'metadata.context.response',
  'metadata.context.contextual',
  'createdAt',
].join(' ');

/**
 * @param {Array} conversationHistory - mensajes, normalmente createdAt descendente
 * @param {number} limit
 * @returns {Array}
 */
export function buildPreviousEmotionalPatterns(conversationHistory, limit = 3) {
  if (!Array.isArray(conversationHistory) || !conversationHistory.length) {
    return [];
  }

  return conversationHistory
    .filter((msg) => msg.metadata?.context?.emotional?.mainEmotion)
    .slice(0, limit)
    .map((msg) => {
      const userTurnContent =
        msg.role === 'user'
          ? String(msg.content || '')
          : findPrecedingUserContent(conversationHistory, msg);

      return {
        mainEmotion: msg.metadata.context.emotional.mainEmotion,
        intensity: msg.metadata.context.emotional.intensity || 5,
        topic: msg.metadata?.context?.contextual?.tema?.categoria || null,
        content: userTurnContent,
        timestamp: msg.createdAt,
      };
    })
    .reverse();
}

/**
 * Para metadata en respuestas del asistente, recupera el mensaje de usuario anterior.
 * @param {Array} conversationHistory - createdAt descendente
 * @param {object} assistantMsg
 * @returns {string}
 */
function findPrecedingUserContent(conversationHistory, assistantMsg) {
  const assistantTime = new Date(assistantMsg.createdAt).getTime();
  if (!Number.isFinite(assistantTime)) return '';

  let closestUser = null;
  let closestTime = -Infinity;

  for (const msg of conversationHistory) {
    if (msg.role !== 'user') continue;
    const userTime = new Date(msg.createdAt).getTime();
    if (!Number.isFinite(userTime)) continue;
    if (userTime <= assistantTime && userTime > closestTime) {
      closestTime = userTime;
      closestUser = msg;
    }
  }

  return closestUser ? String(closestUser.content || '') : '';
}

export { EMOTIONAL_CONTEXT_SELECT };
