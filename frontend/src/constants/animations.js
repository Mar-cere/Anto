/**
 * Constantes de animación compartidas
 * 
 * Centraliza los valores de animación utilizados en múltiples pantallas
 * para mantener consistencia y facilitar ajustes globales.
 * 
 * @author AntoApp Team
 */

// Valores iniciales y finales comunes
export const ANIMATION_VALUES = {
  INITIAL_OPACITY: 0,
  FINAL_OPACITY: 1,
  INITIAL_SCALE: 1,
  INITIAL_BUTTON_OPACITY: 1,
  INITIAL_TRANSLATE_Y: 30,
  FINAL_TRANSLATE_Y: 0,
};

// Duraciones de animación estándar (en milisegundos)
export const ANIMATION_DURATIONS = {
  FAST: 300,      // Animaciones rápidas (transiciones, botones)
  NORMAL: 500,    // Animaciones estándar (fade, slide)
  SLOW: 800,      // Animaciones más lentas (entrada de pantalla)
  VERY_SLOW: 1000, // Animaciones muy lentas (progreso, loading)
};

// Delays comunes (en milisegundos)
export const ANIMATION_DELAYS = {
  SHORT: 150,     // Delay corto
  MEDIUM: 300,    // Delay medio
  LONG: 500,      // Delay largo
  SCREEN_ENTRY: 1500, // Delay para entrada de pantalla
};

// Valores de escala para animaciones
export const ANIMATION_SCALES = {
  BUTTON_PRESS: 0.95,
  BUTTON_ACTIVE: 0.5,
  LOADING: 1.5,
  NORMAL: 1,
  REFRESH_MIN: 1,
  REFRESH_MAX: 1.05,
};

// Valores de opacidad para animaciones
export const ANIMATION_OPACITIES = {
  HIDDEN: 0,
  VISIBLE: 1,
  DISABLED: 0.5,
  ACTIVE: 0.8,
  INACTIVE: 0.7,
  FADE_MIN: 0.5,
  FADE_MAX: 1,
  REFRESH_MIN: 1,
  REFRESH_MAX: 0.7,
};

// Valores de translate para animaciones
export const ANIMATION_TRANSLATES = {
  UP: -30,
  DOWN: 30,
  LEFT: -80,
  RIGHT: 80,
  TYPING: -4,
  NAVBAR: 100,
};

// Configuraciones predefinidas para animaciones comunes
export const ANIMATION_PRESETS = {
  FADE_IN: {
    initial: ANIMATION_VALUES.INITIAL_OPACITY,
    final: ANIMATION_VALUES.FINAL_OPACITY,
    duration: ANIMATION_DURATIONS.NORMAL,
  },
  SLIDE_UP: {
    initial: ANIMATION_VALUES.INITIAL_TRANSLATE_Y,
    final: ANIMATION_VALUES.FINAL_TRANSLATE_Y,
    duration: ANIMATION_DURATIONS.SLOW,
  },
  FADE_SLIDE_UP: {
    opacity: {
      initial: ANIMATION_VALUES.INITIAL_OPACITY,
      final: ANIMATION_VALUES.FINAL_OPACITY,
    },
    translateY: {
      initial: ANIMATION_VALUES.INITIAL_TRANSLATE_Y,
      final: ANIMATION_VALUES.FINAL_TRANSLATE_Y,
    },
    duration: ANIMATION_DURATIONS.SLOW,
  },
};

