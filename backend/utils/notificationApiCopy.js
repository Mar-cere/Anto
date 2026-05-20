/**
 * Mensajes de API de notificaciones push (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitDeleteToken:
      'Demasiadas eliminaciones de tokens. Por favor, intente más tarde.',
    pushTokenRequired: 'Token push es requerido',
    invalidPushTokenFormat: 'Formato de token push inválido',
    userNotFound: 'Usuario no encontrado',
    registerSuccess: 'Token push registrado exitosamente',
    registerError: 'Error registrando token push',
    deleteSuccess: 'Token push eliminado exitosamente',
    deleteError: 'Error eliminando token push',
    getStatusError: 'Error obteniendo estado del token',
  },
  en: {
    rateLimitDeleteToken: 'Too many token deletions. Please try again later.',
    pushTokenRequired: 'Push token is required',
    invalidPushTokenFormat: 'Invalid push token format',
    userNotFound: 'User not found',
    registerSuccess: 'Push token registered successfully',
    registerError: 'Could not register push token',
    deleteSuccess: 'Push token removed successfully',
    deleteError: 'Could not remove push token',
    getStatusError: 'Could not retrieve token status',
  },
};

export function notificationApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
