/**
 * Tracker de engagement del usuario.
 * Mide engagement (longitud de mensajes, frecuencia, follow-ups) para personalizar respuestas.
 * @see docs/MEJORAS_SERVICIOS_CHAT.md - Fase 3, punto 11
 *
 * Entrada: Historial de mensajes del usuario
 * Salida: engagementLevel, preferredResponseLength, responseToQuestionRatio
 */
const UMBRAL_LARGO = 80;       // caracteres para considerar mensaje "largo"
const UMBRAL_CORTO = 25;      // caracteres para considerar mensaje "corto"
const MIN_MENSAJES = 5;       // mínimo para análisis fiable
const RATIO_PREGUNTA = 0.3;  // si >30% de mensajes tienen ?, usuario hace preguntas

/**
 * Analiza el engagement del usuario a partir de su historial de mensajes.
 * @param {Array} userMessages - Mensajes del usuario [{ content, ... }]
 * @returns {{ engagementLevel: string, preferredResponseLength: string, responseToQuestionRatio: number }}
 */
function analyzeEngagement(userMessages = []) {
  const messages = (userMessages || [])
    .filter(m => m && (m.content || '').trim().length > 0)
    .map(m => ({ content: (m.content || '').trim(), length: (m.content || '').trim().length }));

  if (messages.length < MIN_MENSAJES) {
    return {
      engagementLevel: 'unknown',
      preferredResponseLength: 'MEDIUM',
      responseToQuestionRatio: 0.5
    };
  }

  const totalChars = messages.reduce((sum, m) => sum + m.length, 0);
  const avgLength = totalChars / messages.length;
  const longMessages = messages.filter(m => m.length >= UMBRAL_LARGO).length;
  const shortMessages = messages.filter(m => m.length <= UMBRAL_CORTO).length;
  const messagesWithQuestion = messages.filter(m => (m.content || '').includes('?')).length;
  const responseToQuestionRatio = messagesWithQuestion / messages.length;

  // engagementLevel: bajo (muchos mensajes cortos), medio, alto (mensajes largos, muchas preguntas)
  let engagementLevel = 'medium';
  if (shortMessages / messages.length > 0.6 && avgLength < 35) {
    engagementLevel = 'low';
  } else if ((longMessages / messages.length > 0.3 || responseToQuestionRatio > 0.4) && avgLength > 50) {
    engagementLevel = 'high';
  }

  // preferredResponseLength: inferir de longitud media y ratio de preguntas
  let preferredResponseLength = 'MEDIUM';
  if (engagementLevel === 'low' || (avgLength < 40 && responseToQuestionRatio < 0.2)) {
    preferredResponseLength = 'SHORT';
  } else if (engagementLevel === 'high' || (avgLength > 70 || responseToQuestionRatio > 0.35)) {
    preferredResponseLength = 'LONG';
  }

  return {
    engagementLevel,
    preferredResponseLength,
    responseToQuestionRatio: Math.round(responseToQuestionRatio * 100) / 100
  };
}

const engagementTracker = {
  analyzeEngagement
};

export default engagementTracker;
