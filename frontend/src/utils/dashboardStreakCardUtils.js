/**
 * Copy y metadatos de la tarjeta compacta de racha en el dashboard.
 */

export function resolveStreakUnitLabel(streakDays = 0, texts = {}) {
  const days = Math.max(0, Math.floor(Number(streakDays) || 0));
  if (days === 1) {
    return texts.STREAK_CARD_DAY_UNIT || 'día en racha';
  }
  return texts.STREAK_CARD_DAYS_UNIT || texts.STAT_STREAK_DAYS || 'días en racha';
}

export function buildStreakCardMetaLine({ tierBadge, nudge, fallbackSubtitle = '' } = {}) {
  if (tierBadge) {
    return `${tierBadge} · ${nudge || 'sigue así'}`;
  }
  return fallbackSubtitle;
}
