/**
 * Iconografía de la card de insight del home — sin gráficos genéricos.
 */

const BLOCKED_INSIGHT_ICONS = new Set([
  'chart-line',
  'chart-bar',
  'chart-timeline-variant',
  'chart-areaspline',
]);

export function resolveHomeInsightIcon(variant) {
  if (variant === 'welcome') return 'hand-heart';
  return 'star-four-points-outline';
}

/**
 * @param {'welcome'|string|null|undefined} variant
 * @param {{ primary?: string, accentWarm?: string }} colors
 */
export function resolveHomeInsightIconColor(variant, colors = {}) {
  if (variant === 'welcome') return colors.primary;
  return colors.accentWarm;
}

export function isBlockedHomeInsightIcon(iconName) {
  return BLOCKED_INSIGHT_ICONS.has(iconName);
}
