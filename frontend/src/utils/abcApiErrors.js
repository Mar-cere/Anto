/** Códigos alineados con backend/utils/abcGuardErrorResponse.js */
export const ABC_API_ERROR_CODES = {
  MACRO_INVALID_RANGE: 'ABC_MACRO_INVALID_RANGE',
  GUARD_ERROR: 'ABC_GUARD_ERROR',
};

/**
 * @param {object|null|undefined} payload — cuerpo JSON o err.response?.data
 * @param {{ MACRO_PATTERNS_ERROR?: string, MACRO_PATTERNS_RANGE_ERROR?: string }} texts
 */
export function resolveAbcApiErrorMessage(payload, texts = {}) {
  const body =
    payload && typeof payload === 'object' && payload.response?.data
      ? payload.response.data
      : payload;
  const code = body && typeof body === 'object' ? body.code : null;
  const fallback =
    body?.error || texts.MACRO_PATTERNS_ERROR || 'No se pudieron cargar los patrones ABC.';

  switch (code) {
    case ABC_API_ERROR_CODES.MACRO_INVALID_RANGE:
      return texts.MACRO_PATTERNS_RANGE_ERROR || body?.error || fallback;
    default:
      return fallback;
  }
}
