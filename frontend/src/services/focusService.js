/**
 * Servicio de focos de acompañamiento (#2) - Cliente API
 */
import apiClient from '../config/api';

/**
 * Obtener temas de foco disponibles
 */
export const getFocusThemes = async () => {
  const response = await apiClient.get('/focus/themes');
  return response.data;
};

/**
 * Obtener foco activo del usuario
 */
export const getActiveFocus = async () => {
  const response = await apiClient.get('/focus/active');
  return response.data;
};

/**
 * Iniciar un nuevo foco
 * @param {Object} payload - { themeId, durationWeeks?, customGoal? }
 */
export const startFocus = async (payload) => {
  const response = await apiClient.post('/focus/active', payload);
  return response.data;
};

/**
 * Actualizar foco activo
 * @param {Object} payload - { customGoal?, status? }
 */
export const updateFocus = async (payload) => {
  const response = await apiClient.patch('/focus/active', payload);
  return response.data;
};

/**
 * Completar foco activo
 */
export const completeFocus = async () => {
  const response = await apiClient.post('/focus/active/complete');
  return response.data;
};
