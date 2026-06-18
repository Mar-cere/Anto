/**
 * Copy del lienzo interactivo de ciclo ABC macro (#212).
 */

export const ABC_MACRO_CYCLE_COPY = {
  es: {
    legA: 'Situación',
    legB: 'Pensamiento',
    legC: 'Consecuencia',
    avgIntensity: (n) => `Intensidad media ${n}/10`,
    exploreHint: 'Toca cada letra para explorar el ciclo.',
    interventionA:
      'Observar qué situaciones activan este ciclo puede ayudarte a anticipar el momento.',
    interventionB:
      'Aquí suele haber un punto de intervención: cuestionar o reformular el pensamiento automático.',
    interventionC:
      'Las consecuencias muestran qué mantiene el ciclo; pequeños cambios de conducta pueden abrir otra salida.',
    a11yLeg: (letter, label, expanded) =>
      `${letter}: ${label}${expanded ? ', expandido' : ', contraído'}`,
  },
  en: {
    legA: 'Situation',
    legB: 'Thought',
    legC: 'Consequence',
    avgIntensity: (n) => `Average intensity ${n}/10`,
    exploreHint: 'Tap each letter to explore the cycle.',
    interventionA:
      'Noticing which situations trigger this cycle can help you anticipate the moment.',
    interventionB:
      'This is often a good intervention point: question or reframe the automatic thought.',
    interventionC:
      'Consequences show what keeps the cycle going; small behavior shifts can open another path.',
    a11yLeg: (letter, label, expanded) =>
      `${letter}: ${label}${expanded ? ', expanded' : ', collapsed'}`,
  },
};

/** @typedef {'A'|'B'|'C'} AbcMacroCycleLeg */

/**
 * @param {'A'|'B'|'C'} leg
 * @param {'es'|'en'} language
 */
export function getAbcMacroCycleInterventionHint(leg, language = 'es') {
  const lang = language === 'en' ? 'en' : 'es';
  const copy = ABC_MACRO_CYCLE_COPY[lang];
  if (leg === 'A') return copy.interventionA;
  if (leg === 'B') return copy.interventionB;
  if (leg === 'C') return copy.interventionC;
  return '';
}

/**
 * @param {object|null|undefined} cycle
 * @param {'A'|'B'|'C'} leg
 * @returns {string[]}
 */
export function getAbcMacroCycleLegSamples(cycle, leg) {
  if (!cycle || typeof cycle !== 'object') return [];
  if (leg === 'A') return [cycle.trigger].filter(Boolean);
  if (leg === 'B') return Array.isArray(cycle.thoughts) ? cycle.thoughts.filter(Boolean) : [];
  if (leg === 'C') {
    return [...(cycle.emotions || []), ...(cycle.consequences || [])].filter(Boolean);
  }
  return [];
}

export function normalizeAbcMacroCycleLanguage(language) {
  return String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}
