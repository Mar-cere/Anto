/**
 * Detecta si el usuario pidió respuestas breves en la sesión actual.
 * Recorre desde el mensaje más reciente hacia atrás para respetar
 * la última preferencia explícita ("breve" vs "más detalle").
 */

const SHORT_REQUEST_PATTERNS = [
  /\b(?:se|sé)\s+breve\b/i,
  /\b(?:responde|contesta|habla)\s+(?:más\s+)?(?:breve|corto|corta)\b/i,
  /\b(?:mensaje|mensajes|texto|textos)\s+(?:más\s+)?(?:breve|breves|corto|cortos)\b/i,
  /\bno\s+me\s+(?:mandes|env[ií]es)\s+(?:mensajes|textos)\s+tan\s+largos?\b/i,
  /\bsolo\s+una\s+frase\b/i,
  /\bpocas\s+palabras\b/i
];

const DETAIL_REQUEST_PATTERNS = [
  /\b(?:con|en)\s+detalle\b/i,
  /\bm[aá]s\s+detalle\b/i,
  /\bexpl[ií]ca(?:me|melo)?\s+bien\b/i,
  /\bpuedes\s+explayarte\b/i,
  /\bm[aá]s\s+largo\b/i,
  /\brespuesta\s+(?:larga|m[aá]s\s+larga)\b/i
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function asksForShort(text) {
  return SHORT_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
}

function asksForDetail(text) {
  return DETAIL_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * @param {Object} params
 * @param {string} params.currentMessage
 * @param {Array<{role?: string, content?: string}>} params.conversationHistoryNewestFirst
 * @param {number} [params.maxUserMessagesToScan=14]
 * @returns {boolean}
 */
export function detectShortModeFromSession({
  currentMessage,
  conversationHistoryNewestFirst,
  maxUserMessagesToScan = 14
}) {
  const candidates = [];
  if (currentMessage) {
    candidates.push(currentMessage);
  }
  if (Array.isArray(conversationHistoryNewestFirst)) {
    const recentUserMessages = conversationHistoryNewestFirst
      .filter((msg) => msg?.role === 'user' && msg?.content)
      .slice(0, maxUserMessagesToScan)
      .map((msg) => msg.content);
    candidates.push(...recentUserMessages);
  }

  for (const rawText of candidates) {
    const text = normalizeText(rawText);
    if (!text) continue;
    if (asksForDetail(text)) return false;
    if (asksForShort(text)) return true;
  }
  return false;
}
