/**
 * Prefill de pensamiento automático (#89) desde mensaje de chat.
 * Reutiliza extracción ABC + detección de distorsiones existente.
 */
import {
  extractActivatingEventFromMessage,
  extractBeliefsFromMessage,
  sanitizeAbcPrefillText,
} from './abcRecordPrefillService.js';
import cognitiveDistortionDetector from './cognitiveDistortionDetector.js';

const INTENSITY_PATTERNS = [
  /\b(\d{1,2})\s*\/\s*10\b/i,
  /\b(\d{1,2})\s+out\s+of\s+10\b/i,
  /\b(?:un|de|a)\s+(\d{1,2})\s+de\s+10\b/i,
];

/**
 * @param {string} userContent
 * @returns {number|null}
 */
export function extractEmotionIntensityFromMessage(userContent = '') {
  const text = String(userContent || '');
  for (const pattern of INTENSITY_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n) && n >= 1 && n <= 10) return n;
    }
  }
  return null;
}

/**
 * @param {string} userContent
 * @returns {{ type?: string, name?: string }|null}
 */
export function suggestDistortionFromMessage(userContent = '') {
  const text = sanitizeAbcPrefillText(userContent);
  if (!text) return null;
  const primary = cognitiveDistortionDetector.getPrimaryDistortion(text);
  if (!primary?.type) return null;
  return {
    type: primary.type,
    name: primary.name,
  };
}

/**
 * @param {string} userContent
 * @returns {{ prefillSituation?: string, prefillAutomaticThought?: string, prefillEmotionIntensity?: number, prefillDistortionType?: string, prefillDistortionName?: string }|null}
 */
export function buildAtPrefillParams(userContent = '') {
  const prefillSituation = extractActivatingEventFromMessage(userContent);
  const prefillAutomaticThought = extractBeliefsFromMessage(userContent);
  const prefillEmotionIntensity = extractEmotionIntensityFromMessage(userContent);
  const distortion = suggestDistortionFromMessage(userContent);

  const params = {};
  if (prefillSituation) params.prefillSituation = prefillSituation;
  if (prefillAutomaticThought) params.prefillAutomaticThought = prefillAutomaticThought;
  if (prefillEmotionIntensity != null) params.prefillEmotionIntensity = prefillEmotionIntensity;
  if (distortion?.type) {
    params.prefillDistortionType = distortion.type;
    if (distortion.name) params.prefillDistortionName = distortion.name;
  }

  if (Object.keys(params).length === 0) return null;
  return params;
}

/**
 * @param {Array<object>} formatted
 * @param {string} userContent
 */
export function enrichSuggestionsWithAtPrefill(formatted = [], userContent = '') {
  if (!Array.isArray(formatted) || formatted.length === 0) return formatted;
  if (!formatted.some((s) => s?.id === 'automatic_thought_record')) return formatted;

  const prefill = buildAtPrefillParams(userContent);
  if (!prefill) return formatted;

  return formatted.map((suggestion) => {
    if (suggestion?.id !== 'automatic_thought_record') return suggestion;
    return {
      ...suggestion,
      params: {
        ...(suggestion.params || {}),
        ...prefill,
        fromChat: true,
      },
    };
  });
}
