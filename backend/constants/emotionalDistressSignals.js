/**
 * Señales de malestar emocional idiomático (anhedonia, imagen corporal, daño emocional)
 * y contexto adolescente con sustancias como coping.
 */

/** @typedef {{ name: string, category: 'negative', baseIntensity: number, signal: string }} DistressHit */

const STILL_MATTERS_CLARIFICATION_PATTERN =
  /no\s+me\s+(?:han?|a)\s+dejado\s+de\s+importan/i;

const ANHEDONIA_PATTERN =
  /(?:ya\s+no\s+me\s+importan?|me\s+(?:han?|an)\s+dejado\s+de\s+importan?|no\s+me\s+importan?\s+(?:las\s+)?cosas|nada\s+me\s+importa|todo\s+se\s+(?:apag[oó]|apagado)|sin\s+ganas\s+de\s+nada)/i;

const WORTHLESSNESS_PATTERN =
  /(?:no\s+(?:me\s+)?valen?\s+de\s+m[ií]|no\s+valgo|no\s+sirvo\s+para\s+nada|no\s+me\s+valoran)/i;

const EMOTIONAL_BODY_HURT_PATTERN =
  /(?:(?:lo\s+que\s+|lo\s+q[uue]\s+)?me\s+(?:hace|ase)\s+da[nñ]o\s+es\s+(?:mi\s+)?(?:cara|rostro|piel|acn[eé])|cuando\s+mencionan\s+mi\s+cara|cuando\s+(?:me\s+)?(?:ven|miran)\s+(?:as[ií]|la\s+cara))/i;

const BODY_IMAGE_DISTRESS_PATTERN =
  /(?:acn[eé]|me\s+escondo|arruin(?:e|ó|aron|an)\s+mi\s+cara|destruy(?:e|en)\s+.*cara|odi(?:o|ar)\s+mi\s+cara|mi\s+cara\s+me\s+(?:destruye|pesa|duele))/i;

const ADOLESCENT_SUBSTANCE_COPING_PATTERN =
  /(?:(?:empec[eé]|empez[eé]|fumo|fumar|vapeo|vapear)\s+.*(?:vapor|vape|vapeo|cigarrillo)|(?:vapor|vape|vapeo).*(?:tengo\s+)?(?:1[0-7]|quince)\b|(?:tengo\s+)?(?:1[0-7]|quince)\b.*(?:vapor|vape|fumar))/i;

const LONELINESS_EXPLICIT_PATTERN =
  /(?:me\s+siento\s+solo|me\s+siento\s+sola|siento\s+soledad)/i;

/**
 * Daño emocional por imagen/comentarios, no intención de autolesión.
 * @param {string} content
 * @returns {boolean}
 */
export function isEmotionalHurtNotSelfHarm(content) {
  if (!content || typeof content !== 'string') return false;
  if (/(?:hacerme\s+da[nñ]o|hacerle\s+da[nñ]o|autolesi|suicid|matarme)/i.test(content)) {
    return false;
  }
  return EMOTIONAL_BODY_HURT_PATTERN.test(content) || BODY_IMAGE_DISTRESS_PATTERN.test(content);
}

/**
 * @param {string} content
 * @returns {DistressHit|null}
 */
export function detectPrimaryDistressSignal(content) {
  if (!content || typeof content !== 'string') return null;

  if (STILL_MATTERS_CLARIFICATION_PATTERN.test(content)) {
    return {
      name: 'tristeza',
      category: 'negative',
      baseIntensity: 7,
      signal: 'values_clarification',
    };
  }

  if (ANHEDONIA_PATTERN.test(content)) {
    return { name: 'tristeza', category: 'negative', baseIntensity: 7, signal: 'anhedonia' };
  }

  if (WORTHLESSNESS_PATTERN.test(content)) {
    return { name: 'tristeza', category: 'negative', baseIntensity: 7, signal: 'worthlessness' };
  }

  if (EMOTIONAL_BODY_HURT_PATTERN.test(content)) {
    if (/(?:hacerme\s+da[nñ]o|hacerle\s+da[nñ]o|matarme|suicid)/i.test(content)) {
      return null;
    }
    return { name: 'verguenza', category: 'negative', baseIntensity: 7, signal: 'emotional_body_hurt' };
  }

  if (BODY_IMAGE_DISTRESS_PATTERN.test(content)) {
    return { name: 'verguenza', category: 'negative', baseIntensity: 7, signal: 'body_image' };
  }

  if (ADOLESCENT_SUBSTANCE_COPING_PATTERN.test(content)) {
    return { name: 'tristeza', category: 'negative', baseIntensity: 6, signal: 'adolescent_substance' };
  }

  if (LONELINESS_EXPLICIT_PATTERN.test(content)) {
    return null;
  }

  return null;
}

/**
 * Pista débil de malestar para carryover de hilo (mensajes no breves).
 * @param {string} content
 * @returns {boolean}
 */
export function hasDistressThreadHint(content) {
  if (!content || typeof content !== 'string') return false;
  return (
    detectPrimaryDistressSignal(content) !== null ||
    /(?:pasado\s+muchas\s+cosas|muchas\s+cosas|fumar|vapor|vape|acn[eé]|cara|solo|soledad|familia|amigos)/i.test(
      content
    )
  );
}
