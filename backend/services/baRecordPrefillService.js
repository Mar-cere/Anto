/**
 * Prefill de activación conductual (#88) desde mensaje de chat.
 * Sugiere actividad mínima + ánimo inicial (sin copiar metadatos de chat).
 */
import { sanitizeAbcPrefillText } from './abcRecordPrefillService.js';

export const BA_PREFILL_MAX_ACTIVITY_LENGTH = 280;

const INTENSITY_PATTERNS = [
  /\b(\d{1,2})\s*\/\s*10\b/i,
  /\b(\d{1,2})\s+out\s+of\s+10\b/i,
  /\b(?:un|de|a)\s+(\d{1,2})\s+de\s+10\b/i,
];

const EMOTION_OPENER =
  /^(?:me\s+siento|estoy|me\s+encuentro|i\s+feel|i\s+am|i'?m)\s+/i;

const ROUTINE_HINT =
  /(?:duchar|ducha|shower|lavar|limpiar|correo|email|trabajo|work|tarea|chore|hacer\s+la\s+cama|make\s+(?:the\s+)?bed)/i;

const ISOLATION_HINT =
  /(?:sin\s+salir|no\s+salgo|no\s+salg|sin\s+salir\s+de|no\s+salgo\s+de|quedarme\s+en\s+casa|stay(?:ing)?\s+(?:at\s+)?home|haven'?t\s+left|not\s+left\s+home|aislad|isolat)/i;

const LOW_ENERGY_HINT =
  /(?:sin\s+ganas|sin\s+energ[ií]a|no\s+hago\s+nada|ap[aá]tic|desmotivad|no\s+motivation|feel\s+numb|can'?t\s+get\s+(?:out\s+of\s+bed|started))/i;

const MICRO_ACTIVITY = {
  es: {
    isolation: 'Dar un paseo corto (5–10 min) cerca de casa',
    lowEnergy: 'Una acción mínima en casa (ducha, abrir ventana o un mensaje)',
    default: 'Elegir una acción pequeña y concreta (5–10 min)',
  },
  en: {
    isolation: 'Take a short walk (5–10 min) near home',
    lowEnergy: 'One small action at home (shower, open a window, or send a message)',
    default: 'Pick one small, concrete action (5–10 min)',
  },
};

function resolveLanguage(language = 'es') {
  return String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}

function clampActivity(text, maxLength = BA_PREFILL_MAX_ACTIVITY_LENGTH) {
  const value = sanitizeAbcPrefillText(String(text || '').replace(/^["'«]+|["'»]+$/g, ''));
  if (!value || value.length < 3) return null;
  if (value.length > maxLength) {
    return `${value.slice(0, maxLength - 1).trim()}…`;
  }
  return value;
}

/**
 * @param {string} userContent
 * @returns {number|null}
 */
export function extractMoodBeforeFromMessage(userContent = '') {
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
 * @param {string} [language='es']
 * @returns {string|null}
 */
export function suggestMicroActivityFromMessage(userContent = '', language = 'es') {
  const lang = resolveLanguage(language);
  const copy = MICRO_ACTIVITY[lang];
  const text = sanitizeAbcPrefillText(
    String(userContent || '').replace(/\b\d{1,2}\s*\/\s*10\b/gi, ''),
  );
  if (!text) return null;

  if (ISOLATION_HINT.test(text)) return clampActivity(copy.isolation);
  if (LOW_ENERGY_HINT.test(text)) return clampActivity(copy.lowEnergy);
  return null;
}

/**
 * @param {string} userContent
 * @returns {'pleasant'|'routine'|null}
 */
export function inferActivityTypeFromMessage(userContent = '') {
  const text = sanitizeAbcPrefillText(userContent);
  if (!text) return null;
  if (ROUTINE_HINT.test(text)) return 'routine';
  if (LOW_ENERGY_HINT.test(text) || ISOLATION_HINT.test(text)) return 'pleasant';
  return null;
}

/**
 * @param {string} userContent
 * @param {string} [language='es']
 * @returns {{ prefillActivityDescription?: string, prefillMoodBefore?: number, prefillActivityType?: string }|null}
 */
export function buildBaPrefillParams(userContent = '', language = 'es') {
  const lang = resolveLanguage(language);
  const text = sanitizeAbcPrefillText(userContent);
  if (!text) return null;

  const prefillActivityDescription = suggestMicroActivityFromMessage(userContent, lang);
  const prefillMoodBefore = extractMoodBeforeFromMessage(userContent);
  const prefillActivityType = inferActivityTypeFromMessage(userContent);

  const params = {};
  if (prefillActivityDescription) params.prefillActivityDescription = prefillActivityDescription;
  if (prefillMoodBefore != null) params.prefillMoodBefore = prefillMoodBefore;
  if (prefillActivityType) params.prefillActivityType = prefillActivityType;

  if (Object.keys(params).length === 0) return null;
  return params;
}

/**
 * @param {Array<object>} formatted
 * @param {string} userContent
 * @param {string} [language='es']
 */
export function enrichSuggestionsWithBaPrefill(formatted = [], userContent = '', language = 'es') {
  if (!Array.isArray(formatted) || formatted.length === 0) return formatted;
  if (!formatted.some((s) => s?.id === 'behavioral_activation')) return formatted;

  const prefill = buildBaPrefillParams(userContent, language);
  if (!prefill) return formatted;

  return formatted.map((suggestion) => {
    if (suggestion?.id !== 'behavioral_activation') return suggestion;
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
