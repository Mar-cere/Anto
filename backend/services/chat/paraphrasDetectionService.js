/**
 * Servicio de detección de paráfrasis en respuestas del asistente.
 * Propuesta #55: Paráfrasis + validación antes consejo - Fase 2
 *
 * Analiza si la respuesta del asistente contiene una paráfrasis usando heurísticas:
 * - Presencia de frases clave ("Entiendo que...", "Te escucho...", etc.)
 * - Pregunta de confirmación ("¿Es así?", "¿Te entendí bien?", etc.)
 * - Similitud semántica con mensaje del usuario (pero no copia textual)
 * - Longitud moderada (no muy corta ni muy larga)
 */

/**
 * Límites de detección de paráfrasis
 */
export const DETECTION_LIMITS = {
  MIN_ASSISTANT_LENGTH: 20, // Longitud mínima para considerar paráfrasis
  MAX_ASSISTANT_LENGTH: 500, // Longitud máxima para paráfrasis (más allá es respuesta completa)
  MIN_SIMILARITY: 0.3, // Similitud mínima con mensaje del usuario
  MAX_SIMILARITY: 0.8, // Similitud máxima (más allá es copia textual)
  CONFIDENCE_THRESHOLD: 0.5, // Umbral para considerar que hay paráfrasis
  MIN_WORD_LENGTH: 3, // Longitud mínima de palabra para similitud
};

/**
 * Frases clave que indican paráfrasis (español)
 */
const PARAPHRASIS_PHRASES_ES = [
  /entiendo\s+que/i,
  /veo\s+que/i,
  /te\s+escucho/i,
  /siento\s+que\s+(est[aá]s|sientes|te\s+sientes)/i,
  /lo\s+que\s+(me\s+)?(dices|comentas|cuentas|compartes)\s+(es|que)/i,
  /parece\s+que/i,
  /percibo\s+que/i,
  /me\s+(dices|comentas|cuentas|compartes)\s+que/i,
  /capt[oé]\s+que/i,
];

/**
 * Frases clave que indican paráfrasis (inglés)
 */
const PARAPHRASIS_PHRASES_EN = [
  /i\s+understand\s+(that|you)/i,
  /i\s+see\s+(that|you)/i,
  /i\s+hear\s+you/i,
  /i\s+(sense|feel)\s+(that|you)/i,
  /what\s+you'?re\s+(saying|telling|sharing)\s+is/i,
  /it\s+seems\s+(like|that)/i,
  /i\s+get\s+that/i,
];

/**
 * Preguntas de confirmación (español)
 */
const CONFIRMATION_QUESTIONS_ES = [
  /¿(te\s+entend[ií]|entend[ií])\s+(bien|correctamente)/i,
  /¿es\s+as[ií]/i,
  /¿as[ií]\s+es/i,
  /¿verdad\?/i,
  /¿estoy\s+en\s+lo\s+correcto/i,
  /¿(me\s+)?equivoco/i,
  /¿cierto\?/i,
];

/**
 * Preguntas de confirmación (inglés)
 */
const CONFIRMATION_QUESTIONS_EN = [
  /(did\s+i|have\s+i)\s+(understand|get\s+that)\s+(correctly|right)/i,
  /is\s+that\s+(right|correct)/i,
  /right\?$/i,
  /am\s+i\s+(right|correct)/i,
  /does\s+that\s+(sound|seem)\s+right/i,
];

/**
 * Analiza si la respuesta del asistente contiene una paráfrasis.
 *
 * @param {string} assistantMessage - Respuesta del asistente
 * @param {string} userMessage - Mensaje original del usuario
 * @param {string} [language='es'] - Idioma ('es' o 'en')
 * @returns {Object} { hasParaphrasis: boolean, confidence: number (0-1), details: object }
 */
