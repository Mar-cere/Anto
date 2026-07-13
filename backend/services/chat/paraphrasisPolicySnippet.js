/**
 * Policy snippet bilingüe (ES/EN) que instruye al LLM a parafrasear
 * antes de intervenir en turnos de carga emocional significativa.
 * 
 * Propuesta #55: Paráfrasis + validación antes consejo
 * 
 * La paráfrasis es una habilidad terapéutica fundamental que:
 * - Mejora la alianza terapéutica
 * - Reduce alucinaciones interpretativas
 * - Aumenta la sensación de ser escuchado/a
 * - Valida la experiencia del usuario antes de orientar
 */

/**
 * Límites y constraints para paráfrasis
 */
export const PARAPHRASIS_LIMITS = {
  MAX_USER_MESSAGE_LENGTH: 500, // No parafrasear mensajes muy largos (resumir en cambio)
  MIN_USER_MESSAGE_LENGTH: 10, // No parafrasear mensajes muy cortos
  MAX_CONSECUTIVE_PARAPHRASIS: 3, // Máximo 3 paráfrasis consecutivas en conversación
  COOLDOWN_TURNS: 2, // Turnos de espera después de paráfrasis
  MIN_EMOTIONAL_INTENSITY: 7, // Umbral de intensidad para paráfrasis obligatoria
};

/**
 * Emociones vulnerables que siempre requieren paráfrasis.
 */
const VULNERABLE_EMOTIONS = [
  'miedo',
  'tristeza',
  'vergüenza',
  'culpa',
  'ansiedad',
  'soledad',
  'desesperanza',
];

/**
 * Construye el snippet de policy de paráfrasis según idioma y contexto.
 * 
 * @param {string} language - Idioma ('es' o 'en')
 * @param {Object} context - Contexto del turno
 * @param {number} [context.emotionalIntensity] - Intensidad emocional (1-10)
 * @param {string} [context.mainEmotion] - Emoción principal
 * @param {boolean} [context.isFirstTurn] - Si es el primer turno del usuario
 * @param {boolean} [context.isCrisisActive] - Si hay crisis activa
 * @param {boolean} [context.isFactualQuery] - Si es consulta factual
 * @param {number} [context.messageLength] - Longitud del mensaje
 * @param {boolean} [context.hasAbruptToneChange] - Si hay cambio abrupto de tono
 * @param {boolean} [context.previousTurnWasParaphrasis] - Si turno anterior fue paráfrasis
 * @param {boolean} [context.userExpressesLackOfUnderstanding] - Usuario dice "no me entiendes"
 * @returns {string} Snippet de policy o string vacío si no aplica
 */
export function buildParaphrasisPolicySnippet(language, context = {}) {
  // Validar tipo de language
  if (typeof language !== 'string') {
    console.warn('[buildParaphrasisPolicySnippet] Invalid language type, defaulting to "es"');
    language = 'es';
  }

  // Validar tipo de context
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    console.warn('[buildParaphrasisPolicySnippet] Invalid context type, using empty object');
    context = {};
  }

  // Reglas de disparo: cuándo se requiere paráfrasis
  const requiresParaphrasis = shouldRequireParaphrasis(context);

  if (!requiresParaphrasis) {
    return '';
  }

  if (language === 'en') {
    return `

## Paraphrasing before intervening

Before offering guidance or suggestions, **first paraphrase** what the user expressed:
- Reflect their emotion and core need in your own words
- Validate their experience without adding interpretation
- Ask for confirmation: "Did I understand correctly?" or "Is that right?"

Only after the user confirms or clarifies, offer your therapeutic response.

**Example:**
User: "I'm so stressed at work, I can't take it anymore."
You: "I understand that work is generating a lot of stress for you and you feel like you've reached your limit. Is that right?"
[Wait for confirmation]
You: "I hear you. When you feel like you can't take it anymore..."

**Important:**
- Keep the paraphrase brief and focused on core emotion
- Don't add advice or interpretation in the paraphrase
- If the user says "yes" or confirms, move forward
- If they clarify, adjust your understanding first
`;
  }

  // Español (default)
  return `

## Paráfrasis antes de intervenir

Antes de ofrecer orientación o sugerencias, **primero parafrasea** lo que expresó el usuario:
- Refleja su emoción y necesidad central con tus propias palabras
- Valida su experiencia sin agregar interpretación
- Pide confirmación: "¿Te entendí bien?" o "¿Es así?"

Solo después de que el usuario confirme o aclare, ofrece tu respuesta terapéutica.

**Ejemplo:**
Usuario: "Estoy muy estresada en el trabajo, ya no puedo más."
Tú: "Entiendo que el trabajo te está generando mucho estrés y sientes que llegaste a un límite. ¿Es así?"
[Espera confirmación]
Tú: "Te escucho. Cuando sientas que no puedes más..."

**Importante:**
- Mantén la paráfrasis breve y enfocada en la emoción central
- No agregues consejos ni interpretaciones en la paráfrasis
- Si el usuario dice "sí" o confirma, continúa adelante
- Si aclara o corrige, ajusta primero tu comprensión
`;
}

