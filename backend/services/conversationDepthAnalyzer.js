/**
 * Analizador de profundidad conversacional.
 * Detecta si el usuario busca exploración profunda o conversación ligera.
 * @see docs/MEJORAS_SERVICIOS_CHAT.md - Fase 2, punto 7
 *
 * Entrada: content, conversationHistory, emotionalAnalysis
 * Salida: depthPreference: 'superficial' | 'moderado' | 'profundo'
 * Uso: Ajustar longitud y profundidad de las respuestas del asistente.
 */
const PATRONES_PROFUNDO = [
  /\bpor qué\b/i,
  /\bqué significa\b/i,
  /\bqué piensas\b/i,
  /\bcómo puedo\s+(entender|comprender|superar|mejorar)/i,
  /\bquiero entender\b/i,
  /\bnecesito entender\b/i,
  /\bno entiendo\b/i,
  /\bme cuesta\s+(entender|comprender|aceptar)/i,
  /\bdesde hace tiempo\b/i,
  /\bsiempre he\b/i,
  /\bnunca he podido\b/i,
  /\bme gustaría profundizar\b/i,
  /\bhay algo más\b/i,
  /\bno sé qué me pasa\b/i,
  /\balgo más profundo\b/i,
  /\bexplorar\b/i,
  /\breflexionar\b/i,
  /\bentender mejor\b/i,
  /\bqué puedo hacer para\b/i,
  /\bcuál es la causa\b/i,
  /\bpor qué me pasa\b/i,
  /\bqué está pasando conmigo\b/i
];

const PATRONES_SUPERFICIAL = [
  /^hola\s*[!.]?$/i,
  /^buenos?\s*(días?|tardes?|noches?)\s*[!.]?$/i,
  /^qué tal\s*[!.]?$/i,
  /^cómo estás\s*[!.]?$/i,
  /^gracias\s*[!.]?$/i,
  /^ok\s*[!.]?$/i,
  /^vale\s*[!.]?$/i,
  /^de acuerdo\s*[!.]?$/i,
  /^bien\s*[!.]?$/i,
  /^genial\s*[!.]?$/i,
  /^perfecto\s*[!.]?$/i,
  /^nada\s*[!.]?$/i,
  /^todo bien\s*[!.]?$/i,
  /^solo pasaba\b/i,
  /^solo quería saludar\b/i,
  /^un saludo\b/i
];

const UMBRAL_LONGITUD_PROFUNDO = 80;   // caracteres
const UMBRAL_LONGITUD_SUPERFICIAL = 30;
const UMBRAL_INTENSIDAD_PROFUNDO = 6;
const UMBRAL_HISTORIAL_PROFUNDO = 4;   // mensajes de usuario en conversación

/**
 * Analiza la preferencia de profundidad del usuario en la conversación actual.
 * @param {Object} params
 * @param {string} params.content - Contenido del mensaje actual
 * @param {Array} [params.conversationHistory] - Historial de mensajes (con role, content)
 * @param {Object} [params.emotionalAnalysis] - Análisis emocional (mainEmotion, intensity)
 * @returns {{ depthPreference: 'superficial' | 'moderado' | 'profundo' }}
 */
function analyzeDepth({ content, conversationHistory = [], emotionalAnalysis = {} }) {
  const text = (content || '').trim();
  if (!text) return { depthPreference: 'moderado' };

  let score = 0; // positivo = profundo, negativo = superficial

  // 1. Patrones explícitos de profundidad
  if (PATRONES_PROFUNDO.some(p => p.test(text))) score += 2;
  if (PATRONES_SUPERFICIAL.some(p => p.test(text))) score -= 2;

  // 2. Longitud del mensaje
  if (text.length >= UMBRAL_LONGITUD_PROFUNDO) score += 1;
  else if (text.length <= UMBRAL_LONGITUD_SUPERFICIAL) score -= 1;

  // 3. Preguntas (indican exploración)
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount >= 2) score += 1;
  else if (questionCount === 1 && text.length > 50) score += 0.5;

  // 4. Intensidad emocional alta sugiere necesidad de profundidad
  const intensity = emotionalAnalysis?.intensity ?? 5;
  if (intensity >= UMBRAL_INTENSIDAD_PROFUNDO) score += 1;
  else if (intensity <= 3 && text.length < 40) score -= 0.5;

  // 5. Historial: conversación larga sugiere que el usuario está en modo exploración
  const userMessages = (conversationHistory || []).filter(m => m.role === 'user');
  if (userMessages.length >= UMBRAL_HISTORIAL_PROFUNDO) score += 0.5;

  // 6. Emociones que suelen requerir más profundidad
  const emotion = (emotionalAnalysis?.mainEmotion || '').toLowerCase();
  if (['tristeza', 'ansiedad', 'enojo', 'miedo', 'culpa', 'verguenza'].includes(emotion) && intensity >= 5) {
    score += 0.5;
  }

  // Decidir preferencia
  if (score >= 2) return { depthPreference: 'profundo' };
  if (score <= -1.5) return { depthPreference: 'superficial' };
  return { depthPreference: 'moderado' };
}

const conversationDepthAnalyzer = {
  analyzeDepth
};

export default conversationDepthAnalyzer;
