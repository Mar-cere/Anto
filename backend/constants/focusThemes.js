/**
 * Catálogo de focos de acompañamiento (#2): temas temporales que vertebran
 * el proceso del usuario (alinean tono, sugerencias, técnicas y métricas).
 */

/**
 * Temas de foco disponibles.
 * @typedef {Object} FocusTheme
 * @property {string} id - Identificador único del tema
 * @property {string} icon - Nombre del ícono (MaterialCommunityIcons)
 * @property {number} durationWeeks - Duración sugerida en semanas (default 4)
 * @property {string[]} suggestedInterventions - IDs de técnicas/módulos relacionados
 * @property {string} accentKey - Clave de color visual (ver INTERVENTION_VISUALS)
 * @property {number} order - Orden de presentación en UI
 */

/**
 * Catálogo de temas de foco.
 * MVP Fase 1: anxiety, boundaries, selfCare
 */
export const FOCUS_THEMES = {
  anxiety: {
    id: 'anxiety',
    icon: 'pulse',
    durationWeeks: 4,
    suggestedInterventions: ['exposure', 'breathing', 'psychoeducation'],
    accentKey: 'mint',
    order: 1,
  },
  boundaries: {
    id: 'boundaries',
    icon: 'shield-outline',
    durationWeeks: 4,
    suggestedInterventions: ['assertiveness', 'communication', 'values'],
    accentKey: 'lavender',
    order: 2,
  },
  selfCare: {
    id: 'selfCare',
    icon: 'heart-outline',
    durationWeeks: 4,
    suggestedInterventions: ['behavioralActivation', 'habits', 'mindfulness'],
    accentKey: 'rose',
    order: 3,
  },
};

/**
 * Array ordenado de temas para iteración.
 */
export const FOCUS_THEMES_ARRAY = Object.values(FOCUS_THEMES).sort((a, b) => a.order - b.order);

/**
 * Validar si un themeId es válido.
 */
export function isValidFocusTheme(themeId) {
  return Boolean(themeId && FOCUS_THEMES[themeId]);
}

/**
 * Obtener tema por ID con fallback.
 */
export function getFocusTheme(themeId) {
  return FOCUS_THEMES[themeId] || null;
}

/**
 * Estados permitidos de un foco activo.
 */
export const FOCUS_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

/**
 * Duración máxima permitida de un foco en semanas.
 */
export const MAX_FOCUS_DURATION_WEEKS = 12;

/**
 * Duración mínima permitida de un foco en semanas.
 */
export const MIN_FOCUS_DURATION_WEEKS = 1;
