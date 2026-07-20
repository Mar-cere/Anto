/**
 * Fragmento reutilizable de fidelidad observacional para prompts satélites
 * (insights, resúmenes, extractores) cuyo output puede verse o guiar copy.
 */

/**
 * @param {'es'|'en'} language
 * @returns {string}
 */
export function buildObservationalFidelitySnippet(language = 'es') {
  if (language === 'en') {
    return `OBSERVATIONAL FIDELITY (required):
- Only state what the source text supports. Do not invent emotions, comparisons, diagnoses, or biographical facts.
- Do not invert polarity (e.g. treat affirmative progress as failure).
- If uncertain, omit or mark uncertainty; prefer a neutral observation over a strong hypothesis.
- No clinical labels, medication advice, or "you have X".`;
  }

  return `FIDELIDAD OBSERVACIONAL (obligatorio):
- Solo afirma lo que el texto fuente sostiene. No inventes emociones, comparaciones, diagnósticos ni hechos biográficos.
- No inviertas la polaridad (p. ej. tratar un avance afirmativo como fracaso).
- Si hay duda, omite o marca incertidumbre; prefiere observación neutra a hipótesis fuerte.
- Sin etiquetas clínicas, medicación ni "tienes X".`;
}
