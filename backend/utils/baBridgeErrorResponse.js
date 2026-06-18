/** Códigos estables para errores de puente BA ↔ tareas/hábitos (API + smoke). */
export const BA_BRIDGE_ERROR_CODES = {
  PLAN_NOT_FOUND: 'BA_PLAN_NOT_FOUND',
  SLOT_NOT_FOUND: 'BA_SLOT_NOT_FOUND',
  SLOT_LINK_CONFLICT: 'BA_SLOT_LINK_CONFLICT',
  PRODUCT_VALIDATION: 'BA_PRODUCT_VALIDATION',
  BRIDGE_ERROR: 'BA_BRIDGE_ERROR',
};

const SERVICE_CODE_MAP = {
  PLAN_NOT_FOUND: BA_BRIDGE_ERROR_CODES.PLAN_NOT_FOUND,
  SLOT_NOT_FOUND: BA_BRIDGE_ERROR_CODES.SLOT_NOT_FOUND,
  SLOT_LINK_CONFLICT: BA_BRIDGE_ERROR_CODES.SLOT_LINK_CONFLICT,
  PRODUCT_VALIDATION: BA_BRIDGE_ERROR_CODES.PRODUCT_VALIDATION,
};

/**
 * @param {string} serviceCode
 * @param {string} message
 */
export function buildBaBridgeErrorBody(serviceCode, message) {
  return {
    success: false,
    error: message,
    code: SERVICE_CODE_MAP[serviceCode] || BA_BRIDGE_ERROR_CODES.BRIDGE_ERROR,
  };
}
