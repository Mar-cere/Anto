/**
 * Normaliza el recibo IAP (base64 del bundle) antes de enviarlo al backend.
 * Debe coincidir con la lógica de `backend/utils/appleReceiptNormalize.js`.
 */
export function normalizeClientAppleReceipt(receipt) {
  if (receipt == null || typeof receipt !== 'string') {
    return '';
  }
  return receipt.trim().replace(/\s+/g, '');
}
