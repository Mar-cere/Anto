/**
 * Etiquetas de sección para módulos de psicoeducación (#85).
 */

const SECTION_LABELS = {
  es: {
    whatIs: 'Qué es',
    symptoms: 'Señales frecuentes',
    signs: 'Señales frecuentes',
    causes: 'Factores que suelen influir',
    triggers: 'Desencadenantes habituales',
    whatHelps: 'Qué suele ayudar',
    treatment: 'Qué suele ayudar',
    management: 'Manejo y autocuidado',
    whenToSeekHelp: 'Cuándo buscar apoyo',
    whenWorry: 'Cuándo preocuparse',
    skills: 'Habilidades clave',
    techniques: 'Técnicas',
    benefits: 'Beneficios',
    types: 'Formas en que puede manifestarse',
    hygiene: 'Higiene del sueño',
    sources: 'Fuentes',
  },
  en: {
    whatIs: 'What it is',
    symptoms: 'Common signs',
    signs: 'Common signs',
    causes: 'Factors that often play a role',
    triggers: 'Common triggers',
    whatHelps: 'What often helps',
    treatment: 'What often helps',
    management: 'Coping and self-care',
    whenToSeekHelp: 'When to seek support',
    whenWorry: 'When to be concerned',
    skills: 'Key skills',
    techniques: 'Techniques',
    benefits: 'Benefits',
    types: 'How it may show up',
    hygiene: 'Sleep hygiene',
    sources: 'Sources',
  },
};

const SKIP_KEYS = new Set([
  'disclaimer',
  'sources',
  'topic',
  'version',
  'interventionId',
  'mechanismLine',
  'clinicalReview',
]);

export function sectionLabel(key, language = 'es') {
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  return SECTION_LABELS[lang][key] || key;
}

export function moduleContentEntries(module) {
  if (!module || typeof module !== 'object') return [];
  return Object.entries(module).filter(([k]) => !SKIP_KEYS.has(k));
}
