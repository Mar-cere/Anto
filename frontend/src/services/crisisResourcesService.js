/**
 * Fetch de recursos de crisis (números de emergencia) desde el backend.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getAppLanguage } from '../utils/appLanguage';
import { normalizeCrisisResourcesPayload } from '../utils/crisisResources';
import { resolveEffectiveCountryIso } from '../constants/emergencyCountries';

const FETCH_TIMEOUT_MS = 12_000;

async function resolveCountryQuery() {
  try {
    const raw = await AsyncStorage.getItem('userData');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return resolveEffectiveCountryIso(user?.preferences);
  } catch {
    return null;
  }
}

function sanitizeCountryIso(iso) {
  if (!iso) return null;
  const upper = String(iso).trim().toUpperCase().slice(0, 2);
  return /^[A-Z]{2}$/.test(upper) ? upper : null;
}

/**
 * @param {{ countryIso?: string|null, language?: string, signal?: AbortSignal }} [opts]
 */
export async function fetchCrisisResources({ countryIso = null, language = null, signal = null } = {}) {
  const lang = language || (await getAppLanguage());
  const country = sanitizeCountryIso(countryIso || (await resolveCountryQuery()));
  const params = new URLSearchParams({ language: String(lang).slice(0, 8) });
  if (country) params.set('country', country);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const abortOnParent = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortOnParent, { once: true });
  }

  try {
    const response = await fetch(`${API_URL}/api/health/crisis-resources?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error('crisis_resources_fetch_failed');
    }
    const data = await response.json().catch(() => ({}));
    return normalizeCrisisResourcesPayload(data?.crisisResources);
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', abortOnParent);
  }
}

export default { fetchCrisisResources };
