/**
 * Cliente API señales multimodales (#215 / #216 / #208).
 */
import { api, ENDPOINTS } from '../config/api';
import { collectDailyPhenotypeSnapshot } from './digitalHealthBridge';

export async function getSignalConsent() {
  const res = await api.get(ENDPOINTS.SIGNALS_CONSENT);
  return res?.data?.consent ?? res?.consent ?? null;
}

export async function updateSignalConsent(patch) {
  const res = await api.patch(ENDPOINTS.SIGNALS_CONSENT, patch);
  return res?.data?.consent ?? res?.consent ?? null;
}

export async function submitTypingTelemetry({ conversationId = null, sessionId = null, metrics }) {
  if (!metrics) return null;
  const res = await api.post(ENDPOINTS.SIGNALS_TYPING_TELEMETRY, {
    conversationId,
    sessionId,
    metrics,
  });
  return res?.data ?? res;
}

export async function syncDigitalPhenotype(payload = null) {
  const snapshot = payload || (await collectDailyPhenotypeSnapshot());
  if (!snapshot) return { synced: false };
  const res = await api.post(ENDPOINTS.SIGNALS_DIGITAL_PHENOTYPE_SYNC, snapshot);
  return res?.data ?? res;
}

export async function fetchWeeklyInsight({ weekKey = null } = {}) {
  const res = await api.get(ENDPOINTS.SIGNALS_WEEKLY_INSIGHT, {
    params: weekKey ? { weekKey } : undefined,
  });
  return res?.data ?? res;
}

export async function scheduleWeeklyInsight({ weekKey = null } = {}) {
  const res = await api.post(ENDPOINTS.SIGNALS_WEEKLY_INSIGHT_SCHEDULE, { weekKey });
  return res?.data ?? res;
}

export default {
  getSignalConsent,
  updateSignalConsent,
  submitTypingTelemetry,
  syncDigitalPhenotype,
  fetchWeeklyInsight,
  scheduleWeeklyInsight,
};
