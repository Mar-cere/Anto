/**
 * Parseo defensivo de valores guardados en AsyncStorage (JSON corrupto o tipos inesperados).
 */

/**
 * @param {string|null|undefined} raw
 * @returns {{ summaryText: string, messageCount: number }|null}
 */
export function parseGuestHandoffPendingFromStorage(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const summaryText = parsed.summaryText;
  if (typeof summaryText !== 'string' || summaryText.trim() === '') return null;
  let messageCount = 0;
  if (parsed.messageCount != null) {
    const n = Number(parsed.messageCount);
    if (Number.isFinite(n) && n >= 0) messageCount = Math.min(Math.floor(n), 1_000_000);
  }
  return { summaryText: summaryText.trim(), messageCount };
}

/**
 * @param {string|null|undefined} raw — valor de la clave userData
 * @returns {string|null} id de usuario para WebSocket u otros usos
 */
/**
 * @param {string|null|undefined} raw — valor de chatMessages en AsyncStorage
 * @returns {unknown[]} solo arrays; entradas no objeto se omiten
 */
export function parseChatMessagesArrayFromStorage(raw) {
  if (raw == null || typeof raw !== 'string') return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => item != null && typeof item === 'object' && !Array.isArray(item));
}

export function parseUserIdFromUserDataStorage(raw) {
  if (raw == null || typeof raw !== 'string' || raw.trim() === '') return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const id = parsed._id ?? parsed.id;
  if (id == null) return null;
  const s = String(id).trim();
  return s.length > 0 ? s : null;
}
