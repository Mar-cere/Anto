/**
 * Negación idiomática de emociones en español.
 *
 * Cubre modismos donde aparece una palabra emocional positiva pero el sentido es negativo
 * (p. ej. "esperanza ya no", "sin ilusión") y negaciones explícitas de emociones negativas
 * que a veces indican presencia ("no estoy triste" → puede haber tristeza).
 */

/** @typedef {{ id: string, pattern: RegExp, mapsTo: string, baseIntensity: number }} NegationRule */

/** @type {NegationRule[]} */
export const NEGATED_POSITIVE_EMOTION_PATTERNS = [
  {
    id: 'hope_lost',
    pattern:
      /(?:ya\s+no\s+(?:tengo|hay|me\s+queda|queda)|sin|perd[ií](?:da|d[ií])|se\s+me\s+(?:acab[oó]|fue)|no\s+(?:tengo|me\s+queda|hay))\s+(?:la\s+|toda\s+|ni\s+)?esperanza\b|esperanza\s+ya\s+no\b/i,
    mapsTo: 'tristeza',
    baseIntensity: 7,
  },
  {
    id: 'illusion_lost',
    pattern:
      /(?:ya\s+no\s+me\s+ilusiona|sin\s+ilusi[oó]n|perd[ií]\s+la\s+ilusi[oó]n|no\s+me\s+ilusiona|se\s+me\s+acab[oó]\s+la\s+ilusi[oó]n)/i,
    mapsTo: 'tristeza',
    baseIntensity: 7,
  },
  {
    id: 'optimism_lost',
    pattern:
      /(?:sin\s+optimismo|no\s+(?:soy|estoy)\s+optimist[ao]|ya\s+no\s+(?:soy|estoy)\s+optimist[ao]|perd[ií]\s+(?:el\s+)?optimismo)/i,
    mapsTo: 'tristeza',
    baseIntensity: 6,
  },
  {
    id: 'faith_lost',
    pattern:
      /(?:sin\s+fe|perd[ií]\s+la\s+fe|ya\s+no\s+tengo\s+fe|no\s+tengo\s+fe\s+(?:en|de))/i,
    mapsTo: 'tristeza',
    baseIntensity: 6,
  },
  {
    id: 'light_lost',
    pattern: /(?:ya\s+no\s+veo\s+luz|sin\s+luz\s+al\s+final)/i,
    mapsTo: 'tristeza',
    baseIntensity: 7,
  },
  {
    id: 'joy_absent',
    pattern:
      /(?:no\s+(?:estoy|me\s+siento)\s+(?:tan\s+|muy\s+|nada\s+)?(?:feliz|content[oa]|alegre)|sin\s+alegr[ií]a|nada\s+de\s+alegr[ií]a|ya\s+no\s+(?:estoy|me\s+siento)\s+(?:feliz|content[oa]|alegre))/i,
    mapsTo: 'tristeza',
    baseIntensity: 6,
  },
  {
    id: 'motivation_lost',
    pattern:
      /(?:sin\s+ganas(?:\s+de\s+nada)?|ya\s+no\s+tengo\s+ganas|no\s+me\s+quedan\s+ganas|nada\s+me\s+motiva)/i,
    mapsTo: 'tristeza',
    baseIntensity: 6,
  },
  {
    id: 'feeling_lost',
    pattern:
      /(?:ya\s+no\s+siento\s+nada|no\s+siento\s+nada|me\s+siento\s+vac[ií][oa]|sin\s+sentimientos?)/i,
    mapsTo: 'tristeza',
    baseIntensity: 7,
  },
  {
    id: 'grief_process',
    pattern: /(?:desamor(?:arme|ándome|ado)?|desanamor(?:arme|ándome|ado)?|proceso\s+de\s+desamor)/i,
    mapsTo: 'tristeza',
    baseIntensity: 6,
  },
  {
    id: 'calm_absent',
    pattern:
      /(?:no\s+(?:estoy|me\s+siento|puedo\s+estar)\s+(?:tranquil[oa]|calmad[oa]|relajad[oa])|sin\s+paz|sin\s+calma)/i,
    mapsTo: 'ansiedad',
    baseIntensity: 6,
  },
  {
    id: 'confidence_lost',
    pattern:
      /(?:sin\s+confianza(?:\s+en\s+m[ií])?|perd[ií]\s+(?:la\s+)?confianza|ya\s+no\s+tengo\s+confianza)/i,
    mapsTo: 'tristeza',
    baseIntensity: 6,
  },
];

