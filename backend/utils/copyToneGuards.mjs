/**
 * Reglas compartidas de tono (es neutro / en natural).
 */

/** Voseo y formas no neutras en español de producto. */
export const ES_VOSEO_RE =
  /\b(podés|querés|tenés|sabés|andá|dejá|contame|seguí|abrí|mirá|vení|decí|sentí|recordá)\b/i;

export function hasSpanishVoseo(text) {
  return typeof text === 'string' && ES_VOSEO_RE.test(text);
}

export function assertNeutralSpanish(text, context = '') {
  if (hasSpanishVoseo(text)) {
    throw new Error(`Voseo o forma no neutra${context ? ` (${context})` : ''}: ${text.slice(0, 80)}`);
  }
}
