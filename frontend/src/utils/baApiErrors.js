/** Códigos alineados con backend/utils/baBridgeErrorResponse.js */
export const BA_API_ERROR_CODES = {
  PLAN_NOT_FOUND: 'BA_PLAN_NOT_FOUND',
  SLOT_NOT_FOUND: 'BA_SLOT_NOT_FOUND',
  SLOT_LINK_CONFLICT: 'BA_SLOT_LINK_CONFLICT',
  PRODUCT_VALIDATION: 'BA_PRODUCT_VALIDATION',
  BRIDGE_ERROR: 'BA_BRIDGE_ERROR',
};

/**
 * @param {object|null|undefined} payload — cuerpo JSON o err.response?.data
 * @param {{ LINK_PRODUCT_TOAST_ERROR?: string, LINK_PRODUCT_TOAST_CONFLICT?: string }} texts
 */
export function resolveBaApiErrorMessage(payload, texts = {}) {
  const body =
    payload && typeof payload === 'object' && payload.response?.data
      ? payload.response.data
      : payload;
  const code = body && typeof body === 'object' ? body.code : null;
  const fallback = body?.error || texts.LINK_PRODUCT_TOAST_ERROR || 'No se pudo vincular la actividad.';

  switch (code) {
    case BA_API_ERROR_CODES.SLOT_LINK_CONFLICT:
      return texts.LINK_PRODUCT_TOAST_CONFLICT || 'Ese slot ya está vinculado a otra tarea o hábito.';
    case BA_API_ERROR_CODES.SLOT_NOT_FOUND:
    case BA_API_ERROR_CODES.PLAN_NOT_FOUND:
      return body?.error || fallback;
    case BA_API_ERROR_CODES.PRODUCT_VALIDATION:
      return body?.error || fallback;
    default:
      return fallback;
  }
}
