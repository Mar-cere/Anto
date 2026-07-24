/**
 * Soft landing post-crisis (#225) — normalización de payload cliente.
 */

const MAX_TEXT_LEN = 500;
const MAX_TECHNIQUES = 4;
const ALLOWED_TECHNIQUE_SCREENS = new Set(['BreathingExercise', 'GroundingTechnique']);

function clipText(value, maxLen = MAX_TEXT_LEN) {
  return String(value || '').trim().slice(0, maxLen);
}

export function normalizeSoftLandingPayload(raw) {
  if (!raw || typeof raw !== 'object' || raw.active !== true) return null;

  const stripRaw = raw.strip && typeof raw.strip === 'object' ? raw.strip : null;
  let strip = null;
  if (stripRaw?.active === true) {
    const techniques = Array.isArray(stripRaw.techniques)
      ? stripRaw.techniques
          .filter(
            (t) =>
              t &&
              t.id &&
              t.label &&
              t.screen &&
              ALLOWED_TECHNIQUE_SCREENS.has(String(t.screen)),
          )
          .slice(0, MAX_TECHNIQUES)
          .map((t) => ({
            id: clipText(t.id, 40),
            label: clipText(t.label, 120),
            screen: clipText(t.screen, 80),
          }))
      : [];
    if (techniques.length > 0) {
      strip = {
        version: clipText(stripRaw.version || raw.version || '1.1', 16),
        active: true,
        kicker: clipText(stripRaw.kicker, 80),
        validation: clipText(stripRaw.validation, MAX_TEXT_LEN),
        subtitle: clipText(stripRaw.subtitle, MAX_TEXT_LEN),
        techniques,
        footnote: stripRaw.footnote ? clipText(stripRaw.footnote, MAX_TEXT_LEN) : '',
        dismissible: stripRaw.dismissible !== false,
      };
    }
  }

  return {
    version: clipText(raw.version || '1.1', 16),
    active: true,
    endsAt: raw.endsAt ? clipText(raw.endsAt, 40) : null,
    strip,
  };
}

export function normalizeSoftLandingFocus(raw) {
  if (!raw || typeof raw !== 'object' || raw.active !== true) return null;
  return {
    active: true,
    endsAt: raw.endsAt ? clipText(raw.endsAt, 40) : null,
    message: clipText(raw.message, MAX_TEXT_LEN),
    messageKey: clipText(raw.messageKey || 'SOFT_LANDING_HOME', 64),
  };
}

export default {
  normalizeSoftLandingPayload,
  normalizeSoftLandingFocus,
};
