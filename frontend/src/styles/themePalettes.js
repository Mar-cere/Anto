/**
 * Paletas de tema claro y oscuro (mismas claves para poder alternar sin ramas sueltas).
 * El usuario elige en Configuración; 'auto' sigue el sistema vía ThemeContext.
 */

export const lightColors = {
  primary: '#1E83D3',
  primaryBright: '#44D7FB',
  accentWarm: '#E89BB8',
  /** Acento índigo de marca (onboarding, chips, variación sin amarillo alerta). */
  accentSecondary: '#5B4BD4',

  background: '#E8EDF8',
  gradientTop: '#FCF6F9',
  gradientBottom: '#E2EBFA',

  surface: '#FFFFFF',
  text: '#24234F',
  textSecondary: '#5C5A78',
  textMuted: 'rgba(36, 35, 79, 0.48)',
  textOnPrimary: '#FFFFFF',

  white: '#FFFFFF',

  glassFill: 'rgba(255, 255, 255, 0.68)',
  glassFillStrong: 'rgba(255, 255, 255, 0.88)',
  glassBorderLight: 'rgba(255, 255, 255, 0.78)',
  glassOutline: 'rgba(36, 35, 79, 0.07)',
  glassShadow: 'rgba(36, 35, 79, 0.14)',
  /** Fallback neutro para shadowColor (iOS) si falta glassShadow en un objeto parcial. */
  shadowAmbient: '#000000',

  cardBackground: 'rgba(255, 255, 255, 0.76)',
  border: 'rgba(36, 35, 79, 0.09)',

  chromeHeader: 'rgba(255, 255, 255, 0.9)',
  chromeHeaderBorder: 'rgba(36, 35, 79, 0.06)',
  /** Botón atrás redondeado en Header */
  chromeHeaderBack: 'rgba(36, 35, 79, 0.08)',
  /** Botón perfil redondeado en Header */
  chromeHeaderProfile: 'rgba(36, 35, 79, 0.06)',
  chromeIconButton: 'rgba(255, 255, 255, 0.94)',
  chromeCard: 'rgba(255, 255, 255, 0.82)',
  chromeCardBorder: 'rgba(36, 35, 79, 0.06)',
  chromeInput: '#F3F5FB',
  chromeInputDisabled: 'rgba(36, 35, 79, 0.06)',
  /** Fila de lista (p. ej. opciones en sheet) sin seleccionar */
  chromeListRow: 'rgba(36, 35, 79, 0.04)',

  /**
   * Contenedor apilado tipo Configuración (bloque con borde/sombra).
   * Más tenue que chromeCard para agrupar filas sin competir con el fondo de pantalla.
   */
  settingsSectionSurface: 'rgba(36, 35, 79, 0.045)',

  assistantBubble: 'rgba(255, 255, 255, 0.9)',
  assistantBubbleBorder: 'rgba(36, 35, 79, 0.06)',

  overlay: 'rgba(36, 35, 79, 0.42)',
  modalSurface: 'rgba(255, 255, 255, 0.96)',

  accentLine: 'rgba(30, 131, 211, 0.35)',
  accentLineSoft: 'rgba(30, 131, 211, 0.18)',

  navy: '#24234F',

  error: '#FF6B6B',
  /** Superficie / borde para acciones destructivas (logout, eliminar, confirmar peligro) */
  dangerSoft: 'rgba(255, 107, 107, 0.12)',
  dangerBorder: 'rgba(255, 107, 107, 0.32)',
  success: '#4CAF50',
  successSoft: 'rgba(76, 175, 80, 0.15)',
  /** Ámbar legible sobre fondos claros (no amarillo limón). */
  warning: '#B8750A',
  warningForeground: '#FFFFFF',
  warningSoft: 'rgba(184, 117, 10, 0.14)',
  warningBorder: 'rgba(184, 117, 10, 0.32)',
  info: '#6BCB77',

  accent: '#1E83D3',

  /** Encabezados/stack legacy (tabs ocultas pero útiles para transiciones) */
  navigationHeader: '#1D1B70',
  navigationCard: '#E8EDF8',
  tabBarInactive: '#A3ADDB',
};

export const darkColors = {
  primary: '#1E83D3',
  primaryBright: '#44D7FB',
  accentWarm: '#E89BB8',
  /** Acento índigo de marca (onboarding, chips, variación sin amarillo alerta). */
  accentSecondary: '#8B7FE8',

  background: '#030A24',
  gradientTop: '#081229',
  gradientBottom: '#030A24',

  surface: '#152042',
  text: '#F5F7FF',
  textSecondary: '#A3B8E8',
  textMuted: 'rgba(245, 247, 255, 0.52)',
  textOnPrimary: '#042036',

  white: '#FFFFFF',

  glassFill: 'rgba(255, 255, 255, 0.06)',
  glassFillStrong: 'rgba(255, 255, 255, 0.11)',
  glassBorderLight: 'rgba(255, 255, 255, 0.14)',
  glassOutline: 'rgba(255, 255, 255, 0.08)',
  glassShadow: 'rgba(0, 0, 0, 0.45)',
  shadowAmbient: '#000000',

  cardBackground: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.12)',

  chromeHeader: 'rgba(10, 18, 48, 0.94)',
  chromeHeaderBorder: 'rgba(255, 255, 255, 0.08)',
  chromeHeaderBack: 'rgba(255, 255, 255, 0.12)',
  chromeHeaderProfile: 'rgba(255, 255, 255, 0.08)',
  chromeIconButton: 'rgba(255, 255, 255, 0.08)',
  chromeCard: 'rgba(255, 255, 255, 0.07)',
  chromeCardBorder: 'rgba(255, 255, 255, 0.1)',
  chromeInput: 'rgba(255, 255, 255, 0.08)',
  chromeInputDisabled: 'rgba(255, 255, 255, 0.04)',
  chromeListRow: 'rgba(255, 255, 255, 0.06)',

  settingsSectionSurface: 'rgba(255, 255, 255, 0.04)',

  assistantBubble: 'rgba(255, 255, 255, 0.09)',
  assistantBubbleBorder: 'rgba(255, 255, 255, 0.1)',

  overlay: 'rgba(0, 0, 0, 0.65)',
  modalSurface: '#122042',

  accentLine: 'rgba(68, 215, 251, 0.42)',
  accentLineSoft: 'rgba(68, 215, 251, 0.2)',

  navy: '#F5F7FF',

  error: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.2)',
  dangerBorder: 'rgba(255, 107, 107, 0.42)',
  success: '#4CAF50',
  successSoft: 'rgba(76, 175, 80, 0.22)',
  warning: '#F0C14A',
  warningForeground: '#1A1400',
  warningSoft: 'rgba(240, 193, 74, 0.18)',
  warningBorder: 'rgba(240, 193, 74, 0.38)',
  info: '#6BCB77',

  accent: '#44D7FB',

  navigationHeader: '#1D1B70',
  navigationCard: '#030A24',
  tabBarInactive: '#7E8AB8',
};
