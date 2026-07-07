/**
 * Iconos vectoriales para insight de sesión (emoción, pasos sugeridos, TCC lite).
 * Evita emojis que en iOS pueden mostrarse como «?» en un recuadro.
 */

import { resolveInterventionVisual } from '../constants/interventionVisuals';

export const SESSION_INSIGHT_EMOTION_IONICONS = {
  ansiedad: 'pulse-outline',
  tristeza: 'rainy-outline',
  enojo: 'flame-outline',
  miedo: 'alert-circle-outline',
  culpa: 'sad-outline',
  verguenza: 'eye-off-outline',
  soledad: 'people-outline',
  alegria: 'sunny-outline',
  esperanza: 'leaf-outline',
  neutral: 'leaf-outline',
};

export function resolveSessionInsightEmotionIcon(emotionKey) {
  const key = String(emotionKey || 'neutral').toLowerCase();
  return SESSION_INSIGHT_EMOTION_IONICONS[key] || 'sparkles-outline';
}

/** Icono para paso sugerido (catálogo de intervenciones). */
export function resolveSessionInsightStepVisual(step) {
  return resolveInterventionVisual(step?.id);
}

/** Icono para retomar TCC lite en el chat (distorsión cognitiva). */
export function resolveTccLiteResumeVisual() {
  return { mciIcon: 'head-lightbulb-outline', accentKey: 'primary' };
}
