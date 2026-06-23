/**
 * Guías ampliadas en antoapps.com — una por familia de tema (#85).
 * @see https://antoapps.com/recursos
 */
export const PSYCHOEDUCATION_WEBSITE_RESOURCES = {
  anxiety: {
    es: 'https://antoapps.com/recursos/ansiedad-y-preocupacion',
    en: 'https://antoapps.com/en/recursos/ansiedad-y-preocupacion',
  },
  low_mood: {
    es: 'https://antoapps.com/recursos/depresion-guia-breve',
    en: 'https://antoapps.com/en/recursos/depresion-guia-breve',
  },
  stress: {
    es: 'https://antoapps.com/recursos/estres-y-carga',
    en: 'https://antoapps.com/en/recursos/estres-y-carga',
  },
  anger: {
    es: 'https://antoapps.com/recursos/manejo-ira',
    en: 'https://antoapps.com/en/recursos/manejo-ira',
  },
  sleep: {
    es: 'https://antoapps.com/recursos/higiene-sueno-salud-mental',
    en: 'https://antoapps.com/en/recursos/higiene-sueno-salud-mental',
  },
  emotion_regulation: {
    es: 'https://antoapps.com/recursos/regulacion-emocional',
    en: 'https://antoapps.com/en/recursos/regulacion-emocional',
  },
  difficult_experiences: {
    es: 'https://antoapps.com/recursos/trauma-y-tept',
    en: 'https://antoapps.com/en/recursos/trauma-y-tept',
  },
  grief_and_loss: {
    es: 'https://antoapps.com/recursos/duelo-y-perdida',
    en: 'https://antoapps.com/en/recursos/duelo-y-perdida',
  },
  exhaustion_and_burnout: {
    es: 'https://antoapps.com/recursos/agotamiento-y-burnout',
    en: 'https://antoapps.com/en/recursos/agotamiento-y-burnout',
  },
};

/** Tema de la app → clave de recurso web (variantes avanzadas comparten guía base). */
export const PSYCHOEDUCATION_TOPIC_WEB_RESOURCE_KEY = {
  anxiety: 'anxiety',
  anxietyAdvanced: 'anxiety',
  depression: 'low_mood',
  depressionAdvanced: 'low_mood',
  stress: 'stress',
  workStress: 'stress',
  anger: 'anger',
  sleep: 'sleep',
  emotionRegulation: 'emotion_regulation',
  trauma: 'difficult_experiences',
  grief: 'grief_and_loss',
  burnout: 'exhaustion_and_burnout',
};

const WEBSITE_SOURCE_LABEL = {
  es: 'Anto — Guía completa en la web',
  en: 'Anto — Full guide on the web',
};

/**
 * @param {string} topic
 * @param {'es'|'en'} language
 * @returns {{ label: string, url: string } | null}
 */
export function getPsychoeducationWebsiteSource(topic, language = 'es') {
  const resourceKey = PSYCHOEDUCATION_TOPIC_WEB_RESOURCE_KEY[topic];
  if (!resourceKey) return null;
  const entry = PSYCHOEDUCATION_WEBSITE_RESOURCES[resourceKey];
  if (!entry) return null;
  const lang = language === 'en' ? 'en' : 'es';
  const url = entry[lang];
  if (!url || !String(url).startsWith('https://antoapps.com/')) return null;
  return {
    label: WEBSITE_SOURCE_LABEL[lang],
    url,
  };
}
