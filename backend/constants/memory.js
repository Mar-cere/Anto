/**
 * Constantes del Memory Service
 */

// Umbrales de intensidad emocional
export const INTENSITY = {
  DEFAULT: 5,
  HIGH_THRESHOLD: 7,
  LOW_THRESHOLD: 4,
  MIN: 1,
  MAX: 10
};

// Emoción por defecto
export const EMOTION_NEUTRAL = 'neutral';

// Límites de interacciones
export const LIMITS = {
  INTERACTIONS: 50,      // Límite de interacciones almacenadas por usuario
  DEFAULT_QUERY: 10,     // Límite por defecto para consultas
  TREND_ANALYSIS: 30,    // Interacciones necesarias para análisis de tendencias
  PATTERN_DETECTION: 20  // Interacciones mínimas para detección de patrones
};

// Períodos de interacción (24 horas)
export const INTERACTION_PERIODS = {
  MORNING: { start: 5, end: 11 },
  AFTERNOON: { start: 12, end: 17 },
  EVENING: { start: 18, end: 21 },
  NIGHT: { start: 22, end: 4 }
};

// Períodos de horario (en español)
export const HORARIO_PERIODS = {
  mañana: { start: 5, end: 11 },
  tarde: { start: 12, end: 17 },
  noche: { start: 18, end: 21 },
  madrugada: { start: 22, end: 4 }
};

// Ventanas de tiempo para análisis
export const TIME_WINDOWS = {
  HOUR: 60 * 60 * 1000,           // 1 hora
  DAY: 24 * 60 * 60 * 1000,       // 1 día
  WEEK: 7 * 24 * 60 * 60 * 1000,  // 1 semana
  MONTH: 30 * 24 * 60 * 60 * 1000 // 30 días
};

// Configuración de patrones avanzados
export const PATTERN_CONFIG = {
  MIN_CORRELATION_STRENGTH: 0.6,  // Fuerza mínima de correlación (0-1)
  MIN_PATTERN_OCCURRENCES: 3,     // Ocurrencias mínimas para considerar patrón
  TREND_SIGNIFICANCE_THRESHOLD: 0.3, // Umbral de significancia para tendencias
  CYCLE_DETECTION_WINDOW: 7       // Días para detectar ciclos
};

// Días de la semana para análisis de patrones
export const WEEKDAYS = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado'
};

