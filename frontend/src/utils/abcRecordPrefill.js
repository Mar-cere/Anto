/** Límite alineado con backend/services/abcRecordPrefillService.js */
export const ABC_PREFILL_MAX_LENGTH = 500;

/**
 * Normaliza params de navegación hacia AbcRecord (defensivo).
 * @param {object|null|undefined} params
 */
export function parseAbcRecordRouteParams(params) {
  const raw = params && typeof params === 'object' ? params : {};
  const fromChat = raw.fromChat === true;
  const prefillActivatingEvent = clampAbcPrefillField(raw.prefillActivatingEvent);
  const prefillBeliefs = clampAbcPrefillField(raw.prefillBeliefs);
  return {
    fromChat,
    prefillActivatingEvent: fromChat ? prefillActivatingEvent : '',
    prefillBeliefs: fromChat ? prefillBeliefs : '',
  };
}

function clampAbcPrefillField(value) {
  const text = String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= ABC_PREFILL_MAX_LENGTH) return text;
  return `${text.slice(0, ABC_PREFILL_MAX_LENGTH - 1).trim()}…`;
}
