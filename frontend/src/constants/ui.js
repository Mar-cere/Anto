/**
 * Constantes de UI compartidas
 * 
 * Centraliza valores de interfaz de usuario utilizados en múltiples pantallas
 * para mantener consistencia visual.
 * 
 * @author AntoApp Team
 */

// Configuración de StatusBar
export const STATUS_BAR = {
  STYLE: 'dark-content', // fondos claros: iconos de estado oscuros
  BACKGROUND: 'transparent',
  DEFAULT_HEIGHT: 44, // Altura por defecto en iOS
};

// Opacidades comunes para imágenes y fondos
export const OPACITIES = {
  IMAGE_BACKGROUND: 0.1,
  BACKGROUND: 0.1,
  DISABLED: 0.5,
  ACTIVE: 0.8,
  HOVER: 0.7,
};

// Escalas comunes
export const SCALES = {
  LOADING: 1.5,
  NORMAL: 1,
  BUTTON_PRESS: 0.95,
};

// Espaciado y padding común
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  /**
   * Inset horizontal del borde de pantalla al contenido (header con saludo, scroll del dashboard, etc.).
   */
  SCREEN_EDGE_INSET: 14,
  /**
   * Resta aplicada al inset inferior efectivo para acercar la barra al borde (menos “hueco” sobre el home indicator).
   */
  FLOATING_NAV_DOCK_INSET_RELIEF: 24,
  /**
   * Suma al cálculo del `bottom` del dock (suele 0). No usar negativos: ajusta INSET_RELIEF o el mínimo.
   */
  FLOATING_NAV_DOCK_ABOVE_SAFE: 0,
  /**
   * Mínimo de `bottom` del dock (suelo) cuando el cálculo quedaría demasiado bajo o el inset real es 0.
   */
  FLOATING_NAV_DOCK_MIN_FROM_BOTTOM: 8,
  /**
   * En Web, `useSafeAreaInsets().bottom` suele ser 0: sin esto, el dock queda en MIN_FROM_BOTTOM y
   * **cambiar INSET_RELIEF no hace nada** (el “máximo” fija siempre el mismo valor).
   * iOS/Android nativo usan el inset real del dispositivo.
   */
  FLOATING_NAV_DOCK_FALLBACK_BOTTOM_WEB: 34,
  /**
   * Suma típica a `insets.bottom` en listas/scroll cuando hay FloatingNavBar (barra + botón central + respiro).
   * Misma base que Dash, Tareas, Hábitos, Pomodoro, etc.
   */
  FLOATING_NAV_SCROLL_BOTTOM_EXTRA: 132,
  /** @deprecated Preferir FLOATING_NAV_SCROLL_BOTTOM_EXTRA; mismo valor para compatibilidad. */
  CONTENT_PADDING_BOTTOM: 132,
  ERROR_PADDING: 15,
  ERROR_MARGIN_BOTTOM: 20,
  ERROR_TEXT_MARGIN_BOTTOM: 10,
  LOADING_TEXT_MARGIN_TOP: 10,
  ERROR_BUTTON_PADDING_HORIZONTAL: 15,
  ERROR_BUTTON_PADDING_VERTICAL: 8,
  ERROR_BUTTON_MARGIN_LEFT: 10,
};

// Bordes y radios comunes
export const BORDERS = {
  ERROR_LEFT_WIDTH: 4,
  ERROR_BUTTON_RADIUS: 5,
};

// Escala tipográfica (título 24, subtítulo 18, cuerpo 16, caption 14)
export const TYPOGRAPHY = {
  TITLE: 24,
  SUBTITLE: 18,
  BODY: 16,
  CAPTION: 14,
  SMALL: 12,
};

