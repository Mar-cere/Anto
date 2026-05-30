import { API_URL, ENDPOINTS } from '../config/api';
import { DEFAULT_APP_TRIAL_DAYS } from '../constants/subscription';

let cachedTrialDays = null;

/**
 * Días de trial configurados en el servidor (APP_TRIAL_DAYS).
 * @returns {Promise<number>}
 */
export async function fetchAppTrialDays() {
  if (cachedTrialDays != null) {
    return cachedTrialDays;
  }
  try {
    const res = await fetch(`${API_URL}${ENDPOINTS.HEALTH_APP_CONFIG}`);
    if (!res.ok) {
      return DEFAULT_APP_TRIAL_DAYS;
    }
    const data = await res.json();
    const days = parseInt(data?.trialDays, 10);
    if (Number.isFinite(days) && days >= 1) {
      cachedTrialDays = days;
      return days;
    }
  } catch {
    // offline / health no disponible
  }
  return DEFAULT_APP_TRIAL_DAYS;
}

/** Solo tests: limpiar caché en memoria. */
export function clearAppConfigCache() {
  cachedTrialDays = null;
}
