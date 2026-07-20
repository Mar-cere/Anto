/**
 * Comprensión del mensaje / polaridad literal (#prompt-overhaul).
 * Evita que fillers coloquiales ("Nada,", "Nothing much") inviertan el sentido
 * de cláusulas afirmativas ("he podido", "I've been able").
 */

/** Verbos/frases de progreso o logro en afirmativo (ES/EN). */
const AFFIRMATIVE_PROGRESS =
  /(?:\bhe\s+podido\b|\bpude\b|\bestoy\s+pudiendo\b|\bpuedo\s+avanzar\b|\blogr[eé]\b|\bavanc[eé]\b|\bi'?ve\s+been\s+able\b|\bi\s+was\s+able\b|\bi\s+managed\b|\bi\s+made\s+progress\b|\bi'?m\s+making\s+progress\b)/i;

/** Filler inicial que NO niega lo que sigue. */
const OPENING_FILLER =
  /^(?:nada(?:\s|,|…|\.{2,}|!|\?)|nothing\s+much(?:\s|,|…|\.|!|\?)|nothing(?:\s|,|…|\.|!|\?)|just(?:\s|,)|bueno(?:\s|,)|pues(?:\s|,)|well(?:\s|,)|anyway(?:\s|,))/i;

/** Negación explícita cerca del verbo de progreso → no es false positive. */
const EXPLICIT_NEGATION_NEAR_PROGRESS =
  /(?:\bnada\s+no\b|\bno\s+he\s+podido\b|\bno\s+pude\b|\bno\s+puedo\b|\bnada\s+de\s+(?:avance|progres)|haven'?t\s+been\s+able\b|\bcouldn'?t\b|\bdidn'?t\s+manage\b|\bnot\s+been\s+able\b)/i;

/**
 * Detecta mensaje donde un filler coloquial precede progreso afirmativo.
 * @param {string} userMessage
 * @returns {boolean}
 */
export function detectsLiteralPolarityCaution(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return false;
  const text = userMessage.replace(/\s+/g, ' ').trim();
  if (text.length < 8) return false;
  if (EXPLICIT_NEGATION_NEAR_PROGRESS.test(text)) return false;
  if (!OPENING_FILLER.test(text)) return false;
  return AFFIRMATIVE_PROGRESS.test(text);
}

/**
 * Sección fija de comprensión (siempre en el core del system prompt).
 * @param {'es'|'en'} language
 * @returns {string}
 */
export function buildMessageComprehensionSnippet(language = 'es') {
  if (language === 'en') {
    return `

### Message comprehension (read before reflecting)
- Read **facts** and the **polarity of conjugated verbs** first. Do not invert what the user affirmed or denied.
- Opening fillers like "Nothing", "Nothing much", "Just…" often mean "nothing special / all normal" — they do **not** negate a following affirmative clause ("I've been able", "I managed", "I'm making progress").
- If the user reports progress or ability in the affirmative, acknowledge that; **do not** reframe as being stuck or falling behind.
- Emotional comparisons (e.g. partner vs self) only as a **question**, never as a categorical claim the user did not make.
- If truly ambiguous: ask **one** clarifying question; do not invent a problem narrative.`;
  }

  return `

### Comprensión del mensaje (lee antes de reflejar)
- Lee primero los **hechos** y la **polaridad del verbo conjugado**. No inviertas lo que el usuario afirmó o negó.
- Fillers al inicio como "Nada", "Nada,", "Bueno,", "Pues…" suelen significar "todo normal / nada especial": **no** niegan una cláusula afirmativa que sigue ("he podido", "pude", "estoy pudiendo", "logré").
- Si el usuario reporta avance o capacidad en afirmativo, reconócelo; **no reformules como estancamiento** ni como "quedarse atrás".
- Comparaciones emocionales (p. ej. pareja vs uno mismo) solo como **pregunta**, nunca como afirmación categórica que el usuario no hizo.
- Si hay ambigüedad real: **una** pregunta aclaratoria; no inventes una narrativa de problema.`;
}

/**
 * Hint dinámico cuando el turno actual dispara la heurística de polaridad.
 * @param {'es'|'en'} language
 * @param {string} userMessage
 * @returns {string}
 */
export function buildLiteralPolarityCautionSnippet(language, userMessage) {
  if (!detectsLiteralPolarityCaution(userMessage)) return '';

  if (language === 'en') {
    return `

### Literal polarity caution
The latest user message likely opens with a colloquial filler plus an **affirmative** progress/ability clause. Treat progress as stated. **Do not** reframe as being stuck, left behind, or unable to advance. Any comparison hypothesis must be a question, not a claim.`;
  }

  return `

### Literal polarity caution
El último mensaje del usuario probablemente abre con un filler coloquial ("Nada…") más una cláusula de progreso/capacidad en **afirmativo**. Trata el avance como dicho. **No reformules como estancamiento**, quedarse atrás o no poder avanzar. Cualquier hipótesis de comparación debe ser pregunta, no afirmación.`;
}
