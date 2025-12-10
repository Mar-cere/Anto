/**
 * Constantes de OpenAI Service
 * 
 * Este archivo centraliza todas las constantes relacionadas con:
 * - Configuración del modelo de OpenAI
 * - Parámetros de generación (temperatura, tokens, penalties)
 * - Validación y filtros de respuestas
 * - Coherencia emocional
 * - Mensajes de error
 * - Configuración de historial y contexto
 */

// ========== CONFIGURACIÓN DEL MODELO ==========

// Modelo de OpenAI a utilizar
export const OPENAI_MODEL = 'gpt-5-mini';

// ========== LONGITUDES DE RESPUESTA (tokens) ==========
// Límites optimizados basados en monitoreo: GPT-5 Mini usa ~300-500 tokens de reasoning
// Establecemos límites que permitan reasoning + contenido sin ser excesivos
export const RESPONSE_LENGTHS = {
  SHORT: 800,    // Respuestas cortas (saludos) - 300 reasoning + 500 contenido
  MEDIUM: 1000,  // Respuestas normales - 400 reasoning + 600 contenido
  LONG: 1200,    // Respuestas largas (crisis) - 500 reasoning + 700 contenido
  CONTEXT_ANALYSIS: 1000,  // Para análisis de contexto interno
  // Límite máximo de seguridad (reducido para mejorar velocidad)
  MAX_SAFETY_LIMIT: 1200  // Límite máximo de seguridad (reducido de 4000 para mejorar velocidad)
};

// ========== TEMPERATURAS PARA DIFERENTES CONTEXTOS ==========
// Controla la creatividad/aleatoriedad de las respuestas (0.0 = determinista, 1.0 = muy creativo)
export const TEMPERATURES = {
  PRECISE: 0.1,      // Para análisis de contexto (muy determinista)
  URGENT: 0.3,       // Para situaciones urgentes (preciso pero con algo de variación)
  BALANCED: 0.5,     // Valor por defecto (equilibrio entre precisión y naturalidad)
  EMPATHETIC: 0.7,   // Para apoyo emocional (más natural y variado)
  CREATIVE: 0.8      // Para respuestas variadas (máxima creatividad)
};

// ========== PENALTIES PARA EVITAR REPETICIONES ==========
// Controla la penalización por repetición de tokens (0.0 = sin penalización, 2.0 = máxima penalización)
export const PENALTIES = {
  DEFAULT: 0.6,      // Penalización estándar para evitar repeticiones
  HIGH_VARIETY: 0.8  // Mayor penalización para respuestas más variadas
};

// ========== VALORES POR DEFECTO ==========
// Valores utilizados cuando no se puede determinar el valor real
export const DEFAULT_VALUES = {
  EMOTION: 'neutral',              // Emoción por defecto
  INTENSITY: 5,                    // Intensidad emocional por defecto (escala 1-10)
  TOPIC: 'general',                // Tema de conversación por defecto
  COMMUNICATION_STYLE: 'neutral',  // Estilo comunicativo por defecto
  RESPONSE_LENGTH: 'MEDIUM',       // Longitud de respuesta por defecto
  PROGRESS: 'iniciando',           // Estado de progreso por defecto
  PHASE: 'inicial'                 // Fase terapéutica por defecto
};

// ========== LÍMITES DE HISTORIAL ==========
// Controla cuánto historial se incluye en el contexto
export const HISTORY_LIMITS = {
  MESSAGES_IN_PROMPT: 5,        // Número de mensajes del historial a incluir en el prompt de OpenAI (reducido para mejorar velocidad)
  RECENT_MESSAGES_COUNT: 5      // Número de mensajes recientes para análisis de contexto
};

// ========== LÍMITES DE VALIDACIÓN ==========
// Límites para validación de mensajes de entrada y salida
export const VALIDATION_LIMITS = {
  MAX_INPUT_CHARACTERS: 2000,       // Máximo de caracteres permitidos en mensaje de entrada
  MAX_SENTENCES_REDUCE: 2,          // Máximo de oraciones a mantener al reducir respuesta
  INTENSITY_MIN: 0,                 // Valor mínimo de intensidad emocional
  INTENSITY_MAX: 10                 // Valor máximo de intensidad emocional
};

// ========== UMBRALES DE ANÁLISIS ==========
// Valores límite para validación y análisis de respuestas
export const THRESHOLDS = {
  // Validación de longitud de respuesta
  MIN_WORDS_RESPONSE: 5,            // Mínimo de palabras en una respuesta válida
  MAX_WORDS_RESPONSE: 50,           // Máximo de palabras en una respuesta (1-2 oraciones para conversación natural)
  MAX_CHARACTERS_RESPONSE: 250,     // Máximo de caracteres en una respuesta
  
  // Análisis de historial
  MIN_HISTORY_LENGTH: 3,            // Mínimo de mensajes en historial para análisis
  THEMES_FOR_EXPLORATION: 2,        // Número de temas necesarios para exploración
  // NOTA: RECENT_MESSAGES_COUNT está en HISTORY_LIMITS para evitar duplicación
  
  // Análisis de estabilidad emocional
  EMOTIONAL_INSTABILITY_REFRAMING: 2,      // Umbral para reframing de inestabilidad
  EMOTIONAL_INSTABILITY_STABILIZATION: 3,  // Umbral para estabilización
  
  // Recursos y fases
  RESOURCE_MENTIONS_FOR_PHASE: 2,   // Menciones de recursos necesarias para avanzar fase
  
  // Intensidad emocional
  INTENSITY_HIGH: 7,                // Umbral de intensidad alta (requiere atención)
  INTENSITY_LOW: 3                  // Umbral de intensidad baja
};

