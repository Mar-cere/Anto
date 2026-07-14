/**
 * Evita bucles de triage A/B/C y preguntas de alivio reformuladas.
 */

function isQuestion(text) {
  const trimmed = (text || '').trim();
  return trimmed.includes('?') || trimmed.includes('¿');
}

/** Exactos ES: incluye "ambos" (antes solo "ambas" vía ambas?). */
const TOTALIZING_EXACT_ES =
  /^(?:todo(?:\s+eso|\s+lo\s+anterior|\s+junto|\s+a\s+la\s+vez)?|todas?|amb[oa]s(?:\s+cosas)?|los?\s+tres|las?\s+tres|un\s+poco\s+de\s+todo|un\s+poco\s+todo|las?\s+dos|los?\s+dos|todo\s+lo\s+que\s+dijiste|(?:el\s+)?cuerpo\s+y\s+(?:la\s+)?mente|(?:la\s+)?mente\s+y\s+(?:el\s+)?cuerpo)[.!?,…]*$/i;

const TOTALIZING_EXACT_EN =
  /^(?:everything|all\s+of\s+(?:it|them|that)|both(?:\s+of\s+them)?|all\s+three|all\s+of\s+the\s+above|(?:the\s+)?body\s+and\s+(?:the\s+)?mind|(?:the\s+)?mind\s+and\s+(?:the\s+)?body)[.!?,…]*$/i;

const TOTALIZING_INLINE =
  /(?:^|\s)(?:todo|todas?|amb[oa]s|everything|all\s+of\s+it|both)(?:\s|$|[.!?,])/i;

/** Polos cuerpo/mente (o equivalentes) para disyuntivas binarias de triage. */
const SOMA_COG_POLE =
  /\b(?:cuerpo|mente|cabeza|f[ií]sico|mental|body|mind|head|physical)\b/gi;

/** Preguntas tipo "qué ayudaría / qué tendría que pasar" (meta-alivio). */
const SOFT_RELIEF_ASK =
  /(?:qu[eé]\s+te\s+ayudar[ií]a|qu[eé]\s+tendr[ií]a\s+que\s+pasar|qu[eé]\s+necesitar[ií]as|what\s+would\s+help|what\s+would\s+(?:have\s+to|need\s+to)\s+happen|what\s+needs\s+to\s+happen|para\s+(?:sentir|que)\s+.{0,48}(?:menos|aliviar|bajar)|feel\s+(?:a\s+)?(?:little\s+)?less|less\s+(?:of\s+)?(?:that\s+)?(?:burden|fear|load|weight))/i;

/** Segunda pregunta colgada con "y qué / y cómo…" en el mismo turno. */
export const COMPOUND_QUESTION_JOIN_ES =
  /\s+y\s+(?=qu[eé]\b|c[oó]mo\b|cu[aá]l(?:es)?\b|cu[aá]ndo\b|d[oó]nde\b|por\s+qu[eé]\b|desde\s+(?:hace|cu[aá]ndo)|qu[eé]\s+sueles)/i;

export const COMPOUND_QUESTION_JOIN_EN =
  /\s+and\s+(?=what\b|how\b|which\b|when\b|where\b|why\b)/i;

const DURATION_ASK =
  /desde\s+hace\s+cu[aá]nto|cu[aá]nto\s+tiempo|hace\s+cu[aá]nto|how\s+long(?:\s+has|\s+have)?/i;

