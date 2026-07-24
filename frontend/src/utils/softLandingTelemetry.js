/**
 * Telemetría fire-and-forget soft landing (#225 v1.1).
 */
import { api, ENDPOINTS } from '../config/api';

/**
 * @param {{
 *   event: 'regulation_tap';
 *   techniqueId: 'breathing' | 'grounding';
 *   surface?: 'chat_strip';
 * }} payload
 */
export function postSoftLandingTelemetry(payload) {
  return api.post(ENDPOINTS.METRICS_SOFT_LANDING, payload).catch((e) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[softLandingTelemetry]', e?.message || e);
    }
  });
}
