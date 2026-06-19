/**
 * Constantes de la aplicación
 * 
 * Centraliza valores de configuración generales de la aplicación
 * 
 * @author AntoApp Team
 */

export const APP_NAME = 'Anto';
export const APP_NAME_FULL = 'AntoApp';

// Versión actual de términos y condiciones
// IMPORTANTE: Incrementar esta versión cuando se actualicen los términos
// Los usuarios con versiones anteriores deberán re-aceptar
export const CURRENT_TERMS_VERSION = '1.0';
export const LOGO_URL = 'https://res.cloudinary.com/dfmmn3hqw/image/upload/v1746325071/Anto_nnrwjr.png';
export const EMAIL_FROM_NAME = 'Anto';

/** Cuentas oficiales de Instagram por idioma de la app. */
export const INSTAGRAM_URLS = {
  es:
    process.env.INSTAGRAM_URL_ES ||
    process.env.INSTAGRAM_URL ||
    'https://www.instagram.com/antoapp.es?igsh=YjU3MDB5bTkycjAz&utm_source=qr',
  en:
    process.env.INSTAGRAM_URL_EN ||
    'https://www.instagram.com/antoapp.en?igsh=MTk0dGFlM2hldGpueA%3D%3D&utm_source=qr',
};

/** @deprecated Preferir resolveInstagramUrl(language) */
export const INSTAGRAM_URL = INSTAGRAM_URLS.es;

/**
 * @param {'es'|'en'|string} [language='es']
 * @returns {string}
 */
export function resolveInstagramUrl(language = 'es') {
  return String(language || 'es').toLowerCase().startsWith('en')
    ? INSTAGRAM_URLS.en
    : INSTAGRAM_URLS.es;
}
// URL del icono de notificación (debe ser una URL pública accesible)
// Si tienes el icono en Cloudinary, reemplaza esta URL con la URL de Cloudinary
export const NOTIFICATION_ICON_URL = process.env.NOTIFICATION_ICON_URL || LOGO_URL;

