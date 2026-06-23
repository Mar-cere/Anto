/**
 * Detecta si el mensaje actual parece una consulta factual.
 * Se usa para activar un guardrail de precisión en el prompt.
 */

const FACTUAL_PATTERNS = [
  /\bqu[ií]en(?:es)?\s+es\b/i,
  /\bqu[ié]n\s+es\b/i,
  /\bcu[aá]ndo\b/i,
  /\bqu[eé]\s+fecha\b/i,
  /\bcumplea[nñ]os?\b/i,
  /\bfamos[oa]s?\b/i,
  /\blista\s+de\b/i,
  /\bd[aá]me\b.{0,20}\b(?:nombres|famos[oa]s?|fechas)\b/i,
  /\bcapital\s+de\b/i,
  /\bcu[aá]l\s+es\b/i,
  /\bdatos?\b/i,
  /\binformaci[oó]n\s+sobre\b/i
];

const NON_FACTUAL_PATTERNS = [
  /\bme\s+siento\b/i,
  /\bestoy\s+triste\b/i,
  /\bansiedad\b/i,
  /\bme\s+duele\b/i,
  /\bno\s+s[eé]\s+qu[eé]\s+hacer\b/i,
  /\bcuando\s+(?:me|mencionan|hablan|dicen|ven|miran)\b/i,
  /\bme\s+(?:hace|ase)\s+da[nñ]o\b/i,
  /\bmi\s+cara\b/i,
  /\bacn[eé]\b/i,
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * @param {Object} params
 * @param {string} params.currentMessage
 * @returns {boolean}
 */
export function detectFactualModeFromMessage({ currentMessage }) {
  const text = normalizeText(currentMessage);
  if (!text) return false;
  if (NON_FACTUAL_PATTERNS.some((pattern) => pattern.test(text))) return false;
  return FACTUAL_PATTERNS.some((pattern) => pattern.test(text));
}
