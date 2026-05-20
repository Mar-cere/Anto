/**
 * Mensajes de error para recuperación de contraseña (ES/EN vía textos de AUTH).
 */

export function resolvePasswordRecoveryErrorMessage(error, texts, fallbackKey) {
  const status = error?.response?.status;
  const apiMessage = String(error?.response?.data?.message ?? '').trim();
  const errorCode = String(error?.response?.data?.code ?? '').toUpperCase();
  const rawMessage = String(apiMessage || error?.message || '').toLowerCase();

  const isNetworkIssue =
    !error?.response ||
    rawMessage.includes('network') ||
    rawMessage.includes('econnrefused') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('timed out') ||
    rawMessage.includes('failed to fetch');
  if (isNetworkIssue) {
    return texts.CONNECTION_ERROR;
  }

  if (
    status === 429 ||
    rawMessage.includes('too many') ||
    rawMessage.includes('demasiados intentos')
  ) {
    return texts.TOO_MANY_ATTEMPTS;
  }

  if (
    status === 404 ||
    rawMessage.includes('no existe una cuenta') ||
    rawMessage.includes('no account exists')
  ) {
    return texts.EMAIL_NOT_FOUND || apiMessage || texts[fallbackKey];
  }

  if (errorCode === 'RESET_CODE_EXPIRED') {
    return texts.CODE_EXPIRED || apiMessage || texts[fallbackKey];
  }

  if (errorCode === 'RESET_CODE_INVALID') {
    return texts.CODE_INVALID || apiMessage || texts[fallbackKey];
  }

  if (
    rawMessage.includes('código activo') ||
    rawMessage.includes('active recovery code') ||
    rawMessage.includes('code still active')
  ) {
    return texts.ACTIVE_CODE_EXISTS || apiMessage || texts[fallbackKey];
  }

  if (
    rawMessage.includes('expiró') ||
    rawMessage.includes('expired') ||
    rawMessage.includes('has expired')
  ) {
    return texts.CODE_EXPIRED || apiMessage || texts[fallbackKey];
  }

  if (
    rawMessage.includes('no es correcto') ||
    rawMessage.includes('not correct') ||
    rawMessage.includes('incorrect')
  ) {
    return texts.CODE_INVALID || apiMessage || texts[fallbackKey];
  }

  if (apiMessage) {
    return apiMessage;
  }

  return texts[fallbackKey];
}
