/**
 * Reglas compartidas de tono (es neutro / en natural).
 */

/** Voseo y formas no neutras en español de producto. */
export const ES_VOSEO_RE =
  /\b(decírmelo|decime|podés|querés|tenés|sabés|andá|dejá|contame|seguí|abrí|mirá|vení|decí|sentí|recordá|llegás|sentís|tocá)\b/i;

/** Reemplazos ordenados (más largo primero) para neutralizar voseo en respuestas visibles. */
const VOSEO_NEUTRALIZE_RULES = [
  [/decírmelo/gi, 'contármelo'],
  [/decime/gi, 'dime'],
  [/podés/gi, 'puedes'],
  [/querés/gi, 'quieres'],
  [/tenés/gi, 'tienes'],
  [/sabés/gi, 'sabes'],
  [/llegás/gi, 'llegas'],
  [/sentís/gi, 'sientes'],
  [/contame/gi, 'cuéntame'],
  [/seguí/gi, 'sigue'],
  [/abrí/gi, 'abre'],
  [/mirá/gi, 'mira'],
  [/vení/gi, 'ven'],
  [/andá/gi, 've'],
  [/dejá/gi, 'deja'],
  [/recordá/gi, 'recuerda'],
  [/sentí/gi, 'siente'],
  [/tocá/gi, 'toca'],
  [/\bdecí\b/gi, 'di'],
];

export function hasSpanishVoseo(text) {
  return typeof text === 'string' && ES_VOSEO_RE.test(text);
}

/**
 * Convierte voseo frecuente a español neutro (tú estándar).
 * @param {string} text
 * @returns {string}
 */
export function neutralizeSpanishVoseo(text) {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const [pattern, replacement] of VOSEO_NEUTRALIZE_RULES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function assertNeutralSpanish(text, context = '') {
  if (hasSpanishVoseo(text)) {
    throw new Error(`Voseo o forma no neutra${context ? ` (${context})` : ''}: ${text.slice(0, 80)}`);
  }
}
