/**
 * Prefill del autorregistro ABC (#86) desde el mensaje del chat.
 * A = situación activadora, B = pensamientos (sin intensidad ni metadatos de chat).
 */

const MAX_ACTIVATING_LENGTH = 500;
const MAX_BELIEFS_LENGTH = 500;

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

function stripIntensityMarkers(text = '') {
  let out = sanitizeAbcPrefillText(text);
  INTENSITY_PATTERNS.forEach((pattern) => {
    out = out.replace(pattern, '');
  });
  return out.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
}

function clampPrefillField(text, maxLength) {
  let value = sanitizeAbcPrefillText(String(text || '').replace(/^["'«]+|["'»]+$/g, ''));
  if (!value) return null;
  if (value.length > maxLength) {
    value = `${value.slice(0, maxLength - 1).trim()}…`;
  }
  return value;
}

/**
 * @param {string} userContent
 * @returns {string|null}
 */
export function extractActivatingEventFromMessage(userContent = '') {
  let text = stripIntensityMarkers(userContent);
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
  const result = clampPrefillField(candidate, MAX_ACTIVATING_LENGTH);
  return result && result.length >= 3 ? result : null;
}

const BELIEF_EXTRACTION_PATTERNS = [
  {
    pattern:
      /(?:noto\s+que|me\s+doy\s+cuenta\s+de\s+que|creo\s+que|pienso\s+que|siento\s+que|i\s+(?:notice|realize|think|feel)\s+that)\s+(.+?)(?:\s+despu[eé]s\s+de|\s+after|\s+when|\s+cuando|[.!?]|$)/i,
    minLength: 5,
  },
  {
    pattern:
      /(?:siempre\s+pienso|keep\s+(?:on\s+)?thinking(?:\s+the)?|can'?t\s+stop\s+thinking(?:\s+the)?)\s+(.+?)(?:\s+despu[eé]s|\s+after|[.!?]|$)/i,
    minLength: 5,
  },
  {
    pattern:
      /(?:repaso|going\s+over)\s+(?:una\s+y\s+otra\s+vez\s+)?(?:cómo|how|that)\s+(.+?)(?:[.!?]|$)/i,
    minLength: 8,
  },
  {
    pattern:
      /(?:me\s+dij[eé]\s+a\s+m[ií]\s+mismo|me\s+digo\s+a\s+m[ií]\s+mismo|i\s+tell\s+myself)\s+(.+?)(?:[.!?]|$)/i,
    minLength: 5,
  },
];

/**
 * @param {string} userContent
 * @returns {string|null}
 */
export function extractBeliefsFromMessage(userContent = '') {
  const text = stripIntensityMarkers(userContent);
  if (!text) return null;

  const quoted = text.match(/[«"']([^«"']{5,500})[»"']/);
  if (quoted?.[1]) {
    const fromQuote = clampPrefillField(quoted[1], MAX_BELIEFS_LENGTH);
    if (fromQuote && fromQuote.length >= 5) return fromQuote;
  }

  for (const { pattern, minLength } of BELIEF_EXTRACTION_PATTERNS) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const belief = clampPrefillField(
      match[1].replace(/^(?:que\s+|that\s+)/i, ''),
      MAX_BELIEFS_LENGTH,
    );
    if (belief && belief.length >= minLength) return belief;
  }

  const compactWorst = text.match(
    /((?:siempre\s+)?pienso\s+lo\s+peor|(?:keep\s+(?:on\s+)?)?thinking\s+the\s+worst)/i,
  );
  if (compactWorst?.[1]) {
    const belief = clampPrefillField(compactWorst[1], MAX_BELIEFS_LENGTH);
    if (belief && belief.length >= 5) return belief;
  }

  return null;
}

/**
 * @param {string} userContent
 * @returns {{ prefillActivatingEvent?: string, prefillBeliefs?: string }|null}
 */
export function buildAbcPrefillParams(userContent = '') {
  const prefillActivatingEvent = extractActivatingEventFromMessage(userContent);
  const prefillBeliefs = extractBeliefsFromMessage(userContent);
  if (!prefillActivatingEvent && !prefillBeliefs) return null;
  return {
    ...(prefillActivatingEvent ? { prefillActivatingEvent } : {}),
    ...(prefillBeliefs ? { prefillBeliefs } : {}),
  };
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
