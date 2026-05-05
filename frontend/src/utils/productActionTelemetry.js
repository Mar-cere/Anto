/**
 * Telemetría fire-and-forget §8 (dismiss modal, fallo creación en flujo chat).
 */
import { api, ENDPOINTS } from '../config/api';

/**
 * @param {{ event: 'confirm_dismissed' | 'create_failed'; surface: 'task_modal' | 'habit_modal'; resource?: 'task' | 'habit' }} payload
 */
export function postProductActionTelemetry(payload) {
  return api.post(ENDPOINTS.METRICS_PRODUCT_ACTION, payload).catch((e) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[productActionTelemetry]', e?.message || e);
    }
  });
}
