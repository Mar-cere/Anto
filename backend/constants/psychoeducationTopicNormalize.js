/**
 * Normalización de topic para API y catálogo (#85).
 */
import { PSYCHOEDUCATION_TOPIC_ORDER } from './psychoeducationTopics.js';

const TOPIC_BY_KEY = {
  anxiety: 'anxiety',
  anxietyadvanced: 'anxietyAdvanced',
  ansiedadavanzada: 'anxietyAdvanced',
  depression: 'depression',
  depressionadvanced: 'depressionAdvanced',
  depresionavanzada: 'depressionAdvanced',
  bajoanimoavanzado: 'depressionAdvanced',
  stress: 'stress',
  workstress: 'workStress',
  estreslaboral: 'workStress',
  trabajo: 'workStress',
  workplace: 'workStress',
  anger: 'anger',
  sleep: 'sleep',
  emotionregulation: 'emotionRegulation',
  trauma: 'trauma',
  grief: 'grief',
  duelo: 'grief',
  loss: 'grief',
  perdida: 'grief',
  burnout: 'burnout',
  agotamiento: 'burnout',
};

const ALLOWED = new Set(PSYCHOEDUCATION_TOPIC_ORDER);

export function normalizePsychoeducationTopic(raw) {
  const key = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[-_\s]/g, '');
  const topic = TOPIC_BY_KEY[key];
  if (!topic || !ALLOWED.has(topic)) return null;
  return topic;
}

export function isValidPsychoeducationTopic(raw) {
  return normalizePsychoeducationTopic(raw) != null;
}