export function detectParaphrasisInResponse(assistantMessage, userMessage, language = 'es') {
  // Validar entrada
  if (!assistantMessage || typeof assistantMessage !== 'string') {
    return { hasParaphrasis: false, confidence: 0, details: { reason: 'invalid_assistant_message' } };
  }

  if (!userMessage || typeof userMessage !== 'string') {
    return { hasParaphrasis: false, confidence: 0, details: { reason: 'invalid_user_message' } };
  }

  const normalizedLanguage = typeof language === 'string' ? language.toLowerCase() : 'es';

  // Validar longitud del mensaje del asistente
  if (assistantMessage.length < DETECTION_LIMITS.MIN_ASSISTANT_LENGTH) {
    return { hasParaphrasis: false, confidence: 0, details: { reason: 'message_too_short' } };
  }

  if (assistantMessage.length > DETECTION_LIMITS.MAX_ASSISTANT_LENGTH) {
    return { hasParaphrasis: false, confidence: 0, details: { reason: 'message_too_long' } };
  }

  let score = 0;
  const details = {};

  // Seleccionar patterns según idioma
  const paraphrasisPhrases = normalizedLanguage === 'en' ? PARAPHRASIS_PHRASES_EN : PARAPHRASIS_PHRASES_ES;
  const confirmationQuestions =
    normalizedLanguage === 'en' ? CONFIRMATION_QUESTIONS_EN : CONFIRMATION_QUESTIONS_ES;

  // 1. Frases clave de paráfrasis (peso: 0.4)
  const hasPhraseKey = paraphrasisPhrases.some((p) => p.test(assistantMessage));
  if (hasPhraseKey) {
    score += 0.4;
    details.hasPhraseKey = true;
  }

  // 2. Pregunta de confirmación (peso: 0.3)
  const hasConfirmation = confirmationQuestions.some((q) => q.test(assistantMessage));
  if (hasConfirmation) {
    score += 0.3;
    details.hasConfirmation = true;
  }

  // 3. Longitud moderada (peso: 0.1)
  if (
    assistantMessage.length >= DETECTION_LIMITS.MIN_ASSISTANT_LENGTH &&
    assistantMessage.length <= DETECTION_LIMITS.MAX_ASSISTANT_LENGTH
  ) {
    score += 0.1;
    details.hasModerateLength = true;
  }

  // 4. Similitud semántica (peso: 0.2)
  const similarity = calculateSimilarity(assistantMessage, userMessage);
  details.similarity = similarity;

  if (similarity >= DETECTION_LIMITS.MIN_SIMILARITY && similarity <= DETECTION_LIMITS.MAX_SIMILARITY) {
    score += 0.2;
    details.hasSemanticSimilarity = true;
  } else if (similarity > DETECTION_LIMITS.MAX_SIMILARITY) {
    // Penalizar copia textual
    score -= 0.2;
    details.isTextualCopy = true;
  }

  return {
    hasParaphrasis: score >= DETECTION_LIMITS.CONFIDENCE_THRESHOLD,
    confidence: Math.max(0, Math.min(score, 1.0)),
    details,
  };
}

/**
 * Calcula similitud entre dos strings basado en palabras en común.
 * Retorna valor entre 0 (totalmente diferentes) y 1 (idénticos).
 *
 * @param {string} str1 - Primer string
 * @param {string} str2 - Segundo string
 * @returns {number} Similitud (0-1)
 */
export function calculateSimilarity(str1, str2) {
  // Validar entrada
  if (!str1 || typeof str1 !== 'string' || !str2 || typeof str2 !== 'string') {
    return 0;
  }

  // Normalizar y extraer palabras significativas (> MIN_WORD_LENGTH caracteres)
  const words1 = new Set(
    str1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > DETECTION_LIMITS.MIN_WORD_LENGTH)
  );

  const words2 = new Set(
    str2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > DETECTION_LIMITS.MIN_WORD_LENGTH)
  );

  // Manejar caso de conjuntos vacíos
  if (words1.size === 0 && words2.size === 0) {
    return 0;
  }

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  // Calcular intersección y unión (Jaccard similarity)
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Detecta si el mensaje es muy corto para contener paráfrasis.
 *
 * @param {string} message - Mensaje a validar
 * @returns {boolean} True si es muy corto
 */
export function isTooShortForParaphrasis(message) {
  if (!message || typeof message !== 'string') {
    return true;
  }

  return message.trim().length < DETECTION_LIMITS.MIN_ASSISTANT_LENGTH;
}

/**
 * Detecta si el mensaje es muy largo para ser solo paráfrasis.
 *
 * @param {string} message - Mensaje a validar
 * @returns {boolean} True si es muy largo
 */
export function isTooLongForParaphrasis(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  return message.length > DETECTION_LIMITS.MAX_ASSISTANT_LENGTH;
}
