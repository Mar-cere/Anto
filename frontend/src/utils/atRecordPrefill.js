/** Alineado con backend/services/atRecordPrefillService.js */
export const AT_PREFILL_MAX_FIELD_LENGTH = 500;

/**
 * @param {object|null|undefined} params
 */
export function parseAtRecordRouteParams(params) {
  const raw = params && typeof params === 'object' ? params : {};
  const fromChat = raw.fromChat === true;
  const prefillSituation = fromChat
    ? clampAtField(raw.prefillSituation, AT_PREFILL_MAX_FIELD_LENGTH)
    : '';
  const prefillAutomaticThought = fromChat
    ? clampAtField(raw.prefillAutomaticThought, AT_PREFILL_MAX_FIELD_LENGTH)
    : '';
  let prefillEmotionIntensity = null;
  if (fromChat && raw.prefillEmotionIntensity != null) {
    const n = parseInt(String(raw.prefillEmotionIntensity), 10);
    if (Number.isFinite(n) && n >= 1 && n <= 10) prefillEmotionIntensity = n;
  }
  const distortionType = fromChat ? String(raw.prefillDistortionType || '').trim() : '';
  const prefillDistortionType = /^[a-z_]+$/.test(distortionType) ? distortionType : '';
  const prefillDistortionName = fromChat
    ? clampAtField(raw.prefillDistortionName, 200)
    : '';

  return {
    fromChat,
    prefillSituation,
    prefillAutomaticThought,
    prefillEmotionIntensity,
    prefillDistortionType,
    prefillDistortionName,
  };
}

function clampAtField(value, maxLength) {
  const text = String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}