// ========== PERÍODOS DEL DÍA ==========
// Horas del día para determinar el período actual (0-23)
export const TIME_PERIODS = {
  MORNING_START: 5,     // Inicio de la mañana
  MORNING_END: 12,      // Fin de la mañana
  AFTERNOON_START: 12,  // Inicio de la tarde
  AFTERNOON_END: 18,    // Fin de la tarde
  EVENING_START: 18,    // Inicio de la noche
  EVENING_END: 22,      // Fin de la noche
  NIGHT_START: 22,      // Inicio de la madrugada
  NIGHT_END: 5          // Fin de la madrugada (cruza medianoche)
};

// ========== FASES DE CONVERSACIÓN ==========
// Etapas del proceso terapéutico en la conversación
export const CONVERSATION_PHASES = {
  INITIAL: 'inicial',           // Fase inicial: establecimiento de rapport
  EXPLORATION: 'exploración',   // Exploración de temas y emociones
  INSIGHT: 'comprensión',       // Comprensión de patrones y causas
  TOOL_LEARNING: 'aprendizaje', // Aprendizaje de herramientas y estrategias
  PRACTICE: 'práctica',         // Práctica de habilidades
  FOLLOW_UP: 'seguimiento'      // Seguimiento y consolidación
};

// ========== ESTADOS DE PROGRESO ==========
// Estados del progreso del usuario en su proceso terapéutico
export const PROGRESS_STATES = {
  INITIATING: 'iniciando',                    // Iniciando el proceso
  EXPLORING: 'explorando',                    // Explorando temas y emociones
  IDENTIFYING_PATTERNS: 'identificando patrones',  // Identificando patrones
  APPLYING_TOOLS: 'aplicando herramientas',   // Aplicando herramientas aprendidas
  IN_PROGRESS: 'en_curso'                     // Proceso en curso
};

// ========== SALUDOS POR PERÍODO DEL DÍA ==========
// Variaciones de saludos personalizados según el momento del día
// Se seleccionan aleatoriamente para dar variedad a las conversaciones
export const GREETING_VARIATIONS = {
  morning: [
    "¡Buenos días! ¿Cómo puedo ayudarte hoy?",
    "¡Hola! ¿Cómo amaneciste hoy?",
    "Buenos días, ¿cómo te sientes hoy?"
  ],
  afternoon: [
    "¡Hola! ¿Cómo va tu día?",
    "¡Buenas tardes! ¿En qué puedo ayudarte?",
    "¡Hola! ¿Cómo te sientes en este momento?"
  ],
  evening: [
    "¡Buenas tardes! ¿Cómo ha ido tu día?",
    "¡Hola! ¿Cómo te encuentras esta tarde?",
    "¡Hola! ¿Qué tal va todo?"
  ],
  night: [
    "¡Buenas noches! ¿Cómo te sientes?",
    "¡Hola! ¿Cómo ha ido tu día?",
    "¡Buenas noches! ¿En qué puedo ayudarte?"
  ]
};

// ========== PATRONES DE RESPUESTAS GENÉRICAS ==========
// Patrones regex para detectar respuestas demasiado genéricas que necesitan expansión
export const GENERIC_RESPONSE_PATTERNS = [
  /^(Entiendo|Comprendo) (como|cómo) te sientes\.?$/i,
  /^(Me gustaría|Quisiera) (saber|entender) más/i,
  /^¿Podrías contarme más\??$/i,
  /^(Entiendo|Comprendo)\.?$/i,
  /^Ok(ay)?\.?$/i
];

// ========== PATRONES DE COHERENCIA EMOCIONAL ==========
// Patrones regex para validar que la respuesta es coherente con la emoción detectada
export const EMOTIONAL_COHERENCE_PATTERNS = {
  tristeza: /(acompaño|entiendo tu tristeza|momento difícil|comprendo tu dolor)/i,
  ansiedad: /(respira|un paso a la vez|manejar esta ansiedad|calma|tranquilo)/i,
  enojo: /(frustración|válido sentirse así|entiendo tu molestia|comprendo tu enojo)/i,
  alegria: /(me alegro|comparto tu alegría|genial|feliz por ti)/i,
  miedo: /(entiendo tu miedo|es normal tener miedo|acompaño en este miedo)/i,
  verguenza: /(entiendo tu vergüenza|es normal sentirse así|no estás solo)/i,
  culpa: /(entiendo tu culpa|es normal sentirse culpable|hablémoslo)/i,
  esperanza: /(me alegra tu esperanza|es bueno tener esperanza|sigue adelante)/i,
  neutral: /(entiendo|te escucho|cuéntame más)/i
};

