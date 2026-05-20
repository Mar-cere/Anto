/**
 * Validación de códigos de recuperación de contraseña.
 */

export function normalizeVerificationCode(code) {
  return String(code ?? '').replace(/\D/g, '').trim();
}

export function getResetCodeExpiresAtMs(expiresAt) {
  if (expiresAt == null) return 0;
  const ms = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function isResetCodeValid(user, code, nowMs = Date.now()) {
  if (!user?.resetPasswordCode || !user?.resetPasswordExpires) {
    return false;
  }

  const normalizedStored = normalizeVerificationCode(user.resetPasswordCode);
  const normalizedInput = normalizeVerificationCode(code);

  if (!normalizedStored || normalizedInput.length !== 6) {
    return false;
  }

  if (normalizedStored !== normalizedInput) {
    return false;
  }

  return getResetCodeExpiresAtMs(user.resetPasswordExpires) > nowMs;
}

export function isResetCodeExpired(user, nowMs = Date.now()) {
  const expiresMs = getResetCodeExpiresAtMs(user?.resetPasswordExpires);
  return !expiresMs || expiresMs <= nowMs;
}
