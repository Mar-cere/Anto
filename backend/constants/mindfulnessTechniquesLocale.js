/**
 * Mindfulness y grounding por idioma (es/en).
 */
import {
  MINDFULNESS_TECHNIQUES,
  GROUNDING_TECHNIQUES,
} from './mindfulnessTechniques.js';
import {
  MINDFULNESS_TECHNIQUES_EN,
  GROUNDING_TECHNIQUES_EN,
} from './mindfulnessTechniques.en.js';

const EMOTION_TO_MINDFULNESS_KEY = {
  ansiedad: 'anxiety',
  tristeza: 'sadness',
  enojo: 'anger',
  anxiety: 'anxiety',
  sadness: 'sadness',
  anger: 'anger',
};

export function normalizeMindfulnessLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

export function resolveMindfulnessEmotionKey(emotion) {
  return EMOTION_TO_MINDFULNESS_KEY[emotion] || emotion;
}

export function getMindfulnessCatalog(language = 'es') {
  const lang = normalizeMindfulnessLanguage(language);
  if (lang === 'en') {
    return {
      mindfulness: MINDFULNESS_TECHNIQUES_EN,
      grounding: GROUNDING_TECHNIQUES_EN,
    };
  }
  return {
    mindfulness: MINDFULNESS_TECHNIQUES,
    grounding: GROUNDING_TECHNIQUES,
  };
}

export function getMindfulnessTechniquesForLanguage(emotion, language = 'es') {
  const { mindfulness } = getMindfulnessCatalog(language);
  const key = resolveMindfulnessEmotionKey(emotion);
  return mindfulness[key] ? Object.values(mindfulness[key]) : [];
}

export function getGroundingTechniquesForLanguage(type = 'sensory', language = 'es') {
  const { grounding } = getMindfulnessCatalog(language);
  return grounding[type] ? Object.values(grounding[type]) : [];
}

export function getAllGroundingTechniquesForLanguage(language = 'es') {
  const { grounding } = getMindfulnessCatalog(language);
  return grounding;
}
