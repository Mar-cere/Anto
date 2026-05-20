/**
 * Clasificación de errores de registro (API + red).
 */
import { AUTH_ERROR_CODES } from '../../constants/authErrorCodes';

const DUPLICATE_CODE = AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE.toLowerCase();

export function isRegisterDuplicateError(error) {
  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();
  const status = error?.response?.status;
  const errorCode = String(error?.response?.data?.code ?? '').toLowerCase();

  if (status === 409) return true;
  if (errorCode === DUPLICATE_CODE) return true;

  if (
    normalizedMessage.includes('en uso') ||
    normalizedMessage.includes('already in use') ||
    normalizedMessage.includes('already registered') ||
    normalizedMessage.includes('ya está registrado')
  ) {
    return true;
  }

  if (
    normalizedMessage.includes('duplicate') ||
    normalizedMessage.includes('registrado')
  ) {
    return true;
  }

  if (normalizedMessage.includes('already') || normalizedMessage.includes('exist')) {
    const mentionsAccount =
      normalizedMessage.includes('email') ||
      normalizedMessage.includes('correo') ||
      normalizedMessage.includes('username') ||
      normalizedMessage.includes('usuario') ||
      normalizedMessage.includes('user');
    if (mentionsAccount) return true;
  }

  return false;
}

export function resolveRegisterErrorMessage({
  error,
  errorMessages = {},
  texts = {},
  isOffline = false,
}) {
  if (isOffline) {
    return (
      errorMessages.NETWORK_ERROR ||
      errorMessages.CONNECTION_ERROR ||
      errorMessages.GENERIC_ERROR ||
      texts.ERROR_TITLE
    );
  }

  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();
  const status = error?.response?.status;

  const isTooManyAttempts =
    status === 429 ||
    normalizedMessage.includes('too many') ||
    normalizedMessage.includes('demasiados intentos');
  if (isTooManyAttempts) {
    return (
      errorMessages.TOO_MANY_ATTEMPTS ||
      errorMessages.GENERIC_ERROR ||
      texts.ERROR_TITLE
    );
  }

  if (isRegisterDuplicateError(error)) {
    return (
      errorMessages.ALREADY_EXISTS ||
      errorMessages.GENERIC_ERROR ||
      texts.ERROR_TITLE
    );
  }

  const isInvalidData =
    status === 400 ||
    status === 422 ||
    normalizedMessage.includes('invalid') ||
    normalizedMessage.includes('validation') ||
    normalizedMessage.includes('formato');
  if (isInvalidData) {
    return (
      errorMessages.INVALID_DATA ||
      errorMessages.GENERIC_ERROR ||
      texts.ERROR_TITLE
    );
  }

  const isNetworkError =
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('econnrefused') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('failed to fetch');
  if (isNetworkError) {
    return (
      errorMessages.NETWORK_ERROR ||
      errorMessages.CONNECTION_ERROR ||
      errorMessages.GENERIC_ERROR ||
      texts.ERROR_TITLE
    );
  }

  return errorMessages.GENERIC_ERROR || texts.ERROR_TITLE;
}
