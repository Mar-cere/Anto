/**
 * Dismiss persistente del strip de continuidad TCC (#127 / chat↔ejercicios).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tcc_continuity_dismissed_v1';
const MAX_IDS = 24;

export async function loadDismissedContinuityIds() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((id) => String(id || '').trim())
      .filter((id) => id.length > 0 && id.length <= 120)
      .slice(0, MAX_IDS);
  } catch {
    return [];
  }
}

export async function persistDismissedContinuityId(itemId) {
  const id = String(itemId || '').trim();
  if (!id || id.length > 120) return;
  const current = await loadDismissedContinuityIds();
  if (current.includes(id)) return;
  const next = [id, ...current].slice(0, MAX_IDS);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
}
