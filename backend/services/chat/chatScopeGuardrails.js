/**
 * Guardrails de alcance: la app acompaña bienestar emocional, no chat generalista.
 */

const WELLNESS_CONTEXT_PATTERNS = [
  /\bme\s+siento\b/i,
  /\bestoy\s+(?:triste|ansios|deprim|mal|solo|sola|agotad|preocupad|cansad)/i,
  /\b(?:ansiedad|tristeza|estr[eé]s|duelo|p[eé]rdida|miedo|p[aá]nico|soledad|depresi[oó]n)\b/i,
  /\bme\s+(?:duele|pone|da|hace|recuerda|activa|calma|ayuda)\b/i,
  /\b(?:lloro|extra[nñ]o|me\s+cuesta|no\s+puedo\s+dormir)\b/i,
  /\b(?:bienestar|salud\s+mental|terapia|acompa[nñ]amiento)\b/i,
];

const OFF_SCOPE_REQUEST_PATTERNS = [
  /\b(?:resumen|biograf[ií]a|biography|life\s+story)\b/i,
  /\b(?:traduc|translate|traducci[oó]n)\b/i,
  /\b(?:en\s+ingl[eé]s|in\s+english)\b/i,
  /\b(?:cu[aá]l\s+es\s+tu|what\s+is\s+your).{0,40}(?:favorit|cantante|singer|pel[ií]cula|movie)\b/i,
  /\b(?:qui[eé]n\s+es|who\s+is)\s+\w/i,
  /\b(?:qu[eé]\s+es|what\s+is)\s+(?:react|javascript|python|node)\b/i,
  /\bcapital\s+de\b/i,
  /\b(?:tarea|homework|ensayo|essay)\b/i,
  /\b(?:lista\s+de|dame\s+datos|informaci[oó]n\s+sobre)\b/i,
];

const ANTO_PERSONA_PATTERNS = [
  /\b(?:tu\s+cantante|tus?\s+gustos|what\s+do\s+you\s+like|do\s+you\s+like\s+michael)\b/i,
  /\b(?:tienes?\s+favorit|have\s+a\s+favorite)\b/i,
];

const ENTERTAINMENT_ENTITY_PATTERNS = [
  /\b(?:michael\s+jackson|jackson\s+5|king\s+of\s+pop)\b/i,
  /\b(?:cantante|singer|actor|actriz|famos[oa]|celebridad|álbum|album|pel[ií]cula|serie)\b/i,
];

const BIOGRAPHY_REPLY_PATTERNS = [
  /\bking\s+of\s+pop\b/i,
  /\bwas\s+an?\s+american\s+singer\b/i,
  /\bfue\s+un[ao]?\s+(?:cantante|m[uú]sico|artista)\b/i,
  /\bthriller\b/i,
  /\bbegan\s+his\s+career\b/i,
  /\bcomenz[oó]\s+su\s+carrera\b/i,
  /\bjackson\s+5\b/i,
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function hasWellnessEmotionalContext(text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  return WELLNESS_CONTEXT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isEntertainmentSmallTalk(text) {
  if (!/\b(?:te\s+gusta|do\s+you\s+like|te\s+encanta)\b/i.test(text)) return false;
  if (hasWellnessEmotionalContext(text)) return false;
  return ENTERTAINMENT_ENTITY_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Mensaje claramente fuera del alcance terapéutico de la app.
 * @param {{ currentMessage?: string }} params
 * @returns {boolean}
 */
export function detectOffScopeUserMessage({ currentMessage } = {}) {
  const text = normalizeText(currentMessage);
  if (!text) return false;
  if (hasWellnessEmotionalContext(text)) return false;

  if (ANTO_PERSONA_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (isEntertainmentSmallTalk(text)) return true;
  if (OFF_SCOPE_REQUEST_PATTERNS.some((pattern) => pattern.test(text))) return true;

  return false;
}

/**
 * @param {'es'|'en'|string} [language]
 */
export function buildOffScopeRedirectReply(language = 'es') {
  if (language === 'en') {
    return (
      "I'm here to support your emotional well-being, not general trivia, biographies, or translations. " +
      'If music or a public figure connects to how you feel, we can explore that — what would you like to share today?'
    );
  }
  return (
    'Estoy aquí para acompañar tu bienestar emocional, no para biografías, curiosidades o traducciones generales. ' +
    'Si la música o alguien famoso te afecta en algo, podemos hablar de eso: ¿qué te gustaría compartir hoy?'
  );
}

/**
 * Si el usuario fue off-scope pero el modelo respondió como Wikipedia, reemplazar.
 */
export function shouldReplaceOffScopeAssistantReply(assistantReply, userMessage) {
  if (!detectOffScopeUserMessage({ currentMessage: userMessage })) return false;
  const reply = String(assistantReply || '');
  if (!reply.trim()) return true;
  return BIOGRAPHY_REPLY_PATTERNS.some((pattern) => pattern.test(reply));
}

export function sanitizeOffScopeAssistantReply(assistantReply, userMessage, language = 'es') {
  if (!shouldReplaceOffScopeAssistantReply(assistantReply, userMessage)) {
    return assistantReply;
  }
  return buildOffScopeRedirectReply(language);
}
