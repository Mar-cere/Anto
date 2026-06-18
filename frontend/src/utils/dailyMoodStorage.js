import AsyncStorage from '@react-native-async-storage/async-storage';

export const MOOD_OPTIONS = ['calm', 'anxious', 'tired', 'good'];

const MOOD_KEY_PREFIX = '@anto/dailyMood:';
const MOOD_PAYLOAD_PREFIX = '@anto/dailyMoodPayload:';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function moodStorageKey() {
  return `${MOOD_KEY_PREFIX}${todayKey()}`;
}

function moodPayloadStorageKey() {
  return `${MOOD_PAYLOAD_PREFIX}${todayKey()}`;
}

/** @deprecated Usar loadCachedTodayMoodPayload */
export async function loadTodayMood() {
  const payload = await loadCachedTodayMoodPayload();
  return payload?.mood ?? null;
}

/** @deprecated Usar cacheTodayMoodPayload vía dailyMoodService */
export async function saveTodayMood(mood) {
  if (!MOOD_OPTIONS.includes(mood)) return;
  try {
    await AsyncStorage.setItem(moodStorageKey(), mood);
  } catch {
    /* noop */
  }
}

/**
 * @returns {Promise<import('../types/dailyMood.types').DailyMoodCheckIn|null>}
 */
export async function loadCachedTodayMoodPayload() {
  try {
    const raw = await AsyncStorage.getItem(moodPayloadStorageKey());
    if (!raw) {
      const legacy = await AsyncStorage.getItem(moodStorageKey());
      if (MOOD_OPTIONS.includes(legacy)) {
        return { mood: legacy };
      }
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.mood || !MOOD_OPTIONS.includes(parsed.mood)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {import('../types/dailyMood.types').DailyMoodCheckIn} payload
 */
export async function cacheTodayMoodPayload(payload) {
  if (!payload?.mood || !MOOD_OPTIONS.includes(payload.mood)) return;
  try {
    await AsyncStorage.multiSet([
      [moodStorageKey(), payload.mood],
      [moodPayloadStorageKey(), JSON.stringify(payload)],
    ]);
  } catch {
    /* noop */
  }
}
