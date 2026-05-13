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
  return { ok: true, receipt: withoutWhitespace };
}
