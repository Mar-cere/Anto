import { api, ENDPOINTS } from '../config/api';
import {
  cacheTodayMoodPayload,
  loadCachedTodayMoodPayload,
  MOOD_OPTIONS,
} from '../utils/dailyMoodStorage';

export { MOOD_OPTIONS };

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<import('../types/dailyMood.types').DailyMoodCheckIn|null>}
 */
export async function fetchTodayMoodCheckIn() {
  try {
    const tz = deviceTimezone();
    const query = tz ? `?timezone=${encodeURIComponent(tz)}` : '';
    const res = await api.get(`${ENDPOINTS.DAILY_MOOD_TODAY}${query}`);
    const checkIn = res?.checkIn ?? null;
    if (checkIn?.mood) {
      await cacheTodayMoodPayload(checkIn);
      return checkIn;
    }
    const cached = await loadCachedTodayMoodPayload();
    return cached;
  } catch {
    return loadCachedTodayMoodPayload();
  }
}

/**
 * @param {string} mood
 * @returns {Promise<import('../types/dailyMood.types').DailyMoodCheckIn|null>}
 */
export async function saveTodayMoodCheckIn(mood) {
  if (!MOOD_OPTIONS.includes(mood)) return null;
  try {
    const res = await api.put(ENDPOINTS.DAILY_MOOD_TODAY, {
      mood,
      timezone: deviceTimezone(),
    });
    const checkIn = res?.checkIn ?? null;
    if (checkIn?.mood) {
      await cacheTodayMoodPayload(checkIn);
      return checkIn;
    }
    return null;
  } catch {
    return null;
  }
}