const DURATION_ANSWER =
  /\b(?:unos?\s+)?(?:\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*(?:d[ií]as?|semanas?|meses?|a[nñ]os?)|hace\s+(?:poco|tiempo|mucho)|desde\s+(?:hace\s+)?(?:unas?\s+)?(?:\w+\s+)?(?:semanas?|d[ií]as?)\b/i;

const BEDTIME_RITUAL_CUES =
  /\b(?:antes\s+de\s+(?:acostarte|acostarme|dormir)|justo\s+antes|pantalla|m[oó]vil|celular|cafe[ií]na|rutina\s+nocturna|before\s+bed|right\s+before)\b/i;

/**
 * @param {string} content
 * @returns {boolean}
 */
export function isTotalizingReply(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) return false;
  if (TOTALIZING_EXACT_ES.test(trimmed) || TOTALIZING_EXACT_EN.test(trimmed)) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 4 && TOTALIZING_INLINE.test(trimmed)) return true;

  return false;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function hasDistinctSomaCogPoles(text) {
  const matches = text.match(SOMA_COG_POLE) || [];
  const unique = new Set(matches.map((m) => m.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')));
  // Unificar sinónimos suaves: físico≈cuerpo, mental≈mente, head≈cabeza
  const collapsed = new Set(
    [...unique].map((w) => {
      if (w === 'fisico' || w === 'physical' || w === 'body') return 'cuerpo';
      if (w === 'mental' || w === 'mind') return 'mente';
      if (w === 'head' || w === 'cabeza') return 'cabeza';
      return w;
    }),
  );
  return collapsed.size >= 2;
}

/**
 * Pregunta del asistente con varias opciones cerradas (triage).
 * Incluye listas A/B/C y disyuntivas binarias cuerpo/mente (o "… o ambos").
 * @param {string} content
 * @returns {boolean}
 */
export function isMultiOptionTriageQuestion(content) {
  const text = (content || '').trim();
  if (!text || !isQuestion(text)) return false;

  const oSeparators = (text.match(/\s+o\s+/gi) || []).length;
  const orSeparators = (text.match(/\s+or\s+/gi) || []).length;
  const commas = (text.match(/,/g) || []).length;
  const hasOr = oSeparators >= 1 || orSeparators >= 1;

  if (oSeparators >= 2 || orSeparators >= 2) return true;
  if (hasOr && commas >= 1) return true;

  // "… cuerpo, cabeza, o ambos" / "… or both" aunque el conteo de comas falle
  if (/\bo\s+(?:en\s+)?ambos\b/i.test(text) || /\bor\s+both\b/i.test(text)) return true;

  // Binaria somatocognitiva: "¿cuerpo o mente?", "¿más en el cuerpo o en la cabeza?"
  if (hasOr && hasDistinctSomaCogPoles(text)) return true;

  return false;
}

/**
 * Pregunta de "qué aliviaría / qué tendría que pasar" (misma intención de alivio).
 * @param {string} content
 * @returns {boolean}
 */
export function isSoftReliefQuestion(content) {
  const text = (content || '').trim();
  if (!text || !isQuestion(text)) return false;
  return SOFT_RELIEF_ASK.test(text);
}

/**
 * Dos intenciones interrogativas en el mismo mensaje (varios "?" o "¿… y qué…?").
 * @param {string} content
 * @returns {boolean}
 */
export function isCompoundDoubleAsk(content) {
  const text = String(content || '').trim();
  if (!text) return false;
  const marks = (text.match(/[?]/g) || []).length;
  if (marks >= 2) return true;
  if (!isQuestion(text)) return false;
  return COMPOUND_QUESTION_JOIN_ES.test(text) || COMPOUND_QUESTION_JOIN_EN.test(text);
}

/**
 * Extrae la segunda pregunta (si había) para recuperación en el siguiente turno.
 * @param {string} content
 * @returns {string}
 */
export function extractDeferredQuestionHint(content) {
  const text = String(content || '').trim();
  if (!text) return '';
  const marks = (text.match(/[?]/g) || []).length;
  if (marks >= 2) {
    const parts = text.split(/(?<=[?])/).map((p) => p.trim()).filter(Boolean);
    const second = parts.find((p, i) => i > 0 && (p.includes('?') || p.includes('¿')));
    if (second) {
      const cleaned = second.replace(/^[.\s]+/, '').trim();
      if (cleaned.length >= 12) return cleaned.slice(0, 160);
    }
  }
  const join = COMPOUND_QUESTION_JOIN_ES.test(text)
    ? COMPOUND_QUESTION_JOIN_ES
    : COMPOUND_QUESTION_JOIN_EN.test(text)
      ? COMPOUND_QUESTION_JOIN_EN
      : null;
  if (!join) return '';
  const split = text.split(join);
  if (split.length < 2) return '';
  let rest = split.slice(1).join(' ').trim();
  if (!rest) return '';
  if (!/[?¿]/.test(rest)) rest = `${rest.replace(/[.!]+$/, '')}?`;
  if (!rest.includes('¿') && /^[a-záéíóúüñ]/i.test(rest)) {
    rest = `¿${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
  }
  return rest.slice(0, 160);
}

/**
 * Respuesta con contenido (no solo "ambos" / monosílabos).
 * @param {string} content
 * @returns {boolean}
 */
export function isSubstantiveReply(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) return false;
  if (isTotalizingReply(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 4 || trimmed.length >= 24;
}

function getLastAssistantMessage(historyNewestFirst) {
  const list = [...(historyNewestFirst || [])];
  // Historial newest-first: el turno actual del usuario suele ser el primer mensaje.
  let start = 0;
  while (start < list.length && list[start]?.role === 'user') start += 1;

  for (let i = start; i < list.length; i += 1) {
    if (list[i]?.role === 'assistant') {
      return String(list[i].content || '');
    }
  }
  return '';
}

/**
 * @param {{ userMessage?: string, safetyHistory?: Array<{ role: string, content?: string }> }} params
 * @returns {boolean}
 */
export function shouldSuppressRepeatTriage({ userMessage, safetyHistory }) {
  if (!isTotalizingReply(userMessage)) return false;
  const lastAssistant = getLastAssistantMessage(safetyHistory);
  return isMultiOptionTriageQuestion(lastAssistant);
}

/**
 * Tras "qué te ayudaría…", el usuario ya respondió: no reformular la misma meta-pregunta.
 * @param {{ userMessage?: string, safetyHistory?: Array<{ role: string, content?: string }> }} params
 * @returns {boolean}
 */
export function shouldSuppressRepeatedSoftAsk({ userMessage, safetyHistory }) {
  if (!isSubstantiveReply(userMessage)) return false;
  const lastAssistant = getLastAssistantMessage(safetyHistory);
  return isSoftReliefQuestion(lastAssistant);
}

export function resolveUserMessage(contexto) {
  if (typeof contexto?.userMessage === 'string') return contexto.userMessage;
  if (typeof contexto?.currentMessage === 'string') return contexto.currentMessage;
  return contexto?.currentMessage?.content || '';
}

/**
 * Snippet corto para el system prompt cuando aplica.
 * @param {Object} contexto
 * @param {'es'|'en'} [language='es']
 * @returns {string}
 */
export function buildAntiRepeatTriageSnippet(contexto, language = 'es') {
  const userMessage = resolveUserMessage(contexto);
  const history = contexto?.safetyHistory || [];

  if (!shouldSuppressRepeatTriage({ userMessage, safetyHistory: history })) {
    return '';
  }

  const en = language === 'en';
  return en
    ? `\n\n### Avoid repeated triage (this turn, high priority)
- The user just gave a totalizing reply ("everything", "both", "all three", "body and mind", etc.) to your choose-between-options question.
- Do NOT ask another "which weighs more: A, B or C?" style question, and do NOT rename the same split (e.g. body vs mind after they already said both).
- Validate in **one** short sentence **without** re-listing A and B ("yes, both: X and Y…").
- If you move forward, ONE open question that is **not** "what would help / what would need to happen / how to feel less burden". Prefer a concrete scene from today, how the joint weight shows up, or one detail they already named.`
    : `\n\n### Evitar triage repetido (este turno, prioridad alta)
- El usuario acaba de responder de forma totalizadora ("todo", "ambos", "las tres", "cuerpo y mente", etc.) a tu pregunta de elegir entre opciones.
- **No** repitas otra pregunta tipo "¿qué te aprieta más: A, B o C?" ni **renombres** la misma división (p. ej. cuerpo vs mente después de que ya dijo ambos).
- Valida en **1 frase corta** **sin** re-listar A y B ("sí, ambas: X y Y…").
- Si avanzas, **una sola pregunta abierta** que **no** sea "¿qué te ayudaría?", "¿qué tendría que pasar?" ni "cómo bajar la carga". Prefiere un momento concreto de hoy, cómo se nota el peso junto, o un detalle que ya nombró.`;
}

/**
 * Evita reformular "qué ayudaría / qué tendría que pasar" tras una respuesta con contenido.
 * @param {Object} contexto
 * @param {'es'|'en'} [language='es']
 * @returns {string}
 */
export function buildAntiRepeatedSoftAskSnippet(contexto, language = 'es') {
  const userMessage = resolveUserMessage(contexto);
  const history = contexto?.safetyHistory || [];

  if (!shouldSuppressRepeatedSoftAsk({ userMessage, safetyHistory: history })) {
    return '';
  }

  const en = language === 'en';
  return en
    ? `\n\n### Avoid paraphrased soft-ask (this turn, high priority)
- Your previous turn already asked what would help / what would need to happen / how to feel less of this load.
- The user **already answered with content**. Do **not** ask that same meta-question with new wording.
- Pick **one concrete detail** from their reply (fresh words, no long echo) and go deeper: a specific scene, what feels hardest about that detail, or how it shows up today.
- One short reflection + at most **one** focused question on that detail — never another "what would soften this".`
    : `\n\n### Evitar pregunta de alivio reformulada (este turno, prioridad alta)
- En tu turno anterior ya preguntaste qué ayudaría / qué tendría que pasar / cómo sentir menos esa carga.
- El usuario **ya respondió con contenido**. **No** vuelvas a preguntar lo mismo con otras palabras.
- Toma **un detalle concreto** de su respuesta (palabras nuevas, sin eco largo) y profundiza: una escena concreta, qué parte de ese detalle pesa más, o cómo se nota hoy.
- Una reflexión breve + como máximo **una** pregunta focal sobre ese detalle — nunca otra "¿qué aliviaría esto?".`;
}

/**
 * El usuario solo contestó una parte (p. ej. duración) de un doble hilo (p. ej. rutina previa al sueño).
 * @param {{ userMessage?: string, safetyHistory?: Array<{ role: string, content?: string }> }} params
 * @returns {boolean}
 */
export function shouldRecoverPartialFollowUp({ userMessage, safetyHistory }) {
  const lastAssistant = getLastAssistantMessage(safetyHistory);
  if (!lastAssistant || !isSubstantiveReply(userMessage)) return false;

  if (isCompoundDoubleAsk(lastAssistant)) {
    const deferred = extractDeferredQuestionHint(lastAssistant);
    if (deferred && !userLikelyAnsweredDeferred(userMessage, deferred)) return true;
  }

  // Tras strip: última pregunta fue solo "¿desde cuándo?" y el usuario respondió tiempo (hilo sueño).
  if (
    DURATION_ASK.test(lastAssistant) &&
    DURATION_ANSWER.test(userMessage) &&
    !BEDTIME_RITUAL_CUES.test(userMessage) &&
    /\b(?:sue[nñ]o|dormir|acost|insomni|sleep|bed)\b/i.test(`${lastAssistant}\n${userMessage}`)
  ) {
    return true;
  }

  return false;
}

function userLikelyAnsweredDeferred(userMessage, deferredHint) {
  const user = String(userMessage || '').toLowerCase();
  const hint = String(deferredHint || '').toLowerCase();
  if (BEDTIME_RITUAL_CUES.test(hint) && BEDTIME_RITUAL_CUES.test(user)) return true;
  const keywords = hint
    .replace(/[¿?¡!.,;:]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 6);
  const hits = keywords.filter((w) => user.includes(w)).length;
  return hits >= 2;
}

/**
 * Snippet: recuperar la pregunta pendiente (una sola) sin saltar a causas genéricas ni a producto.
 * @param {Object} contexto
 * @param {'es'|'en'} [language='es']
 * @returns {string}
 */
export function buildPartialFollowUpSnippet(contexto, language = 'es') {
  const userMessage = resolveUserMessage(contexto);
  const history = contexto?.safetyHistory || [];

  if (!shouldRecoverPartialFollowUp({ userMessage, safetyHistory: history })) {
    return '';
  }

  const lastAssistant = getLastAssistantMessage(history);
  const deferred = extractDeferredQuestionHint(lastAssistant);
  const en = language === 'en';

  if (deferred) {
    return en
      ? `\n\n### Recover unanswered follow-up (this turn, high priority)
- Your previous turn mixed **two** asks. The user answered only part of it.
- Validate briefly, then ask **only** this pending thread (one question, no compound "and what…"): ${deferred}
- Do **not** jump to a new cause menu or a task/habit suggestion yet.`
      : `\n\n### Recuperar pregunta pendiente (este turno, prioridad alta)
- En tu turno anterior mezclaste **dos** preguntas. El usuario solo contestó una parte.
- Valida en breve y retoma **solo** este hilo pendiente (una pregunta, sin "y qué…" compuesto): ${deferred}
- **No** saltes aún a un menú de causas nuevas ni a sugerir tarea/hábito.`;
  }

  return en
    ? `\n\n### Recover unanswered follow-up (this turn, high priority)
- You asked how long this has been going on; the user answered with a time frame.
- Next: **one** question about what they usually do just before bed (screens, caffeine, worry loop) — do not stack another cause.
- Do **not** propose a task or habit yet; keep exploring.`
    : `\n\n### Recuperar pregunta pendiente (este turno, prioridad alta)
- Preguntaste desde cuándo ocurre; el usuario respondió con un plazo de tiempo.
- Siguiente: **una** pregunta sobre qué suele hacer justo antes de acostarse (pantalla, cafeína, rumiación) — no apiles otra causa.
- **No** propongas aún tarea ni hábito; sigue explorando.`;
}