/**
 * Determina si el turno actual requiere paráfrasis.
 * 
 * Reglas de disparo:
 * 1. Intensidad emocional >= 7 (alta carga emocional)
 * 2. Primer turno del usuario en la conversación (establecer alianza)
 * 3. Usuario expresa sentimiento de no ser escuchado/comprendido
 * 4. Cambio abrupto de tema o tono
 * 5. Usuario comparte emoción vulnerable (miedo, tristeza, vergüenza, etc.)
 * 
 * Excepciones (NO requiere paráfrasis):
 * - Crisis activa (protocolo de crisis tiene prioridad)
 * - Consulta factual breve (ej: "¿Qué es CBT?")
 * - Mensaje muy corto sin carga emocional (<10 caracteres)
 * - Usuario ya confirmó comprensión en turno anterior
 * - Ya se parafraseó recientemente (cooldown)
 * 
 * @param {Object} context - Contexto del turno
 * @returns {boolean} True si requiere paráfrasis
 */
export function shouldRequireParaphrasis(context = {}) {
  // Validar tipo de context
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return false;
  }

  const {
    emotionalIntensity = 5,
    mainEmotion,
    isFirstTurn = false,
    isCrisisActive = false,
    isFactualQuery = false,
    messageLength = 0,
    hasAbruptToneChange = false,
    previousTurnWasParaphrasis = false,
    userExpressesLackOfUnderstanding = false,
  } = context;

  // Validar y normalizar emotionalIntensity
  const normalizedIntensity =
    typeof emotionalIntensity === 'number' && !isNaN(emotionalIntensity) && isFinite(emotionalIntensity)
      ? Math.max(0, Math.min(10, emotionalIntensity))
      : 5;

  // Validar y normalizar messageLength
  const normalizedMessageLength =
    typeof messageLength === 'number' && !isNaN(messageLength) && isFinite(messageLength) && messageLength >= 0
      ? messageLength
      : 0;

  // Validar tipo de mainEmotion
  const normalizedMainEmotion = typeof mainEmotion === 'string' ? mainEmotion : null;

  // Excepciones: NO parafrasear
  if (isCrisisActive === true) return false; // Crisis tiene prioridad
  if (isFactualQuery === true) return false; // Consulta factual no necesita paráfrasis
  if (normalizedMessageLength < PARAPHRASIS_LIMITS.MIN_USER_MESSAGE_LENGTH) return false; // Muy corto
  if (normalizedMessageLength > PARAPHRASIS_LIMITS.MAX_USER_MESSAGE_LENGTH) return false; // Muy largo
  if (previousTurnWasParaphrasis === true) return false; // Ya parafraseamos en turno anterior

  // Reglas de disparo: SÍ parafrasear
  if (normalizedIntensity >= PARAPHRASIS_LIMITS.MIN_EMOTIONAL_INTENSITY) return true; // Alta carga
  if (isFirstTurn === true) return true; // Primer contacto
  if (hasAbruptToneChange === true) return true; // Cambio de tono
  if (userExpressesLackOfUnderstanding === true) return true; // Usuario se siente incomprendido

  // Emociones vulnerables siempre requieren paráfrasis
  if (normalizedMainEmotion) {
    const emotionLower = normalizedMainEmotion.toLowerCase();
    if (VULNERABLE_EMOTIONS.some((vulnEmo) => emotionLower.includes(vulnEmo))) {
      return true;
    }
  }

  return false;
}

/**
 * Detecta si el usuario expresa que no se siente escuchado/comprendido.
 * 
 * Patterns comunes:
 * - "no me entiendes"
 * - "no me escuchas"
 * - "parece que no captas"
 * - "siento que no me comprendes"
 * - "no estás entendiendo"
 * 
 * @param {string} userMessage - Mensaje del usuario
 * @returns {boolean} True si detecta falta de comprensión
 */
