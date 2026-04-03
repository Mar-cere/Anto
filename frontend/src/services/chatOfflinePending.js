/**
 * Un solo mensaje de chat pendiente cuando no hay red o falla el envío.
 * Sobrescribe el anterior si el usuario intenta guardar otro.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHAT_OFFLINE_PENDING_KEY = 'chatOfflinePendingMessageV1';

const MAX_LEN = 12000;

export async function getOfflinePendingMessage() {
  try {
    const raw = await AsyncStorage.getItem(CHAT_OFFLINE_PENDING_KEY);
    if (!raw || typeof raw !== 'string') return null;
    const t = raw.trim();
    return t.length ? t : null;
  } catch {
    return null;
  }
}

export async function setOfflinePendingMessage(text) {
  const t = typeof text === 'string' ? text.trim() : '';
  if (!t) {
    await clearOfflinePendingMessage();
    return;
  }
  const sliced = t.length > MAX_LEN ? `${t.slice(0, MAX_LEN - 1)}…` : t;
  await AsyncStorage.setItem(CHAT_OFFLINE_PENDING_KEY, sliced);
}

export async function clearOfflinePendingMessage() {
  try {
    await AsyncStorage.removeItem(CHAT_OFFLINE_PENDING_KEY);
  } catch {
    /* noop */
  }
}
