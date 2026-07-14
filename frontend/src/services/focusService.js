/**
 * Servicio de focos de acompañamiento (#2) - Cliente API
 */
import apiClient from '../config/api';

const FOCUS_BASE = '/api/focus';

/**
 * Desenvuelve el envelope { success, data } del API.
 * @param {unknown} response
 * @returns {unknown}
 */
function unwrapFocusResponse(response) {
  const body = response && typeof response === 'object' && 'data' in response && !('themeId' in response)
    ? response
    : response?.data ?? response;
  if (body && typeof body === 'object' && 'data' in body && ('success' in body || Array.isArray(body.data))) {
    return body.data;
  }
  return body;
}

/**
 * Obtener temas de foco disponibles
 * @returns {Promise<Array>}
 */
export const getFocusThemes = async () => {
  const response = await apiClient.get(`${FOCUS_BASE}/themes`);
  return unwrapFocusResponse(response);
};

/**
 * Obtener foco activo del usuario
 * @returns {Promise<Object|null>}
 */
export const getActiveFocus = async () => {
  const response = await apiClient.get(`${FOCUS_BASE}/active`);
  return unwrapFocusResponse(response);
};

/**
 * Iniciar un nuevo foco
 * @param {Object} payload - { themeId, durationWeeks?, customGoal? }
 * @returns {Promise<Object>}
 */
export const startFocus = async (payload) => {
  if (!payload || !payload.themeId) {
    throw new Error('themeId is required to start a focus');
  }
  const response = await apiClient.post(`${FOCUS_BASE}/active`, payload);
  return unwrapFocusResponse(response);
};

/**
 * Actualizar foco activo
 * @param {Object} payload - { customGoal?, status? }
 * @returns {Promise<Object>}
 */
export const updateFocus = async (payload) => {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error('Payload is required to update focus');
  }
  const response = await apiClient.patch(`${FOCUS_BASE}/active`, payload);
  return unwrapFocusResponse(response);
};

/**
 * Completar foco activo
 * @returns {Promise<Object>}
 */
export const completeFocus = async () => {
  const response = await apiClient.post(`${FOCUS_BASE}/active/complete`);
  return unwrapFocusResponse(response);
};

/**
 * Enviar evento de telemetría de interacción con UI de foco
 * @param {Object} event - { eventType, themeId?, metadata? }
 * @returns {Promise<void>}
 */
export const logFocusTelemetry = async (event) => {
  try {
    if (!event || !event.eventType) {
      console.warn('[focusService] eventType is required for telemetry');
      return;
    }
    await apiClient.post(`${FOCUS_BASE}/telemetry`, event);
  } catch (error) {
    console.warn('[focusService] Error logging telemetry:', error.message);
  }
};
