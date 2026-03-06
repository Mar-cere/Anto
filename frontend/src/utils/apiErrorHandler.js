/**
 * Manejo centralizado de errores de API.
 * Proporciona mensajes consistentes y accesibles según código HTTP, error.code y tipo de fallo (red, auth, etc.).
 *
 * Uso:
 *   import { getApiErrorMessage, isNetworkError, isAuthError } from '../utils/apiErrorHandler';
 *   catch (err) {
 *     const message = getApiErrorMessage(err, { isOffline });
 *     Alert.alert('Error', message);
 *   }
 */

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

// Mensajes de usuario (consistentes, claros, aptos para lectores de pantalla)
export const API_ERROR_MESSAGES = {
  NETWORK: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  TIMEOUT: 'La solicitud tardó demasiado. Inténtalo de nuevo.',
  SERVER: 'Error del servidor. Inténtalo más tarde.',
  UNAUTHORIZED: 'Correo o contraseña incorrectos.',
  FORBIDDEN: 'Tu cuenta está desactivada. Contacta a soporte si crees que es un error.',
  NOT_FOUND: 'No encontrado. Puede que el enlace haya expirado.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  BAD_REQUEST: 'Revisa los datos e inténtalo de nuevo.',
  GENERIC: 'Algo ha fallado. Inténtalo de nuevo.',
};

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
 * @param {{ isOffline?: boolean }} [options] - isOffline: si se sabe que no hay conexión, se devuelve mensaje de red.
 * @returns {string} Mensaje en español, listo para Alert o Toast.
 */
export function getApiErrorMessage(error, options = {}) {
  const { isOffline = false } = options;

  if (isOffline) {
    return API_ERROR_MESSAGES.NETWORK;
  }

  if (!error) {
    return API_ERROR_MESSAGES.GENERIC;
  }

  // Red / timeout
  if (isNetworkError(error)) {
    if (error.message?.toLowerCase().includes('timeout')) {
      return API_ERROR_MESSAGES.TIMEOUT;
    }
    return API_ERROR_MESSAGES.NETWORK;
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Mensaje explícito del backend (prioridad)
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
    const codeMsg = API_ERROR_MESSAGES[data.code] || null;
    if (codeMsg) return codeMsg;
  }

  // Mensaje por código HTTP
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return API_ERROR_MESSAGES.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return API_ERROR_MESSAGES.NOT_FOUND;
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return API_ERROR_MESSAGES.TOO_MANY_REQUESTS;
    case HTTP_STATUS.BAD_REQUEST:
    case HTTP_STATUS.UNPROCESSABLE:
    case HTTP_STATUS.CONFLICT:
      return API_ERROR_MESSAGES.BAD_REQUEST;
    case HTTP_STATUS.SERVER_ERROR:
    case HTTP_STATUS.BAD_GATEWAY:
    case HTTP_STATUS.UNAVAILABLE:
      return API_ERROR_MESSAGES.SERVER;
    default:
      if (status >= 500 && status < 600) return API_ERROR_MESSAGES.SERVER;
      if (status >= 400 && status < 500) return API_ERROR_MESSAGES.BAD_REQUEST;
      return API_ERROR_MESSAGES.GENERIC;
  }
}

export default {
  getApiErrorMessage,
  isNetworkError,
  isAuthError,
  isRateLimitError,
  isServerError,
  HTTP_STATUS,
  API_ERROR_MESSAGES,
};
