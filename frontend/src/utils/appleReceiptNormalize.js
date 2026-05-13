/**
 * Normaliza y valida la forma del recibo IAP (base64 del bundle) antes de enviarlo al backend.
 * La comprobación PKCS#7 (primer byte 0x30) debe coincidir con `backend/utils/appleReceiptNormalize.js`.
 */

export const MIN_APP_STORE_RECEIPT_BASE64_LENGTH = 32;

/**
 * @param {unknown} receipt
 * @returns {string} Cadena base64 sin espacios, o cadena vacía si no es string usable.
 */
export function normalizeClientAppleReceipt(receipt) {
  if (receipt == null || typeof receipt !== 'string') {
    return '';
  }
  return receipt.trim().replace(/\s+/g, '');
}

/**
 * Comprueba que la cadena parezca el recibo PKCS#7 en base64 que Apple espera en verifyReceipt.
 * @param {string} normalized — Salida de {@link normalizeClientAppleReceipt}
 * @returns {boolean}
 */
export function isPlausibleAppleReceiptBase64(normalized) {
  if (typeof normalized !== 'string' || normalized.length < MIN_APP_STORE_RECEIPT_BASE64_LENGTH) {
    return false;
  }
  const head = normalized.slice(0, 2);
  if (head === 'ey' || normalized.startsWith('{') || normalized.startsWith('[')) {
    return false;
  }
  if (!/^[A-Za-z0-9+/=_-]+$/.test(normalized)) {
    return false;
  }
  try {
    const bin = atob(normalized);
    if (bin.length < 16) {
      return false;
    }
    const c0 = bin.charCodeAt(0);
    if (c0 === 0x7b || c0 === 0x5b) {
      return false;
    }
    return c0 === 0x30;
  } catch {
    return false;
  }
}
