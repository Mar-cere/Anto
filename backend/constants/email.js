/**
 * Constantes relacionadas con emails
 * 
 * Centraliza valores de configuración para el sistema de correos electrónicos
 * 
 * @author AntoApp Team
 */

// Constantes de tiempos de expiración
export const CODE_EXPIRATION_MINUTES = 10;
export const RESET_TOKEN_EXPIRATION_HOURS = 1;

// Constantes de URLs
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const RESET_PASSWORD_PATH = '/reset-password';

// Constantes de colores (para plantillas HTML)
export const EMAIL_COLORS = {
  PRIMARY_DARK: '#0A1533',
  PRIMARY_MEDIUM: '#1D2B5F',
  ACCENT: '#1ADDDB',
  TEXT_LIGHT: '#A3B8E8',
  TEXT_DARK: '#1D2B5F',
  TEXT_GRAY: '#666',
  TEXT_WHITE: '#fff',
  BACKGROUND: '#f3f7fa'
};

