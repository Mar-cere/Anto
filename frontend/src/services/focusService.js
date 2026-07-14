/**
 * Servicio de focos de acompañamiento (#2) - Cliente API
 */
import apiClient from '../config/api';

/**
 * Obtener temas de foco disponibles
 * @returns {Promise<Object>} - { success, data: [...themes] }
 */
export const getFocusThemes = async () => {
  const response = await apiClient.get('/focus/themes');
  return response.data;
};

/**
 * Obtener foco activo del usuario
 * @returns {Promise<Object>} - { success, data: activeFocus }
 */
export const getActiveFocus = async () => {
  const response = await apiClient.get('/focus/active');
  return response.data;
};

/**
 * Iniciar un nuevo foco
 * @param {Object} payload - { themeId, durationWeeks?, customGoal? }
 * @returns {Promise<Object>} - { success, data: activeFocus }
 * @throws {Error} Si themeId no está presente o es inválido
 */
export const startFocus = async (payload) => {
  if (!payload || !payload.themeId) {
    throw new Error('themeId is required to start a focus');
  }
  const response = await apiClient.post('/focus/active', payload);
  return response.data;
};

/**
 * Actualizar foco activo
 * @param {Object} payload - { customGoal?, status? }
 * @returns {Promise<Object>} - { success, data: activeFocus }
 */
export const updateFocus = async (payload) => {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error('Payload is required to update focus');
  }
  const response = await apiClient.patch('/focus/active', payload);
  return response.data;
};

/**
 * Completar foco activo
 * @returns {Promise<Object>} - { success, data: completedFocus }
 */
export const completeFocus = async () => {
  const response = await apiClient.post('/focus/active/complete');
  return response.data;
};

/**
 * Enviar evento de telemetría de interacción con UI de foco
 * @param {Object} event - { eventType, themeId?, metadata? }
 * @returns {Promise<void>}
 */
export const logFocusTelemetry = async (event) => {
  try {
    // Validación básica
    if (!event || !event.eventType) {
      console.warn('[focusService] eventType is required for telemetry');
      return;
    }
    
    await apiClient.post('/focus/telemetry', event);
  } catch (error) {
    // No bloquear la operación principal si falla la telemetría
    console.warn('[focusService] Error logging telemetry:', error.message);
  }
};
