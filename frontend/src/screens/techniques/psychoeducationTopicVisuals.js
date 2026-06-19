/**
 * Iconos y acentos por tema de psicoeducación (#85).
 */
export const PSYCHOED_TOPIC_VISUALS = {
  anxiety: {
    icon: 'weather-windy',
    accentKey: 'primary',
  },
  anxietyAdvanced: {
    icon: 'weather-windy',
    accentKey: 'primary',
  },
  depression: {
    icon: 'weather-cloudy',
    accentKey: 'primary',
  },
  depressionAdvanced: {
    icon: 'weather-cloudy',
    accentKey: 'primary',
  },
  stress: {
    icon: 'flash',
    accentKey: 'warning',
  },
  workStress: {
    icon: 'briefcase-outline',
    accentKey: 'warning',
  },
  anger: {
    icon: 'fire',
    accentKey: 'error',
  },
  sleep: {
    icon: 'sleep',
    accentKey: 'primary',
  },
  emotionRegulation: {
    icon: 'heart-pulse',
    accentKey: 'success',
  },
  trauma: {
    icon: 'shield-heart',
    accentKey: 'primary',
  },
  grief: {
    icon: 'flower',
    accentKey: 'primary',
  },
  burnout: {
    icon: 'battery-low',
    accentKey: 'warning',
  },
};

export function getTopicVisual(topic, colors) {
  const key = topic || 'anxiety';
  const meta = PSYCHOED_TOPIC_VISUALS[key] || PSYCHOED_TOPIC_VISUALS.anxiety;
  const accentMap = {
    primary: colors.primary,
    warning: colors.warning,
    error: colors.error,
    success: colors.success,
  };
  const accent = accentMap[meta.accentKey] || colors.primary;
  const soft = colors.accentLineSoft ?? `${accent}18`;
  return {
    icon: meta.icon,
    accent,
    iconBg: soft,
    borderLeft: accent,
  };
}
