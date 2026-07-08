/**
 * Telemetría fire-and-forget de compromisos (#202 v1.1).
 */
import { api, ENDPOINTS } from '../config/api';

/**
 * @param {{
 *   event: 'create_dismissed' | 'bridge_dismissed' | 'follow_up_shown';
 *   surface: 'chat' | 'task_modal' | 'habit_modal' | 'session_insight' | 'dashboard';
 * }} payload
 */
export function postCommitmentTelemetry(payload) {
  return api.post(ENDPOINTS.METRICS_COMMITMENT, payload).catch((e) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[commitmentTelemetry]', e?.message || e);
    }
  });
}
