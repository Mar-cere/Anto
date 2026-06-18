/** Códigos estables para guardas ABC (#86 / #212). */
export const ABC_GUARD_ERROR_CODES = {
  MACRO_INVALID_RANGE: 'ABC_MACRO_INVALID_RANGE',
  GUARD_ERROR: 'ABC_GUARD_ERROR',
};

const KEY_MAP = {
  macroInvalidRange: ABC_GUARD_ERROR_CODES.MACRO_INVALID_RANGE,
};

/**
 * @param {'macroInvalidRange'} errorKey
 * @param {string} message
 */
export function buildAbcGuardErrorBody(errorKey, message) {
  return {
    success: false,
    error: message,
    code: KEY_MAP[errorKey] || ABC_GUARD_ERROR_CODES.GUARD_ERROR,
  };
}