// ========== FRASES DE COHERENCIA EMOCIONAL ==========
// Frases clave para asegurar coherencia emocional en las respuestas
// Se usan cuando la respuesta no muestra reconocimiento de la emoción detectada
export const EMOTIONAL_COHERENCE_PHRASES = {
  tristeza: [
    'comprendo tu tristeza',
    'entiendo que te sientas así',
    'es normal sentirse triste',
    'acompaño en este momento difícil'
  ],
  ansiedad: [
    'entiendo tu preocupación',
    'es normal sentirse ansioso',
    'respiremos juntos',
    'vamos paso a paso'
  ],
  enojo: [
    'entiendo tu frustración',
    'es válido sentirse enojado',
    'hablemos de lo que te molesta',
    'comprendo tu enojo'
  ],
  alegria: [
    'me alegro por ti',
    'es genial escuchar eso',
    'comparto tu alegría',
    'qué bueno que te sientas así'
  ],
  miedo: [
    'entiendo tu miedo',
    'es normal tener miedo',
    'acompaño en este miedo',
    'hablemos de lo que te asusta'
  ],
  verguenza: [
    'entiendo tu vergüenza',
    'es normal sentirse así',
    'no estás solo en esto',
    'hablémoslo sin juicios'
  ],
  culpa: [
    'entiendo tu culpa',
    'es normal sentirse culpable',
    'hablémoslo',
    'comprendo cómo te sientes'
  ],
  esperanza: [
    'me alegra tu esperanza',
    'es bueno tener esperanza',
    'sigue adelante',
    'comparto tu optimismo'
  ],
  neutral: [
    'entiendo',
    'te escucho',
    'cuéntame más',
    'estoy aquí para ti'
  ]
};

// ========== MENSAJES DE ERROR ==========
// Mensajes de error amigables para el usuario
export const ERROR_MESSAGES = {
  DEFAULT: "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo o contacta a soporte si el problema persiste.",
  AUTH: "Error de configuración del servicio. Por favor, contacta a soporte.",
  RATE_LIMIT: "El servicio está temporalmente ocupado. Por favor, intenta de nuevo en unos momentos.",
  SERVER_ERROR: "El servicio está experimentando problemas técnicos. Por favor, intenta de nuevo más tarde.",
  INVALID_MESSAGE: "Lo siento, hubo un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?",
  DEFAULT_FALLBACK: "Entiendo. ¿Podrías contarme más sobre eso?",
  API_KEY_MISSING: "Error de configuración: La clave de API de OpenAI no está configurada. Por favor, contacta a soporte.",
  API_KEY_INVALID: "Error de autenticación con OpenAI. Por favor, contacta a soporte."
};

// ========== INTENCIONES DE MENSAJE ==========
// Tipos de intención detectados en los mensajes del usuario
export const MESSAGE_INTENTS = {
  EMOTIONAL_SUPPORT: 'EMOTIONAL_SUPPORT',  // Busca apoyo emocional
  SEEKING_HELP: 'SEEKING_HELP',            // Busca ayuda o consejo
  CRISIS: 'CRISIS',                        // Situación de crisis (requiere atención inmediata)
  GREETING: 'GREETING',                    // Saludo o inicio de conversación
  ERROR: 'ERROR'                           // Error en el procesamiento
};

// ========== DIMENSIONES DE ANÁLISIS TERAPÉUTICO ==========
// Dimensiones utilizadas para el análisis terapéutico de las conversaciones
export const ANALYSIS_DIMENSIONS = {
  EMOTIONAL: ['reconocimiento', 'regulación', 'expresión'],
  COGNITIVE: ['pensamientos', 'creencias', 'sesgos'],
  BEHAVIORAL: ['patrones', 'estrategias', 'cambios'],
  RELATIONAL: ['vínculos', 'comunicación', 'límites']
};

// ========== CONFIGURACIÓN DE PROMPT ==========
// Configuración específica para la construcción de prompts del sistema
export const PROMPT_CONFIG = {
  MAX_WORDS_MENTION: 50,            // Número de palabras mencionado en el prompt (debe coincidir con THRESHOLDS.MAX_WORDS_RESPONSE)
  MAX_SENTENCES_MENTION: 2,         // Número de oraciones mencionado en el prompt
  TRUNCATE_ELLIPSIS: '...',         // Texto usado al truncar respuestas
  TRUNCATE_BUFFER: 3                // Caracteres de buffer al truncar (para elipsis)
};

// ========== CONSTANTES DE CONVERSIÓN ==========
// Factores de conversión entre diferentes unidades de medida
export const CONVERSION_FACTORS = {
  AVERAGE_CHARS_PER_WORD: 5,        // Promedio de caracteres por palabra (incluyendo espacio)
  AVERAGE_WORDS_PER_SENTENCE: 15,   // Promedio de palabras por oración
  TOKENS_PER_WORD: 1.3,             // Aproximación: 1 palabra ≈ 1.3 tokens
  WORDS_PER_TOKEN: 0.77             // Inverso: 1 token ≈ 0.77 palabras
};

// ========== CONSTANTES DE TIEMPO ==========
// Timeouts y delays para operaciones asíncronas
export const TIMEOUTS = {
  API_REQUEST: 30000,               // Timeout para requests a OpenAI (30 segundos)
  API_RETRY_DELAY: 1000,            // Delay entre reintentos (1 segundo)
  MAX_RETRIES: 3                    // Número máximo de reintentos
};

// ========== VALIDACIÓN Y COHERENCIA ==========
/**
 * Valida que las constantes sean coherentes entre sí
 * @throws {Error} Si se detectan inconsistencias
 */
