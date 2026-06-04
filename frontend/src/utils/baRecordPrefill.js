/** Alineado con backend/services/baRecordPrefillService.js */
export const BA_PREFILL_MAX_ACTIVITY_LENGTH = 280;

/**
 * @param {object|null|undefined} params
 */
export function parseBaRecordRouteParams(params) {
  const raw = params && typeof params === 'object' ? params : {};
  const fromChat = raw.fromChat === true;
  const prefillActivityDescription = fromChat
    ? clampBaField(raw.prefillActivityDescription, BA_PREFILL_MAX_ACTIVITY_LENGTH)
    : '';
  let prefillMoodBefore = null;
  if (fromChat && raw.prefillMoodBefore != null) {
    const n = parseInt(String(raw.prefillMoodBefore), 10);
    if (Number.isFinite(n) && n >= 1 && n <= 10) prefillMoodBefore = n;
  }
  const type = String(raw.prefillActivityType || '').toLowerCase();
  const prefillActivityType =
    fromChat && (type === 'pleasant' || type === 'routine') ? type : null;

  return {
    fromChat,
    prefillActivityDescription,
    prefillMoodBefore,
    prefillActivityType,
  };
}

function clampBaField(value, maxLength) {
  const text = String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}
