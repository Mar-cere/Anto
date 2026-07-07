/**
 * Iconos vectoriales para la emoción dominante del insight de sesión.
 * Evita emojis que en iOS pueden mostrarse como «?» en un recuadro.
 */

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
