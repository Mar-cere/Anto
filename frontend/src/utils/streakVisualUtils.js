/**
 * Paleta y metadatos visuales de racha según días consecutivos.
 */

export const STREAK_TIERS = {
  none: { min: 0, max: 0 },
  ember: { min: 1, max: 2 },
  warm: { min: 3, max: 6 },
  blaze: { min: 7, max: 13 },
  stellar: { min: 14, max: 29 },
  legend: { min: 30, max: Infinity },
};

export function resolveStreakTier(streakDays = 0) {
  const days = Math.max(0, Math.floor(Number(streakDays) || 0));
  if (days === 0) return 'none';
  if (days <= 2) return 'ember';
  if (days <= 6) return 'warm';
  if (days <= 13) return 'blaze';
  if (days <= 29) return 'stellar';
  return 'legend';
}

/**
 * @param {number} streakDays
 * @param {{ primary?: string, accentWarm?: string, textMuted?: string }} colors
 * @param {'light'|'dark'} resolvedScheme
 */
export function getStreakVisual(streakDays = 0, colors = {}, resolvedScheme = 'light') {
  const days = Math.max(0, Math.floor(Number(streakDays) || 0));
  const tier = resolveStreakTier(days);
  const dark = resolvedScheme === 'dark';

  const palettes = {
    none: {
      accent: colors.textMuted || '#8E95A8',
      glow: dark ? 'rgba(142, 149, 168, 0.12)' : 'rgba(142, 149, 168, 0.08)',
      surface: dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(36, 35, 79, 0.03)',
      icon: 'ellipse-outline',
      iconFilled: false,
      pulse: false,
      labelKey: null,
    },
    ember: {
      accent: '#5B9FD4',
      glow: dark ? 'rgba(91, 159, 212, 0.22)' : 'rgba(91, 159, 212, 0.14)',
      surface: dark ? 'rgba(91, 159, 212, 0.1)' : 'rgba(91, 159, 212, 0.08)',
      icon: 'sparkles-outline',
      iconFilled: false,
      pulse: true,
      labelKey: 'STREAK_TIER_EMBER',
    },
    warm: {
      accent: '#E8A04A',
      glow: dark ? 'rgba(232, 160, 74, 0.28)' : 'rgba(232, 160, 74, 0.16)',
      surface: dark ? 'rgba(232, 160, 74, 0.12)' : 'rgba(232, 160, 74, 0.1)',
      icon: 'flame-outline',
      iconFilled: false,
      pulse: true,
      labelKey: 'STREAK_TIER_WARM',
    },
    blaze: {
      accent: '#F07A45',
      glow: dark ? 'rgba(240, 122, 69, 0.32)' : 'rgba(240, 122, 69, 0.18)',
      surface: dark ? 'rgba(240, 122, 69, 0.14)' : 'rgba(240, 122, 69, 0.11)',
      icon: 'flame',
      iconFilled: true,
      pulse: true,
      labelKey: 'STREAK_TIER_BLAZE',
    },
    stellar: {
      accent: '#B88CFF',
      glow: dark ? 'rgba(184, 140, 255, 0.34)' : 'rgba(184, 140, 255, 0.2)',
      surface: dark ? 'rgba(184, 140, 255, 0.14)' : 'rgba(184, 140, 255, 0.1)',
      icon: 'star',
      iconFilled: true,
      pulse: true,
      labelKey: 'STREAK_TIER_STELLAR',
    },
    legend: {
      accent: '#F5C542',
      glow: dark ? 'rgba(245, 197, 66, 0.36)' : 'rgba(245, 197, 66, 0.22)',
      surface: dark ? 'rgba(245, 197, 66, 0.16)' : 'rgba(245, 197, 66, 0.12)',
      icon: 'trophy',
      iconFilled: true,
      pulse: true,
      labelKey: 'STREAK_TIER_LEGEND',
    },
  };

  const heroSurfaces = {
    none: dark ? '#0D2A5C' : colors.primary || '#1E83D3',
    ember: dark ? '#123A5E' : '#2A7AB8',
    warm: dark ? '#3D2A14' : '#C47A2E',
    blaze: dark ? '#4A2218' : '#D45E32',
    stellar: dark ? '#2E1F4A' : '#7B52C4',
    legend: dark ? '#3D3210' : '#B8860B',
  };

  return {
    tier,
    days,
    ...palettes[tier],
    heroBackground: heroSurfaces[tier],
    orbColor:
      tier === 'legend'
        ? 'rgba(245, 197, 66, 0.35)'
        : tier === 'stellar'
          ? 'rgba(184, 140, 255, 0.3)'
          : tier === 'blaze'
            ? 'rgba(240, 122, 69, 0.28)'
            : dark
              ? 'rgba(68, 215, 251, 0.22)'
              : 'rgba(255, 255, 255, 0.18)',
  };
}