/** @type {NegationRule[]} */
export const EMOTION_DENIAL_PATTERNS = [
  {
    id: 'deny_sadness',
    pattern: /no\s+(?:estoy|me\s+siento)\s+(?:tan\s+|muy\s+)?triste/i,
    mapsTo: 'tristeza',
    baseIntensity: 5,
  },
  {
    id: 'deny_depression',
    pattern: /no\s+estoy\s+deprimid[oa]/i,
    mapsTo: 'tristeza',
    baseIntensity: 5,
  },
  {
    id: 'deny_anxiety',
    pattern: /no\s+(?:estoy|me\s+siento)\s+(?:tan\s+|muy\s+)?(?:ansios[oa]|preocupad[oa])/i,
    mapsTo: 'ansiedad',
    baseIntensity: 5,
  },
  {
    id: 'deny_anger',
    pattern: /no\s+(?:estoy|me\s+siento)\s+enojad[oa]/i,
    mapsTo: 'enojo',
    baseIntensity: 5,
  },
  {
    id: 'deny_fear',
    pattern: /no\s+tengo\s+miedo|no\s+me\s+da\s+miedo/i,
    mapsTo: 'miedo',
    baseIntensity: 5,
  },
];

const DISMISSIVE_NOT_EMOTION_PATTERNS = [
  /no\s+me\s+preocupa\b/i,
];

/**
 * Frases de desapego/descarte que contienen palabras emocionales pero no expresan la emoción.
 * @param {string} content
 * @returns {boolean}
 */
export function isDismissiveEmotionalPhrase(content) {
  if (!content || typeof content !== 'string') return false;
  return DISMISSIVE_NOT_EMOTION_PATTERNS.some((pattern) => pattern.test(content));
}

const POSITIVE_EMOTION_KEYWORDS = {
  esperanza: /\b(?:esperanza|esperanzad[oa]|optimismo|optimist[ao]|ilusionad[oa])\b/i,
  alegria: /\b(?:feliz|content[oa]|alegr[eía]|entusiasmad[oa]|eufóric[oa]|genial|fantástic[oa])\b/i,
};

const NEGATION_BEFORE_KEYWORD =
  /(?:^|[.!?,;:]\s*|\s)(?:no|nunca|jamás|tampoco|ya\s+no|sin|perd[ií]|se\s+me\s+acab[oó]|nada\s+de|ni\s+)(?:\s+(?:la|el|toda|todo|me|me\s+siento|estoy))*\s*$/i;

const NEGATION_AFTER_KEYWORD = /^\s*(?:ya\s+no|se\s+acab[oó]|ni\s+un\s+poco)\b/i;

/**
 * Detecta modismos donde una emoción positiva está negada y devuelve la emoción negativa real.
 * @param {string} content
 * @returns {{ name: string, category: 'negative', baseIntensity: number, negationType: string, negatedConcept: string } | null}
 */
export function detectIdiomaticNegatedPositiveEmotion(content) {
  if (!content || typeof content !== 'string') return null;

  for (const rule of NEGATED_POSITIVE_EMOTION_PATTERNS) {
    if (!rule.pattern.test(content)) continue;
    return {
      name: rule.mapsTo,
      category: 'negative',
      baseIntensity: rule.baseIntensity,
      negationType: 'negated_positive',
      negatedConcept: rule.id,
    };
  }
  return null;
}

/**
 * Detecta negación explícita de una emoción negativa ("no estoy triste").
 * @param {string} content
 * @returns {{ name: string, category: 'negative', baseIntensity: number, negationType: string, negatedConcept: string } | null}
 */
export function detectEmotionDenial(content) {
  if (!content || typeof content !== 'string') return null;

  for (const rule of EMOTION_DENIAL_PATTERNS) {
    if (!rule.pattern.test(content)) continue;
    return {
      name: rule.mapsTo,
      category: 'negative',
      baseIntensity: rule.baseIntensity,
      negationType: 'denied_negative',
      negatedConcept: rule.id,
    };
  }
  return null;
}

/**
 * Comprueba si una emoción positiva detectada por patrón está negada en contexto cercano.
 * @param {string} content
 * @param {string} emotionName
 * @returns {boolean}
 */
export function isPositiveEmotionKeywordNegated(content, emotionName) {
  if (!content || typeof content !== 'string') return false;

  const keywordPattern = POSITIVE_EMOTION_KEYWORDS[emotionName];
  if (!keywordPattern) return false;

  const match = keywordPattern.exec(content);
  if (!match) return false;

  const start = match.index;
  const before = content.slice(Math.max(0, start - 60), start);
  const after = content.slice(start + match[0].length);

  if (NEGATION_BEFORE_KEYWORD.test(before)) return true;
  if (NEGATION_AFTER_KEYWORD.test(after)) return true;

  return false;
}
