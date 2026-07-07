/**
 * Copy y metadatos de la tarjeta compacta de racha en el dashboard.
 */

import { pickStableVariantIndex } from './dashboardHomeUtils';

export const STREAK_TIER_VARIANT_COUNTS = {
  ember: 3,
  warm: 3,
  blaze: 3,
  stellar: 3,
  legend: 3,
};

export const STREAK_NUDGE_VARIANT_COUNTS = {
  ember: 4,
  warm: 4,
  blaze: 4,
  stellar: 4,
  legend: 4,
};

const TIER_PREFIX = {
  ember: 'EMBER',
  warm: 'WARM',
  blaze: 'BLAZE',
  stellar: 'STELLAR',
  legend: 'LEGEND',
};

export function buildStreakCardSeed(streakDays = 0, dateKey = null) {
  const days = Math.max(0, Math.floor(Number(streakDays) || 0));
  const key = String(dateKey || new Date().toISOString().slice(0, 10)).trim();
  return `${key}:${days}`;
}

function pickTierCopy(texts, tier, kind, count, seed) {
  const prefix = TIER_PREFIX[tier];
  if (!prefix || count < 1) return '';
  const idx = pickStableVariantIndex(seed, count);
  for (let offset = 0; offset < count; offset += 1) {
    const tryIdx = (idx + offset) % count;
    const value = texts[`STREAK_${kind}_${prefix}_${tryIdx}`];
    if (value) return value;
  }
  if (kind === 'TIER') {
    return texts[`STREAK_TIER_${prefix}`] || '';
  }
  return texts.STREAK_CARD_NUDGE || '';
}

export function pickStreakTierBadge(tier, texts = {}, seed = 'default') {
  if (!tier || tier === 'none') return null;
  const count = STREAK_TIER_VARIANT_COUNTS[tier] || 1;
  const badge = pickTierCopy(texts, tier, 'TIER', count, seed);
  return badge || null;
}

export function pickStreakCardNudge(tier, texts = {}, seed = 'default') {
  if (!tier || tier === 'none') {
    return texts.STREAK_CARD_NUDGE || 'sigue así';
  }
  const count = STREAK_NUDGE_VARIANT_COUNTS[tier] || 1;
  return pickTierCopy(texts, tier, 'NUDGE', count, seed) || texts.STREAK_CARD_NUDGE || 'sigue así';
}

export function resolveStreakUnitLabel(streakDays = 0, texts = {}) {
  const days = Math.max(0, Math.floor(Number(streakDays) || 0));
  if (days === 1) {
    return texts.STREAK_CARD_DAY_UNIT || 'día en racha';
  }
  return texts.STREAK_CARD_DAYS_UNIT || texts.STAT_STREAK_DAYS || 'días en racha';
}

export function buildStreakCardMetaLine({ tierBadge, nudge, fallbackSubtitle = '' } = {}) {
  if (tierBadge && nudge) {
    return `${tierBadge} · ${nudge}`;
  }
  if (tierBadge) {
    return tierBadge;
  }
  if (nudge) {
    return nudge;
  }
  return fallbackSubtitle;
}
