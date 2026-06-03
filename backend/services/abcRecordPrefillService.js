/**
 * Prefill del autorregistro ABC (#86) desde el mensaje del chat.
 * A = situación activadora (sin intensidad ni metadatos de chat).
 */

const MAX_ACTIVATING_LENGTH = 500;

/** Elimina caracteres de control; mantiene saltos implícitos como espacio. */
export function sanitizeAbcPrefillText(text = '') {
  return String(text || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INTENSITY_PATTERNS = [
  /\b\d{1,2}\s*\/\s*10\b/gi,
  /\b(?:un|de|a)\s+\d{1,2}\s+de\s+10\b/gi,
  /\b\d{1,2}\s+out\s+of\s+10\b/gi,
  /\b(?:intensidad|nivel|dir[ií]a)\s*[:\s]*\d{1,2}\b/gi,
];

const SITUATION_HINT =
  /(?:despu[eé]s\s+de|cuando|when|after|durante|during|en\s+la|at\s+the|discuti|reuni[oó]n|meeting|pareja|partner|jefe|boss|trabajo|work|familia|family)/i;

const AFTER_PREFIX =
  /^(?:despu[eé]s\s+de|after|cuando|when)\s+/i;

const THOUGHT_PREFIX =
  /^(?:noto\s+que|me\s+doy\s+cuenta\s+de\s+que|creo\s+que|pienso\s+que|siento\s+que|i\s+(?:notice|realize|think|feel)\s+that)\s+/i;

/**
 * @param {string} userContent
 * @returns {string|null}
 */
export function extractActivatingEventFromMessage(userContent = '') {
  let text = sanitizeAbcPrefillText(userContent);
  if (!text) return null;

  INTENSITY_PATTERNS.forEach((pattern) => {
    text = text.replace(pattern, '');
  });
  text = text.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
  if (!text) return null;

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let candidate = sentences.find((s) => SITUATION_HINT.test(s)) || null;

  if (!candidate && sentences.length > 1) {
    const emotionOpener =
      /^(?:me\s+siento|estoy|me\s+encuentro|i\s+feel|i\s+am|i'?m)\s+/i;
    if (emotionOpener.test(sentences[0])) {
      candidate = sentences.slice(1).join(' ').trim();
    }
  }

  if (!candidate) candidate = text;

  candidate = candidate.replace(THOUGHT_PREFIX, '').trim();

  const afterMatch = candidate.match(
    /(?:despu[eé]s\s+de|after|cuando|when)\s+(.+?)(?:[.!?]|$)/i,
  );
  if (afterMatch?.[1]) {
    candidate = afterMatch[1].trim();
  }

  candidate = candidate.replace(AFTER_PREFIX, '').trim();
  candidate = sanitizeAbcPrefillText(
    candidate.replace(/^["'«]+|["'»]+$/g, ''),
  );

  if (candidate.length > MAX_ACTIVATING_LENGTH) {
    candidate = `${candidate.slice(0, MAX_ACTIVATING_LENGTH - 1).trim()}…`;
  }

  return candidate.length >= 3 ? candidate : null;
}

/**
 * @param {string} userContent
 * @returns {{ prefillActivatingEvent: string }|null}
 */
export function buildAbcPrefillParams(userContent = '') {
  const prefillActivatingEvent = extractActivatingEventFromMessage(userContent);
  if (!prefillActivatingEvent) return null;
  return { prefillActivatingEvent };
}

/**
 * @param {Array<object>} formatted
 * @param {string} userContent
 */
export function enrichSuggestionsWithAbcPrefill(formatted = [], userContent = '') {
  if (!Array.isArray(formatted) || formatted.length === 0) return formatted;
  if (!formatted.some((s) => s?.id === 'abc_record')) return formatted;

  const prefill = buildAbcPrefillParams(userContent);
  if (!prefill) return formatted;

  return formatted.map((suggestion) => {
    if (suggestion?.id !== 'abc_record') return suggestion;
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
