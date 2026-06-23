/**
 * Constantes relacionadas con emails
 *
 * Paleta alineada con `frontend/src/styles/themePalettes.js` (tema claro).
 */

// Constantes de tiempos de expiración
export const CODE_EXPIRATION_MINUTES = 10;
export const RESET_TOKEN_EXPIRATION_HOURS = 1;

/** Horas tras el registro antes del recordatorio de verificación (default: 24). */
export function getEmailVerificationReminderAfterHours() {
  const raw = parseInt(process.env.EMAIL_VERIFICATION_REMINDER_AFTER_HOURS, 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 24;
}

// Constantes de URLs
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const RESET_PASSWORD_PATH = '/reset-password';

/** Colores y tokens visuales para plantillas HTML (paridad con la app). */
export const EMAIL_COLORS = {
  /** Texto principal / navy */
  PRIMARY_DARK: '#24234F',
  /** Botones, enlaces de acción, acentos */
  PRIMARY_MEDIUM: '#1E83D3',
  /** Acento brillante (gradientes, detalles) */
  ACCENT: '#44D7FB',
  ACCENT_WARM: '#E89BB8',
  TEXT_LIGHT: '#5C5A78',
  TEXT_DARK: '#24234F',
  TEXT_GRAY: '#5C5A78',
  TEXT_MUTED: 'rgba(36, 35, 79, 0.48)',
  TEXT_WHITE: '#FFFFFF',
  BACKGROUND: '#E8EDF8',
  GRADIENT_TOP: '#FCF6F9',
  GRADIENT_BOTTOM: '#E2EBFA',
  SURFACE: '#FFFFFF',
  BORDER: 'rgba(36, 35, 79, 0.09)',
  BORDER_STRONG: 'rgba(36, 35, 79, 0.12)',
  SHADOW: 'rgba(36, 35, 79, 0.14)',
  PRIMARY_SOFT: 'rgba(30, 131, 211, 0.14)',
  ACCENT_SOFT: 'rgba(68, 215, 251, 0.22)',
  CHROME_FILL: '#F3F5FB',
};

export const EMAIL_FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
