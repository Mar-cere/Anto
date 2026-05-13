/**
 * Normaliza el payload receipt-data para verifyReceipt de Apple.
 * Evita 21002 por espacios, recibo vacío o cadenas que claramente no son base64 del recibo.
 */

const MIN_RECEIPT_BASE64_LENGTH = 32;

/**
 * @param {unknown} receipt
 * @returns {{ ok: true, receipt: string } | { ok: false, error: string }}
 */
export function normalizeAppleReceiptPayload(receipt) {
  if (receipt == null) {
    return { ok: false, error: 'El recibo no fue enviado (null o undefined).' };
  }
  if (typeof receipt !== 'string') {
    return { ok: false, error: 'El recibo debe ser una cadena base64.' };
  }
  const trimmed = receipt.trim();
  if (!trimmed) {
    return { ok: false, error: 'El recibo está vacío. En el dispositivo puede faltar el recibo de la App Store; probá cerrar sesión, reinstalar o «Restaurar compras» desde Ajustes de Apple.' };
  }
  const withoutWhitespace = trimmed.replace(/\s+/g, '');
  if (withoutWhitespace.length < MIN_RECEIPT_BASE64_LENGTH) {
    return {
      ok: false,
      error: `El recibo es demasiado corto (${withoutWhitespace.length} caracteres) para ser válido con Apple.`,
    };
  }
  const head = withoutWhitespace.slice(0, 2);
  if (head === 'ey' || withoutWhitespace.startsWith('{') || withoutWhitespace.startsWith('[')) {
    return {
      ok: false,
      error:
        'El cliente envió un formato de recibo no compatible con verifyReceipt (p. ej. JWT/JSON). Se espera el recibo de la app en base64.',
    };
  }
  if (!/^[A-Za-z0-9+/=_-]+$/.test(withoutWhitespace)) {
    return { ok: false, error: 'El recibo contiene caracteres no válidos para base64.' };
  }
  let decoded;
  try {
    decoded = Buffer.from(withoutWhitespace, 'base64');
  } catch {
    return { ok: false, error: 'No se pudo decodificar el recibo como base64.' };
  }
  if (!decoded.length || decoded.length < 16) {
    return {
      ok: false,
      error: 'El recibo decodificado es demasiado corto para ser un recibo de App Store (PKCS#7).',
    };
  }
  const first = decoded[0];
  if (first === 0x7b || first === 0x5b) {
    return {
      ok: false,
      error:
        'El cliente envió datos que decodifican como JSON/array, no el recibo PKCS#7 de la app. Usá el recibo de la App Store (JWS en StoreKit 2 o appStoreReceiptURL en StoreKit 1).',
    };
  }
  if (first !== 0x30) {
    return {
      ok: false,
      error:
        'El recibo decodificado no tiene el formato PKCS#7 que Apple devuelve en verifyReceipt (se esperaba comenzar con ASN.1 SEQUENCE 0x30).',
    };
  }
  return { ok: true, receipt: withoutWhitespace };
}
