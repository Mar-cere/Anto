/**
 * Normaliza códigos de verificación de 6 dígitos (pegar desde email, espacios, guiones).
 */
export function normalizeVerificationCode(code) {
  return String(code ?? '').replace(/\D/g, '').trim();
}

export function isCompleteVerificationCode(code) {
  return normalizeVerificationCode(code).length === 6;
}
