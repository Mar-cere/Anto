/**
 * Cliente API señales multimodales (#215 / #216 / #208).
 */
import { api, ENDPOINTS } from '../config/api';
import { collectDailyPhenotypeSnapshot } from './digitalHealthBridge';
import { normalizeMonthKey, getPreviousMonthKey } from '../utils/monthKeys';

export async function getSignalConsent() {
  const res = await api.get(ENDPOINTS.SIGNALS_CONSENT);
  return res?.data?.consent ?? res?.consent ?? null;
}

export async function updateSignalConsent(patch) {
  const res = await api.patch(ENDPOINTS.SIGNALS_CONSENT, patch);
  return res?.data?.consent ?? res?.consent ?? null;
}

export async function submitTypingTelemetry({ conversationId = null, sessionId = null, metrics }) {
  if (!metrics || Number(metrics.draftDurationMs) < 400) return null;
  try {
    const res = await api.post(ENDPOINTS.SIGNALS_TYPING_TELEMETRY, {
      conversationId,
      sessionId,
      metrics,
    });
    return res?.data ?? res;
  } catch (error) {
    if (error?.response?.status === 403) return null;
    throw error;
  }
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

export async function fetchMonthlyInsight({ monthKey = null } = {}) {
  const key = normalizeMonthKey(monthKey, getPreviousMonthKey());
  if (!key) {
    throw new Error('monthKey_required');
  }
  const res = await api.get(ENDPOINTS.SIGNALS_MONTHLY_INSIGHT, {
    params: { monthKey: key },
  });
  return res?.data ?? res;
}

export default {
  getSignalConsent,
  updateSignalConsent,
  submitTypingTelemetry,
  syncDigitalPhenotype,
  fetchWeeklyInsight,
  fetchMonthlyInsight,
  scheduleWeeklyInsight,
};
