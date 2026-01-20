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
// URL del icono de notificación (debe ser una URL pública accesible)
// Si tienes el icono en Cloudinary, reemplaza esta URL con la URL de Cloudinary
export const NOTIFICATION_ICON_URL = process.env.NOTIFICATION_ICON_URL || LOGO_URL;

