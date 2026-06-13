/**
 * Evita bucles de "elige A/B/C" cuando el usuario responde de forma totalizadora.
 */

function isQuestion(text) {
  const trimmed = (text || '').trim();
  return trimmed.includes('?') || trimmed.includes('¿');
}

const TOTALIZING_EXACT_ES =
  /^(?:todo(?:\s+eso|\s+lo\s+anterior|\s+junto|\s+a\s+la\s+vez)?|todas?|ambas?|los?\s+tres|las?\s+tres|un\s+poco\s+de\s+todo|un\s+poco\s+todo|las?\s+dos|los?\s+dos|todo\s+lo\s+que\s+dijiste)[.!?,…]*$/i;

const TOTALIZING_EXACT_EN =
  /^(?:everything|all\s+of\s+(?:it|them|that)|both|all\s+three|all\s+of\s+the\s+above)[.!?,…]*$/i;

const TOTALIZING_INLINE =
  /(?:^|\s)(?:todo|todas?|ambas?|everything|all\s+of\s+it)(?:\s|$|[.!?,])/i;

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
 * Pregunta del asistente con varias opciones cerradas (triage).
 * @param {string} content
 * @returns {boolean}
 */
export function isMultiOptionTriageQuestion(content) {
  const text = (content || '').trim();
  if (!text || !isQuestion(text)) return false;

  const oSeparators = (text.match(/\s+o\s+/gi) || []).length;
  const orSeparators = (text.match(/\s+or\s+/gi) || []).length;
  const commas = (text.match(/,/g) || []).length;

  if (oSeparators >= 2 || orSeparators >= 2) return true;
  if ((oSeparators >= 1 || orSeparators >= 1) && commas >= 1) return true;

  return false;
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
- The user just gave a totalizing reply ("everything", "all three", etc.) to your choose-between-options question.
- Do NOT ask another "which weighs more: A, B or C?" style question or rename the same options.
- Validate in one specific sentence that when everything piles up the weight feels huge.
- Offer support: reflect the whole or briefly name 2–3 threads they already mentioned (not as a closed menu).
- If you need to move forward, ONE open question without A/B/C options.`
    : `\n\n### Evitar triage repetido (este turno, prioridad alta)
- El usuario acaba de responder de forma totalizadora ("todo", "las tres", etc.) a tu pregunta de elegir entre opciones.
- **No** repitas otra pregunta tipo "¿qué te aprieta más: A, B o C?" ni variantes con la misma lista renombrada.
- Valida en **1 frase concreta** que cuando todo se junta el peso se siente enorme.
- Sostén: refleja el conjunto o nombra brevemente 2–3 hilos que ya mencionó (**sin** listarlos como menú cerrado).
- Si necesitas avanzar, **una sola pregunta abierta** sin opciones A/B/C.`;
}
