/**
 * Acento y gradientes de marca para el recorrido.
 */
export function resolveOnboardingBrandAccent(colors = {}) {
  return colors.primary || '#1E83D3';
}

export function resolveOnboardingGradient(colors = {}, dark = false) {
  return {
    start: colors.primaryBright || '#44D7FB',
    mid: colors.primary || '#1E83D3',
    indigo: colors.accentSecondary || (dark ? '#8B7FE8' : '#5B4BD4'),
    warm: colors.accentWarm || '#E89BB8',
  };
}

export function buildOnboardingStepHighlights(texts, stepIndex) {
  const key = `STEP_${stepIndex}_HIGHLIGHTS`;
  const value = texts?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((line) => String(line || '').trim());
}
