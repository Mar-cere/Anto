/**
 * Utilidades para el check-in de crisis suave (#19) en chat.
 */

const MAX_TEXT_LEN = 500;
const MAX_TECHNIQUES = 4;

function clipText(value, maxLen = MAX_TEXT_LEN) {
  return String(value || '').trim().slice(0, maxLen);
}

export function normalizeSoftCrisisCheckInPayload(raw) {
  if (!raw || typeof raw !== 'object' || raw.active !== true) return null;
  const techniques = Array.isArray(raw.techniques)
    ? raw.techniques
        .filter((t) => t && t.id && t.label && t.screen)
        .slice(0, MAX_TECHNIQUES)
        .map((t) => ({
          id: clipText(t.id, 40),
          label: clipText(t.label, 120),
          screen: clipText(t.screen, 80),
        }))
    : [];
  if (techniques.length === 0) return null;
  return {
    version: clipText(raw.version || '1.0', 16),
    active: true,
    validation: clipText(raw.validation, MAX_TEXT_LEN),
    subtitle: clipText(raw.subtitle, MAX_TEXT_LEN),
    techniques,
    footnote: raw.footnote ? clipText(raw.footnote, MAX_TEXT_LEN) : '',
    dismissible: raw.dismissible !== false,
  };
}

export default {
  normalizeSoftCrisisCheckInPayload,
};
