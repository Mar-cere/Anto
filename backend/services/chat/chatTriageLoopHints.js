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
