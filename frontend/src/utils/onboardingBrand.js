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
    end: dark ? colors.accentSecondary || '#5B4BD4' : '#24234F',
  };
}

export function buildOnboardingStepHighlights(texts, stepIndex) {
  const key = `STEP_${stepIndex}_HIGHLIGHTS`;
  const value = texts?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((line) => String(line || '').trim());
}
