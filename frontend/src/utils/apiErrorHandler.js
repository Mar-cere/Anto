/**
 * Manejo centralizado de errores de API.
 * Proporciona mensajes consistentes y accesibles según código HTTP, error.code y tipo de fallo (red, auth, etc.).
 *
 * Uso:
 *   import { getApiErrorMessage, isNetworkError, isAuthError } from '../utils/apiErrorHandler';
 *   catch (err) {
 *     const message = getApiErrorMessage(err, { isOffline, language });
 *     Alert.alert(title, message);
 *   }
 */

import { DEFAULT_LANGUAGE, getTranslations } from '../constants/translations';
import { getCachedAppLanguage } from './appLanguage';

// Códigos HTTP que usamos para elegir mensaje por defecto
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  UNAVAILABLE: 503,
};

/**
 * Mensajes de fallback por idioma (cuando el backend no envía `message`).
 * @param {string} [language]
 * @returns {Record<string, string>}
 */
export function getApiErrorMessages(language) {
  const lang = language || getCachedAppLanguage();
  const messages = getTranslations(lang)?.API_ERRORS;
  const fallback = getTranslations(DEFAULT_LANGUAGE)?.API_ERRORS;
  return { ...fallback, ...messages };
}

/** Mensajes en español (compatibilidad con tests y código legado). */
export const API_ERROR_MESSAGES = getApiErrorMessages(DEFAULT_LANGUAGE);

/**
 * Detecta si el error es por red (sin respuesta o timeout).
 * @param {Error} error
 * @returns {boolean}
 */
export function isNetworkError(error) {
  if (!error || typeof error.message !== 'string') return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('network error') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    !error.response
  );
}

/**
 * Detecta si el error es de autenticación (401) o autorización (403).
 * @param {Error} error
 * @returns {boolean}
 */
export function isAuthError(error) {
  const status = error?.response?.status;
  return status === HTTP_STATUS.UNAUTHORIZED || status === HTTP_STATUS.FORBIDDEN;
}

/**
 * Detecta si el error es por rate limit (429).
 * @param {Error} error
 * @returns {boolean}
 */
export function isRateLimitError(error) {
  return error?.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS;
}

/**
 * Detecta si el error es 5xx (servidor).
 * @param {Error} error
 * @returns {boolean}
 */
export function isServerError(error) {
  const status = error?.response?.status;
  return status >= 500 && status < 600;
}

/**
 * Obtiene un mensaje seguro para mostrar al usuario según el error.
 * Prioridad: mensaje del servidor (response.data.message) > código HTTP > red > genérico.
 *
 * @param {Error} error - Error lanzado por api.get/post/put/patch/delete (con error.response si hay respuesta).
 * @param {{ isOffline?: boolean, language?: string }} [options]
 * @returns {string} Mensaje listo para Alert o Toast.
 */
export function getApiErrorMessage(error, options = {}) {
  const { isOffline = false, language } = options;
  const MSG = getApiErrorMessages(language);

  if (isOffline) {
    return MSG.NETWORK;
  }

  if (!error) {
    return MSG.GENERIC;
  }

  // Red / timeout
  if (isNetworkError(error)) {
    if (error.message?.toLowerCase().includes('timeout')) {
      return MSG.TIMEOUT;
    }
    return MSG.NETWORK;
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Mensaje explícito del backend (prioridad; ya viene en el idioma de la API)
  const serverMessage =
    typeof data?.message === 'string'
      ? data.message.trim()
      : typeof data?.error === 'string'
        ? data.error.trim()
        : null;
  if (serverMessage) {
    return serverMessage;
  }

  // Código de error opcional del backend (p. ej. error.code)
  if (data?.code && typeof data.code === 'string') {
    const codeMsg = MSG[data.code] || null;
    if (codeMsg) return codeMsg;
  }

  // Mensaje por código HTTP
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return MSG.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return MSG.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return MSG.NOT_FOUND;
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return MSG.TOO_MANY_REQUESTS;
    case HTTP_STATUS.BAD_REQUEST:
    case HTTP_STATUS.UNPROCESSABLE:
    case HTTP_STATUS.CONFLICT:
      return MSG.BAD_REQUEST;
    case HTTP_STATUS.SERVER_ERROR:
    case HTTP_STATUS.BAD_GATEWAY:
    case HTTP_STATUS.UNAVAILABLE:
      return MSG.SERVER;
    default:
      if (status >= 500 && status < 600) return MSG.SERVER;
      if (status >= 400 && status < 500) return MSG.BAD_REQUEST;
      return MSG.GENERIC;
  }
}

export default {
  getApiErrorMessage,
  getApiErrorMessages,
  isNetworkError,
  isAuthError,
  isRateLimitError,
  isServerError,
  HTTP_STATUS,
  API_ERROR_MESSAGES,
};
