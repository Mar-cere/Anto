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

/** Peticiones explícitas de consejos, tips o pasos prácticos. */
const EXPANDED_REQUEST_PATTERNS = [
  /\b(?:m[aá]s\s+)?tips?\b/i,
  /\b(?:m[aá]s\s+)?consejos?\b/i,
  /\b(?:m[aá]s\s+)?ideas?\b/i,
  /\b(?:qu[eé]\s+)?(?:puedo|debo)\s+hacer\b/i,
  /\b(?:c[oó]mo\s+puedo|ay[uú]dame\s+a)\b/i,
  /\b(?:paso\s+a\s+paso|en\s+pr[aá]ctica)\b/i,
  /\b(?:poner(?:lo)?\s+en\s+pr[aá]ctica|ir\s+probando)\b/i,
  /\b(?:dame|danos|d[aá]me)\s+(?:m[aá]s\s+)?(?:tips?|consejos?|ideas?)\b/i
];

export const RESPONSE_LENGTH_PROFILES = {
  short: { maxChars: 180, maxWords: 30, maxSentencesReduce: 2 },
  default: { maxChars: 400, maxWords: 50, maxSentencesReduce: 2 },
  highLoad: { maxChars: 560, maxWords: 72, maxSentencesReduce: 3 },
  expanded: { maxChars: 720, maxWords: 95, maxSentencesReduce: 4 }
};

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

function asksForExpandedResponse(text) {
  return EXPANDED_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
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

/**
 * Detecta si el usuario pidió consejos, tips o pasos prácticos en la sesión.
 * @param {Object} params
 * @param {string} params.currentMessage
 * @param {Array<{role?: string, content?: string}>} [params.conversationHistoryNewestFirst]
 * @returns {boolean}
 */
export function detectExpandedResponseMode({
  currentMessage,
  conversationHistoryNewestFirst
}) {
  const candidates = [];
  if (currentMessage) candidates.push(currentMessage);
  if (Array.isArray(conversationHistoryNewestFirst)) {
    candidates.push(
      ...conversationHistoryNewestFirst
        .filter((msg) => msg?.role === 'user' && msg?.content)
        .slice(0, 6)
        .map((msg) => msg.content)
    );
  }
  return candidates.some((rawText) => asksForExpandedResponse(normalizeText(rawText)));
}

/**
 * Resuelve límites de longitud según preferencia de sesión y carga emocional.
 * @param {Object} params
 * @returns {{ maxChars: number, maxWords: number, maxSentencesReduce: number, mode: string }}
 */
export function resolveResponseLengthLimits({
  forceShortMode = false,
  forceExpandedMode = false,
  crisis = null,
  emotional = null,
  contextual = null,
  userMessage = '',
  sessionEmotionalIntensity = null,
  distressTheme = null
} = {}) {
  const risk = String(crisis?.riskLevel || '').toUpperCase();
  if (risk === 'MEDIUM' || risk === 'HIGH') {
    return { ...RESPONSE_LENGTH_PROFILES.expanded, mode: 'crisis' };
  }

  if (forceShortMode) {
    return { ...RESPONSE_LENGTH_PROFILES.short, mode: 'short' };
  }

  const intensity = Number(emotional?.intensity ?? 5);
  const sessionIntensity = Number(
    sessionEmotionalIntensity ?? emotional?.intensity ?? 5
  );
  const requiresAttention = emotional?.requiresAttention === true;
  const isEmotionalHelp =
    contextual?.intencion?.tipo === 'AYUDA_EMOCIONAL' ||
    contextual?.tema?.categoria === 'EMOCIONAL';
  const userWantsExpanded =
    forceExpandedMode || detectExpandedResponseMode({ currentMessage: userMessage });
  const userWantsDetail = asksForDetail(normalizeText(userMessage));
  const highEmotionalLoad =
    requiresAttention && intensity >= 8 && isEmotionalHelp;
  const sessionHighLoad =
    sessionIntensity >= 8 &&
    (isEmotionalHelp || requiresAttention || distressTheme === 'harm_intrusive_thoughts');

  if (userWantsExpanded || userWantsDetail) {
    return { ...RESPONSE_LENGTH_PROFILES.expanded, mode: 'expanded' };
  }
  if (highEmotionalLoad || sessionHighLoad) {
    return { ...RESPONSE_LENGTH_PROFILES.highLoad, mode: 'high_load' };
  }
  return { ...RESPONSE_LENGTH_PROFILES.default, mode: 'default' };
}