export function detectsLackOfUnderstanding(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return false;

  const patterns = [
    /no\s+(me\s+)?(entiendes?|comprendes?|escuchas?|captas?)/i,
    /parece\s+que\s+no\s+(me\s+)?(entiendes?|escuchas?)/i,
    /siento\s+que\s+no\s+(me\s+)?(entiendes?|escuchas?|comprendes?)/i,
    /no\s+(estás?|estas?)\s+(entendiendo|escuchando|captando)/i,
    /nadie\s+(me\s+)?(entiende|escucha|comprende)/i,
  ];

  return patterns.some((pattern) => pattern.test(userMessage));
}

/**
 * Valida constraints adicionales antes de requerir paráfrasis.
 * 
 * Verifica:
 * - Longitud del mensaje dentro de límites
 * - No exceder máximo de paráfrasis consecutivas
 * - Respetar cooldown después de paráfrasis
 * 
 * @param {Object} context - Contexto del turno
 * @param {Array} [conversationHistory] - Historial de la conversación (opcional)
 * @returns {Object} { valid: boolean, reason?: string }
 */
export function validateParaphrasisConstraints(context, conversationHistory = []) {
  // Validar tipo de context
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return { valid: false, reason: 'invalid_context' };
  }

  const { messageLength = 0 } = context;

  // Validar y normalizar messageLength
  const normalizedMessageLength =
    typeof messageLength === 'number' && !isNaN(messageLength) && isFinite(messageLength) && messageLength >= 0
      ? messageLength
      : 0;

  // Mensaje muy largo: mejor resumir que parafrasear
  if (normalizedMessageLength > PARAPHRASIS_LIMITS.MAX_USER_MESSAGE_LENGTH) {
    return { valid: false, reason: 'message_too_long' };
  }

  // Mensaje muy corto
  if (normalizedMessageLength < PARAPHRASIS_LIMITS.MIN_USER_MESSAGE_LENGTH) {
    return { valid: false, reason: 'message_too_short' };
  }

  // Validar tipo de conversationHistory
  if (!Array.isArray(conversationHistory)) {
    console.warn('[validateParaphrasisConstraints] conversationHistory is not an array, skipping count check');
    return { valid: true };
  }

  // Contar paráfrasis consecutivas recientes
  if (conversationHistory.length > 0) {
    const recentParaphrasis = countRecentParaphrasis(
      conversationHistory,
      PARAPHRASIS_LIMITS.MAX_CONSECUTIVE_PARAPHRASIS // Contar hasta el máximo permitido
    );

    if (recentParaphrasis >= PARAPHRASIS_LIMITS.MAX_CONSECUTIVE_PARAPHRASIS) {
      return { valid: false, reason: 'max_consecutive_reached' };
    }
  }

  return { valid: true };
}

/**
 * Cuenta cuántas paráfrasis recientes hay en el historial.
 * 
 * @param {Array} conversationHistory - Historial de mensajes
 * @param {number} lookbackTurns - Cuántos turnos atrás revisar
 * @returns {number} Cantidad de paráfrasis en el rango
 */
export function countRecentParaphrasis(conversationHistory, lookbackTurns) {
  if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    return 0;
  }

  // Validar y normalizar lookbackTurns
  const normalizedLookback =
    typeof lookbackTurns === 'number' && !isNaN(lookbackTurns) && isFinite(lookbackTurns) && lookbackTurns > 0
      ? Math.floor(lookbackTurns)
      : PARAPHRASIS_LIMITS.COOLDOWN_TURNS;

  // Tomar los últimos N turnos del asistente, filtrando mensajes malformados
  const recentAssistantTurns = conversationHistory
    .filter((msg) => {
      // Validar que msg sea un objeto y tenga role
      return msg && typeof msg === 'object' && msg.role === 'assistant';
    })
    .slice(-normalizedLookback);

  // Contar cuántos tienen marca de paráfrasis
  return recentAssistantTurns.filter((msg) => {
    // Acceso seguro a metadata anidado
    return (
      msg.metadata &&
      typeof msg.metadata === 'object' &&
      msg.metadata.paraphrasis &&
      typeof msg.metadata.paraphrasis === 'object' &&
      msg.metadata.paraphrasis.wasParaphrasis === true
    );
  }).length;
}

/**
 * Marca el turno como paráfrasis en los metadatos.
 * Esto permite evitar parafrasear dos veces seguidas.
 * 
 * @param {Object} [metadata={}] - Metadatos existentes del mensaje
 * @returns {Object} Metadatos actualizados con marca de paráfrasis
 */
export function markTurnAsParaphrasis(metadata = {}) {
  // Validar tipo de metadata
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    console.warn('[markTurnAsParaphrasis] Invalid metadata type, using empty object');
    metadata = {};
  }

  return {
    ...metadata,
    paraphrasis: {
      wasParaphrasis: true,
      timestamp: new Date().toISOString(),
    },
  };
}