export const validateConstants = () => {
  const errors = [];

  // Validar que MAX_WORDS_MENTION coincida con MAX_WORDS_RESPONSE
  if (PROMPT_CONFIG.MAX_WORDS_MENTION !== THRESHOLDS.MAX_WORDS_RESPONSE) {
    errors.push(
      `PROMPT_CONFIG.MAX_WORDS_MENTION (${PROMPT_CONFIG.MAX_WORDS_MENTION}) ` +
      `debe coincidir con THRESHOLDS.MAX_WORDS_RESPONSE (${THRESHOLDS.MAX_WORDS_RESPONSE})`
    );
  }

  // Validar rangos de intensidad
  if (THRESHOLDS.INTENSITY_HIGH < VALIDATION_LIMITS.INTENSITY_MIN || 
      THRESHOLDS.INTENSITY_HIGH > VALIDATION_LIMITS.INTENSITY_MAX) {
    errors.push(
      `THRESHOLDS.INTENSITY_HIGH (${THRESHOLDS.INTENSITY_HIGH}) ` +
      `debe estar entre ${VALIDATION_LIMITS.INTENSITY_MIN} y ${VALIDATION_LIMITS.INTENSITY_MAX}`
    );
  }

  if (THRESHOLDS.INTENSITY_LOW < VALIDATION_LIMITS.INTENSITY_MIN || 
      THRESHOLDS.INTENSITY_LOW > VALIDATION_LIMITS.INTENSITY_MAX) {
    errors.push(
      `THRESHOLDS.INTENSITY_LOW (${THRESHOLDS.INTENSITY_LOW}) ` +
      `debe estar entre ${VALIDATION_LIMITS.INTENSITY_MIN} y ${VALIDATION_LIMITS.INTENSITY_MAX}`
    );
  }

  if (THRESHOLDS.INTENSITY_LOW >= THRESHOLDS.INTENSITY_HIGH) {
    errors.push(
      `THRESHOLDS.INTENSITY_LOW (${THRESHOLDS.INTENSITY_LOW}) ` +
      `debe ser menor que THRESHOLDS.INTENSITY_HIGH (${THRESHOLDS.INTENSITY_HIGH})`
    );
  }

  // Validar que DEFAULT_VALUES.INTENSITY esté en rango válido
  if (DEFAULT_VALUES.INTENSITY < VALIDATION_LIMITS.INTENSITY_MIN || 
      DEFAULT_VALUES.INTENSITY > VALIDATION_LIMITS.INTENSITY_MAX) {
    errors.push(
      `DEFAULT_VALUES.INTENSITY (${DEFAULT_VALUES.INTENSITY}) ` +
      `debe estar entre ${VALIDATION_LIMITS.INTENSITY_MIN} y ${VALIDATION_LIMITS.INTENSITY_MAX}`
    );
  }

  // Validar que MIN_WORDS < MAX_WORDS
  if (THRESHOLDS.MIN_WORDS_RESPONSE >= THRESHOLDS.MAX_WORDS_RESPONSE) {
    errors.push(
      `THRESHOLDS.MIN_WORDS_RESPONSE (${THRESHOLDS.MIN_WORDS_RESPONSE}) ` +
      `debe ser menor que THRESHOLDS.MAX_WORDS_RESPONSE (${THRESHOLDS.MAX_WORDS_RESPONSE})`
    );
  }

  // Validar temperaturas (deben estar entre 0 y 1)
  Object.entries(TEMPERATURES).forEach(([key, value]) => {
    if (value < 0 || value > 1) {
      errors.push(`TEMPERATURES.${key} (${value}) debe estar entre 0 y 1`);
    }
  });

  // Validar penalties (deben estar entre 0 y 2)
  Object.entries(PENALTIES).forEach(([key, value]) => {
    if (value < 0 || value > 2) {
      errors.push(`PENALTIES.${key} (${value}) debe estar entre 0 y 2`);
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `Errores de validación en constantes de OpenAI:\n${errors.join('\n')}`
    );
  }
};

// ========== FUNCIONES HELPER ==========
/**
 * Valida y normaliza un valor de intensidad emocional
 * @param {number} intensity - Valor de intensidad a validar
 * @returns {number} Intensidad normalizada (entre INTENSITY_MIN e INTENSITY_MAX)
 */
export const clampIntensity = (intensity) => {
  return Math.max(
    VALIDATION_LIMITS.INTENSITY_MIN,
    Math.min(VALIDATION_LIMITS.INTENSITY_MAX, intensity)
  );
};

/**
 * Obtiene un saludo aleatorio para un período del día
 * @param {string} period - Período del día ('morning', 'afternoon', 'evening', 'night')
 * @returns {string} Saludo aleatorio
 */
export const getRandomGreeting = (period) => {
  const greetings = GREETING_VARIATIONS[period] || GREETING_VARIATIONS.morning;
  return greetings[Math.floor(Math.random() * greetings.length)];
};

/**
 * Convierte palabras a caracteres aproximados
 * @param {number} words - Número de palabras
 * @returns {number} Número aproximado de caracteres
 */
export const wordsToChars = (words) => {
  return Math.ceil(words * CONVERSION_FACTORS.AVERAGE_CHARS_PER_WORD);
};

/**
 * Convierte caracteres a palabras aproximadas
 * @param {number} chars - Número de caracteres
 * @returns {number} Número aproximado de palabras
 */
export const charsToWords = (chars) => {
  return Math.ceil(chars / CONVERSION_FACTORS.AVERAGE_CHARS_PER_WORD);
};

/**
 * Convierte tokens a palabras aproximadas
 * @param {number} tokens - Número de tokens
 * @returns {number} Número aproximado de palabras
 */
export const tokensToWords = (tokens) => {
  return Math.ceil(tokens * CONVERSION_FACTORS.WORDS_PER_TOKEN);
};

/**
 * Convierte palabras a tokens aproximados
 * @param {number} words - Número de palabras
 * @returns {number} Número aproximado de tokens
 */
export const wordsToTokens = (words) => {
  return Math.ceil(words * CONVERSION_FACTORS.TOKENS_PER_WORD);
};

/**
 * Determina si una intensidad es alta
 * @param {number} intensity - Valor de intensidad
 * @returns {boolean} true si la intensidad es alta
 */
export const isHighIntensity = (intensity) => {
  return intensity >= THRESHOLDS.INTENSITY_HIGH;
};

/**
 * Determina si una intensidad es baja
 * @param {number} intensity - Valor de intensidad
 * @returns {boolean} true si la intensidad es baja
 */
export const isLowIntensity = (intensity) => {
  return intensity <= THRESHOLDS.INTENSITY_LOW;
};

/**
 * Determina si una intensidad requiere atención
 * @param {number} intensity - Valor de intensidad
 * @param {string} emotionCategory - Categoría de emoción ('negative', 'positive', 'neutral')
 * @returns {boolean} true si requiere atención
 */
export const requiresAttention = (intensity, emotionCategory = 'neutral') => {
  return emotionCategory === 'negative' && isHighIntensity(intensity);
};

// ========== INSTRUCCIONES POR EMOCIÓN ==========
// Directrices específicas para cada tipo de emoción detectada
export const EMOTION_SPECIFIC_GUIDELINES = {
  tristeza: {
    approach: 'validación empática y acompañamiento',
    focus: 'reconocer el dolor sin minimizarlo, ofrecer apoyo sin presionar',
    avoid: 'frases como "anímate" o "no es para tanto", soluciones inmediatas',
    techniques: ['validación emocional', 'normalización', 'presencia empática'],
    tone: 'cálido, comprensivo, sin apuro'
  },
  ansiedad: {
    approach: 'calma y técnicas de regulación',
    focus: 'ayudar a identificar la ansiedad, técnicas de respiración, enfoque en el presente',
    avoid: 'minimizar la ansiedad, dar demasiadas instrucciones a la vez',
    techniques: ['respiración', 'grounding', 'validación de preocupaciones'],
    tone: 'tranquilo, calmante, estructurado'
  },
  enojo: {
    approach: 'validación y exploración de la causa',
    focus: 'reconocer la frustración como válida, explorar qué lo causó, canalizar constructivamente',
    avoid: 'juzgar el enojo, pedir que se calme inmediatamente',
    techniques: ['validación de la emoción', 'exploración de triggers', 'expresión saludable'],
    tone: 'respetuoso, validante, sin confrontación'
  },
  alegria: {
    approach: 'celebración y refuerzo positivo',
    focus: 'compartir la alegría, reconocer logros, reforzar momentos positivos',
    avoid: 'quitar importancia a la alegría, cambiar de tema abruptamente',
    techniques: ['celebración', 'refuerzo positivo', 'savoring'],
    tone: 'entusiasta, celebratorio, genuino',
    warning: 'IMPORTANTE: Solo usa este enfoque si la emoción detectada es REALMENTE alegría. Si el usuario dice "no me siento bien" o expresiones similares, NO es alegría, es tristeza o ansiedad.'
  },
  miedo: {
    approach: 'seguridad y exploración gradual',
    focus: 'validar el miedo, crear sensación de seguridad, explorar gradualmente',
    avoid: 'forzar a enfrentar el miedo, minimizar la amenaza percibida',
    techniques: ['validación', 'seguridad', 'exposición gradual'],
    tone: 'protector, comprensivo, paciente'
  },
  verguenza: {
    approach: 'compasión y normalización',
    focus: 'reducir la vergüenza, normalizar experiencias, crear espacio seguro',
    avoid: 'juzgar, presionar para compartir más de lo cómodo',
    techniques: ['compasión', 'normalización', 'aceptación incondicional'],
    tone: 'compasivo, sin juicios, acogedor'
  },
  culpa: {
    approach: 'exploración y diferenciación',
    focus: 'diferenciar culpa saludable de tóxica, explorar responsabilidad real',
    avoid: 'minimizar la culpa sin explorar, culpar más',
    techniques: ['exploración de responsabilidad', 'diferenciación', 'perdón'],
    tone: 'exploratorio, equilibrado, no punitivo'
  },
  esperanza: {
    approach: 'refuerzo y construcción',
    focus: 'validar la esperanza, construir sobre ella, planificar pasos',
    avoid: 'quitar esperanza, ser demasiado cauteloso',
    techniques: ['refuerzo positivo', 'planificación', 'visualización'],
    tone: 'optimista, constructivo, alentador'
  },
  neutral: {
    approach: 'exploración y apertura',
    focus: 'estar presente, explorar lo que el usuario necesita, mantener apertura',
    avoid: 'asumir qué necesita, presionar para emociones específicas',
    techniques: ['presencia', 'exploración', 'apertura'],
    tone: 'neutral, abierto, receptivo'
  }
};

// ========== INSTRUCCIONES POR FASE TERAPÉUTICA ==========
// Directrices específicas para cada fase del proceso terapéutico
export const PHASE_SPECIFIC_GUIDELINES = {
  inicial: {
    focus: 'establecer rapport, crear confianza, explorar necesidades',
    techniques: ['escucha activa', 'validación', 'exploración abierta'],
    depth: 'superficial a moderada',
    structure: 'flexible, adaptativa',
    goals: 'conocer al usuario, crear vínculo, identificar necesidades'
  },
  exploración: {
    focus: 'profundizar en temas, identificar patrones, validar experiencias',
    techniques: ['preguntas abiertas', 'reflexión', 'identificación de patrones'],
    depth: 'moderada a profunda',
    structure: 'más estructurada, con objetivos claros',
    goals: 'entender mejor, identificar patrones, validar experiencias'
  },
  comprensión: {
    focus: 'ayudar a comprender causas, conexiones, significados',
    techniques: ['insight', 'conexiones', 'comprensión profunda'],
    depth: 'profunda',
    structure: 'estructurada, con insights',
    goals: 'generar comprensión, conectar experiencias, encontrar significado'
  },
  aprendizaje: {
    focus: 'enseñar herramientas, estrategias, habilidades de afrontamiento',
    techniques: ['psicoeducación', 'enseñanza de habilidades', 'práctica guiada'],
    depth: 'moderada, práctica',
    structure: 'muy estructurada, educativa',
    goals: 'enseñar herramientas, desarrollar habilidades, practicar'
  },
  práctica: {
    focus: 'apoyar la práctica, reforzar logros, ajustar estrategias',
    techniques: ['refuerzo', 'ajuste', 'celebración de logros'],
    depth: 'moderada, aplicada',
    structure: 'estructurada, con seguimiento',
    goals: 'practicar habilidades, consolidar cambios, ajustar estrategias'
  },
  seguimiento: {
    focus: 'mantener cambios, prevenir recaídas, consolidar progreso',
    techniques: ['seguimiento', 'prevención de recaídas', 'consolidación'],
    depth: 'moderada, de mantenimiento',
    structure: 'estructurada, de seguimiento',
    goals: 'mantener cambios, prevenir recaídas, consolidar progreso'
  }
};

// ========== INSTRUCCIONES POR INTENSIDAD ==========
// Directrices según el nivel de intensidad emocional
export const INTENSITY_SPECIFIC_GUIDELINES = {
  baja: {
    approach: 'exploración y profundización',
    focus: 'explorar más a fondo, invitar a compartir, profundizar',
    urgency: 'baja',
    length: '1-2 oraciones, breve pero exploratoria',
    techniques: ['preguntas exploratorias', 'invitación a profundizar']
  },
  moderada: {
    approach: 'equilibrio entre validación y exploración',
    focus: 'validar y explorar, mantener equilibrio',
    urgency: 'moderada',
    length: '1-2 oraciones, balanceada',
    techniques: ['validación', 'exploración moderada']
  },
  alta: {
    approach: 'estabilización y contención',
    focus: 'priorizar estabilización, validación intensa, técnicas de regulación',
    urgency: 'alta',
    length: '1 oración, muy directa, enfocada en estabilización',
    techniques: ['contención', 'regulación emocional', 'grounding'],
    warning: 'Si es emoción negativa con intensidad alta, requiere atención especial'
  }
};

// ========== INSTRUCCIONES POR INTENCIÓN ==========
// Directrices según la intención detectada en el mensaje
export const INTENT_SPECIFIC_GUIDELINES = {
  EMOTIONAL_SUPPORT: {
    priority: 'máxima',
    focus: 'validación emocional, acompañamiento, presencia empática',
    responseStyle: 'empático, validante, presente',
    techniques: ['validación', 'presencia', 'acompañamiento'],
    length: 'media a larga según necesidad'
  },
  SEEKING_HELP: {
    priority: 'alta',
    focus: 'proporcionar ayuda práctica, orientación, recursos',
    responseStyle: 'práctico, orientativo, útil',
    techniques: ['orientación', 'recursos', 'sugerencias prácticas'],
    length: 'media, con información útil'
  },
  CRISIS: {
    priority: 'crítica',
    focus: 'estabilización inmediata, seguridad, recursos de emergencia',
    responseStyle: 'directo, calmante, estabilizador',
    techniques: ['estabilización', 'seguridad', 'recursos de emergencia'],
    length: 'corta, directa, enfocada',
    warning: 'SIEMPRE incluir recursos de emergencia si es necesario'
  },
  GREETING: {
    priority: 'baja',
    focus: 'saludo cálido, apertura, invitación a compartir',
    responseStyle: 'cálido, acogedor, breve',
    techniques: ['saludo', 'apertura', 'invitación'],
    length: 'corta, amigable'
  },
  ERROR: {
    priority: 'media',
    focus: 'manejar el error con empatía, ofrecer reintentar',
    responseStyle: 'empático, claro, útil',
    techniques: ['validación del error', 'ofrecimiento de ayuda'],
    length: 'corta, clara'
  }
};

// ========== INSTRUCCIONES POR ESTILO COMUNICATIVO ==========
// Directrices según las preferencias de comunicación del usuario
export const COMMUNICATION_STYLE_GUIDELINES = {
  empatico: {
    tone: 'cálido, comprensivo, validante',
    structure: 'flexible, adaptativa',
    validation: 'alta',
    reflection: 'alta',
    directness: 'moderada',
    examples: 'Usa frases como "Entiendo cómo te sientes", "Es normal sentir eso"'
  },
  directo: {
    tone: 'claro, conciso, directo',
    structure: 'estructurada, organizada',
    validation: 'moderada',
    reflection: 'baja',
    directness: 'alta',
    examples: 'Ve directo al punto, evita rodeos, sé claro y específico'
  },
  exploratorio: {
    tone: 'curioso, abierto, no directivo',
    structure: 'flexible, abierta',
    validation: 'alta',
    reflection: 'muy alta',
    directness: 'baja',
    examples: 'Haz preguntas abiertas, invita a explorar, no dirijas demasiado'
  },
  estructurado: {
    tone: 'organizado, sistemático, claro',
    structure: 'muy estructurada, con pasos',
    validation: 'moderada',
    reflection: 'moderada',
    directness: 'alta',
    examples: 'Organiza la respuesta en pasos, usa estructura clara, sé sistemático'
  },
  neutral: {
    tone: 'equilibrado, profesional, adaptativo',
    structure: 'flexible, adaptativa',
    validation: 'moderada',
    reflection: 'moderada',
    directness: 'moderada',
    examples: 'Mantén equilibrio, adapta según el contexto, sé profesional'
  }
};

// ========== PLANTILLAS DE PROMPT ==========
// Plantillas base para construir prompts personalizados
export const PROMPT_TEMPLATES = {
  // Plantilla base del sistema (optimizada para GPT-5 Mini - muy simplificada)
  SYSTEM_BASE: `Eres Anto, asistente terapéutico. Responde breve (1-2 oraciones), empático y natural.`,

  // Sección de contexto (optimizada)
  CONTEXT_SECTION: `CONTEXTO: {timeOfDay} | Emoción: {emotion} (intensidad {intensity}) | Intención: {intent} | Estilo: {communicationStyle}`,

  // Sección de directrices emocionales (optimizada)
  EMOTION_GUIDELINES: `{emotion}: {approach}. Prioridad: {focus}. Tono: {tone}. Evitar: {avoid}.`,

  // Sección de directrices por fase (optimizada)
  PHASE_GUIDELINES: `Fase {phase}: {focus}. Profundidad: {depth}.`,

  // Sección de directrices por intensidad (optimizada)
  INTENSITY_GUIDELINES: `Intensidad {intensityLevel}: {approach}. Urgencia: {urgency}.`,

  // Sección de directrices por intención (optimizada)
  INTENT_GUIDELINES: `Intención {intent}: {priority}. Enfoque: {focus}.`,

  // Sección de estilo comunicativo (optimizada)
  STYLE_GUIDELINES: `Estilo {style}: {tone}. {validation}`,

  // Reglas generales (optimizadas para GPT-5 Mini - simplificadas para reducir reasoning)
  GENERAL_RULES: `Responde breve (1-2 oraciones, máx {maxWords} palabras). Natural y empático. Si emoción NEGATIVA, usa "lamento escuchar eso", "entiendo", NUNCA "es genial".`,

  // Estructura de respuesta (optimizada - simplificada)
  RESPONSE_STRUCTURE: `Responde: 1) Reconocimiento empático (15 palabras). 2) Validación/apoyo (15 palabras, opcional). 3) Pregunta (10 palabras, opcional). Total: 1-2 oraciones.`
};

// ========== FUNCIONES HELPER PARA PROMPTS ==========
/**
 * Obtiene las directrices específicas para una emoción
 * @param {string} emotion - Nombre de la emoción
 * @returns {Object} Directrices para la emoción o para 'neutral' si no se encuentra
 */
export const getEmotionGuidelines = (emotion) => {
  return EMOTION_SPECIFIC_GUIDELINES[emotion] || EMOTION_SPECIFIC_GUIDELINES.neutral;
};

/**
 * Obtiene las directrices específicas para una fase terapéutica
 * @param {string} phase - Nombre de la fase
 * @returns {Object} Directrices para la fase o para 'inicial' si no se encuentra
 */
export const getPhaseGuidelines = (phase) => {
  return PHASE_SPECIFIC_GUIDELINES[phase] || PHASE_SPECIFIC_GUIDELINES.inicial;
};

/**
 * Obtiene las directrices específicas para un nivel de intensidad
 * @param {number} intensity - Valor de intensidad (0-10)
 * @returns {Object} Directrices para la intensidad
 */
export const getIntensityGuidelines = (intensity) => {
  if (intensity <= THRESHOLDS.INTENSITY_LOW) {
    return INTENSITY_SPECIFIC_GUIDELINES.baja;
  } else if (intensity >= THRESHOLDS.INTENSITY_HIGH) {
    return INTENSITY_SPECIFIC_GUIDELINES.alta;
  }
  return INTENSITY_SPECIFIC_GUIDELINES.moderada;
};

/**
 * Obtiene las directrices específicas para una intención
 * @param {string} intent - Tipo de intención
 * @returns {Object} Directrices para la intención o para 'EMOTIONAL_SUPPORT' si no se encuentra
 */
export const getIntentGuidelines = (intent) => {
  return INTENT_SPECIFIC_GUIDELINES[intent] || INTENT_SPECIFIC_GUIDELINES.EMOTIONAL_SUPPORT;
};

/**
 * Obtiene las directrices específicas para un estilo comunicativo
 * @param {string} style - Estilo comunicativo
 * @returns {Object} Directrices para el estilo o para 'neutral' si no se encuentra
 */
export const getCommunicationStyleGuidelines = (style) => {
  return COMMUNICATION_STYLE_GUIDELINES[style] || COMMUNICATION_STYLE_GUIDELINES.neutral;
};

/**
 * Construye un prompt personalizado completo usando todas las directrices
 * @param {Object} context - Contexto completo del usuario
 * @param {Object} options - Opciones adicionales
 * @returns {string} Prompt personalizado completo
 */
export const buildPersonalizedPrompt = (context, options = {}) => {
  const {
    emotion = DEFAULT_VALUES.EMOTION,
    intensity = DEFAULT_VALUES.INTENSITY,
    phase = DEFAULT_VALUES.PHASE,
    intent = MESSAGE_INTENTS.EMOTIONAL_SUPPORT,
    communicationStyle = DEFAULT_VALUES.COMMUNICATION_STYLE,
    timeOfDay = 'afternoon',
    recurringThemes = [],
    lastInteraction = 'ninguna',
    // NUEVOS PARÁMETROS
    subtype = null,
    topic = 'general',
    sessionTrends = null,
    responseStyle = 'balanced'
  } = context;

  // Obtener directrices específicas
  const emotionGuidelines = getEmotionGuidelines(emotion);
  const phaseGuidelines = getPhaseGuidelines(phase);
  const intensityGuidelines = getIntensityGuidelines(intensity);
  const intentGuidelines = getIntentGuidelines(intent);
  const styleGuidelines = getCommunicationStyleGuidelines(communicationStyle);

  // Determinar nivel de intensidad como string
  const intensityLevel = intensity <= THRESHOLDS.INTENSITY_LOW ? 'baja' :
                         intensity >= THRESHOLDS.INTENSITY_HIGH ? 'alta' : 'moderada';

  // Construir el prompt
  let prompt = PROMPT_TEMPLATES.SYSTEM_BASE + '\n\n';

  // Sección de contexto (optimizada)
  prompt += PROMPT_TEMPLATES.CONTEXT_SECTION
    .replace('{timeOfDay}', timeOfDay)
    .replace('{emotion}', emotion)
    .replace('{intensity}', intensity)
    .replace('{intent}', intent)
    .replace('{communicationStyle}', communicationStyle) + '\n\n';

  // Directrices por emoción
  let emotionGuidelinesText = PROMPT_TEMPLATES.EMOTION_GUIDELINES
    .replace('{emotion}', emotion)
    .replace('{approach}', emotionGuidelines.approach)
    .replace('{focus}', emotionGuidelines.focus)
    .replace('{avoid}', emotionGuidelines.avoid)
    .replace('{techniques}', emotionGuidelines.techniques.join(', '))
    .replace('{tone}', emotionGuidelines.tone);
  
  // Agregar advertencia si existe
  if (emotionGuidelines.warning) {
    emotionGuidelinesText += `\n⚠️ ${emotionGuidelines.warning}`;
  }
  
  prompt += emotionGuidelinesText + '\n\n';

  // Directrices por fase (optimizada)
  prompt += PROMPT_TEMPLATES.PHASE_GUIDELINES
    .replace('{phase}', phase)
    .replace('{focus}', phaseGuidelines.focus)
    .replace('{depth}', phaseGuidelines.depth) + '\n\n';

  // Directrices por intensidad (optimizada)
  prompt += PROMPT_TEMPLATES.INTENSITY_GUIDELINES
    .replace('{intensityLevel}', intensityLevel)
    .replace('{approach}', intensityGuidelines.approach)
    .replace('{urgency}', intensityGuidelines.urgency) + '\n\n';

  // Directrices por intención (optimizada)
  prompt += PROMPT_TEMPLATES.INTENT_GUIDELINES
    .replace('{intent}', intent)
    .replace('{priority}', intentGuidelines.priority)
    .replace('{focus}', intentGuidelines.focus) + '\n\n';

  // Directrices por estilo comunicativo (optimizada)
  prompt += PROMPT_TEMPLATES.STYLE_GUIDELINES
    .replace('{style}', communicationStyle)
    .replace('{tone}', styleGuidelines.tone)
    .replace('{validation}', styleGuidelines.validation) + '\n\n';

  // Información adicional (MUY simplificada para reducir reasoning y mejorar velocidad)
  // Solo agregar información crítica, omitir detalles menores
  if (subtype && intensity >= 7) {
    prompt += `Subtipo: ${subtype}. `;
  }
  
  // Solo agregar información crítica de resistencia/recaídas si es muy relevante
  if (context.resistance && intensity >= 7) {
    prompt += `Resistencia: ${context.resistance.type}. `;
  }
  
  if (context.relapseSigns && intensity >= 8) {
    prompt += `Recaída detectada. `;
  }
  
  // Omitir información menos crítica para reducir reasoning y mejorar velocidad
  // (tendencias, fortalezas, autoeficacia, apoyo social, tema, estilo solo si es crítico)
  
  if (subtype || context.resistance || context.relapseSigns) {
    prompt += `\n\n`;
  }

  // Reglas generales
  prompt += PROMPT_TEMPLATES.GENERAL_RULES
    .replace('{maxWords}', THRESHOLDS.MAX_WORDS_RESPONSE)
    .replace('{maxSentences}', PROMPT_CONFIG.MAX_SENTENCES_MENTION) + '\n\n';

  // Estructura de respuesta
  prompt += PROMPT_TEMPLATES.RESPONSE_STRUCTURE;

  return prompt;
};

// Validar constantes al cargar el módulo (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  try {
    validateConstants();
  } catch (error) {
    console.warn('⚠️ Advertencia de validación de constantes:', error.message);
  }
}

