/**
 * Constantes de OpenAI Service
 */

// Modelo de OpenAI
export const OPENAI_MODEL = 'gpt-4-turbo-preview';

// Longitudes de respuesta (tokens)
export const RESPONSE_LENGTHS = {
  SHORT: 80,     // Respuestas cortas (saludos, confirmaciones)
  MEDIUM: 120,   // Respuestas normales (la mayoría de casos) - 2-3 oraciones
  LONG: 180,     // Respuestas largas (solo para situaciones urgentes/crisis) - máximo 4-5 oraciones
  CONTEXT_ANALYSIS: 100
};

// Temperaturas para diferentes contextos
export const TEMPERATURES = {
  PRECISE: 0.1,      // Para análisis de contexto
  URGENT: 0.3,       // Para situaciones urgentes
  BALANCED: 0.5,     // Valor por defecto
  EMPATHETIC: 0.7,   // Para apoyo emocional
  CREATIVE: 0.8      // Para respuestas variadas
};

// Penalties para evitar repeticiones
export const PENALTIES = {
  DEFAULT: 0.6,
  HIGH_VARIETY: 0.8
};

// Valores por defecto
export const DEFAULT_VALUES = {
  EMOTION: 'neutral',
  INTENSITY: 5,
  TOPIC: 'general',
  COMMUNICATION_STYLE: 'neutral',
  RESPONSE_LENGTH: 'MEDIUM',
  PROGRESS: 'iniciando',
  PHASE: 'inicial'
};

// Límites de historial
export const HISTORY_LIMITS = {
  MESSAGES_IN_PROMPT: 8,        // Número de mensajes del historial a incluir en el prompt de OpenAI
  RECENT_MESSAGES_COUNT: 5      // Número de mensajes recientes para análisis
};

// Umbrales de análisis
export const THRESHOLDS = {
  MIN_WORDS_RESPONSE: 10,
  MAX_WORDS_RESPONSE: 100,      // Máximo de palabras en una respuesta (2-3 oraciones)
  MAX_CHARACTERS_RESPONSE: 500, // Máximo de caracteres en una respuesta
  MIN_HISTORY_LENGTH: 3,
  RECENT_MESSAGES_COUNT: 5,
  THEMES_FOR_EXPLORATION: 2,
  EMOTIONAL_INSTABILITY_REFRAMING: 2,
  EMOTIONAL_INSTABILITY_STABILIZATION: 3,
  RESOURCE_MENTIONS_FOR_PHASE: 2,
  INTENSITY_HIGH: 7,
  INTENSITY_LOW: 3
};

// Horas del día para determinar período
export const TIME_PERIODS = {
  MORNING_START: 5,
  MORNING_END: 12,
  AFTERNOON_START: 12,
  AFTERNOON_END: 18,
  EVENING_START: 18,
  EVENING_END: 22,
  NIGHT_START: 22,
  NIGHT_END: 5
};

// Fases de conversación
export const CONVERSATION_PHASES = {
  INITIAL: 'inicial',
  EXPLORATION: 'exploración',
  INSIGHT: 'comprensión',
  TOOL_LEARNING: 'aprendizaje',
  PRACTICE: 'práctica',
  FOLLOW_UP: 'seguimiento'
};

// Estados de progreso
export const PROGRESS_STATES = {
  INITIATING: 'iniciando',
  EXPLORING: 'explorando',
  IDENTIFYING_PATTERNS: 'identificando patrones',
  APPLYING_TOOLS: 'aplicando herramientas',
  IN_PROGRESS: 'en_curso'
};

// Saludos por período del día
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

// Patrones de respuestas genéricas
export const GENERIC_RESPONSE_PATTERNS = [
  /^(Entiendo|Comprendo) (como|cómo) te sientes\.?$/i,
  /^(Me gustaría|Quisiera) (saber|entender) más/i,
  /^¿Podrías contarme más\??$/i
];

// Patrones de coherencia emocional
export const EMOTIONAL_COHERENCE_PATTERNS = {
  tristeza: /(acompaño|entiendo tu tristeza|momento difícil)/i,
  ansiedad: /(respira|un paso a la vez|manejar esta ansiedad)/i,
  enojo: /(frustración|válido sentirse así|entiendo tu molestia)/i
};

// Frases de coherencia emocional
export const EMOTIONAL_COHERENCE_PHRASES = {
  tristeza: ['comprendo tu tristeza', 'entiendo que te sientas así', 'es normal sentirse triste'],
  ansiedad: ['entiendo tu preocupación', 'es normal sentirse ansioso', 'respiremos juntos'],
  enojo: ['entiendo tu frustración', 'es válido sentirse enojado', 'hablemos de lo que te molesta'],
  alegría: ['me alegro por ti', 'es genial escuchar eso', 'comparto tu alegría'],
  neutral: ['entiendo', 'te escucho', 'cuéntame más']
};

// Mensajes de error
export const ERROR_MESSAGES = {
  DEFAULT: "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo o contacta a soporte si el problema persiste.",
  AUTH: "Error de configuración del servicio. Por favor, contacta a soporte.",
  RATE_LIMIT: "El servicio está temporalmente ocupado. Por favor, intenta de nuevo en unos momentos.",
  SERVER_ERROR: "El servicio está experimentando problemas técnicos. Por favor, intenta de nuevo más tarde.",
  INVALID_MESSAGE: "Lo siento, hubo un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?",
  DEFAULT_FALLBACK: "Entiendo. ¿Podrías contarme más sobre eso?"
};

// Intenciones de mensaje
export const MESSAGE_INTENTS = {
  EMOTIONAL_SUPPORT: 'EMOTIONAL_SUPPORT',
  SEEKING_HELP: 'SEEKING_HELP',
  CRISIS: 'CRISIS',
  GREETING: 'GREETING',
  ERROR: 'ERROR'
};

