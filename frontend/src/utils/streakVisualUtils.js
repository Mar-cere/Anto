/**
 * Paleta y metadatos visuales de racha según días consecutivos.
 * La intensidad de color escala dentro de cada nivel según el avance en días.
 */

export const STREAK_TIERS = {
  none: { min: 0, max: 0 },
  ember: { min: 1, max: 2 },
  warm: { min: 3, max: 6 },
  blaze: { min: 7, max: 13 },
  stellar: { min: 14, max: 29 },
  legend: { min: 30, max: Infinity },
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '');
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
}

function mixHex(baseHex, accentHex, ratio) {
  const base = hexToRgb(baseHex);
  const accent = hexToRgb(accentHex);
  if (!base || !accent) return baseHex;
  const t = clamp01(ratio);
  const r = Math.round(base.r + (accent.r - base.r) * t);
  const g = Math.round(base.g + (accent.g - base.g) * t);
  const b = Math.round(base.b + (accent.b - base.b) * t);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function mixRgba(rgba, alphaScale) {
  const match = String(rgba).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgba;
  const [, r, g, b, a = '1'] = match;
  const nextAlpha = clamp01(Number(a) * alphaScale);
  return `rgba(${r}, ${g}, ${b}, ${nextAlpha.toFixed(3)})`;
}

function tierProgress(days, tier) {
  const bounds = STREAK_TIERS[tier];
  if (!bounds || tier === 'none') return 0;
  if (!Number.isFinite(bounds.max)) {
    const span = Math.max(1, days - bounds.min);
    return clamp01(span / 30);
  }
  const span = Math.max(1, bounds.max - bounds.min);
  return clamp01((days - bounds.min) / span);
}

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
  const progress = tierProgress(days, tier);
  const intensity = 0.65 + progress * 0.35;

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

  const heroGradients = {
    none: {
      top: dark ? '#0A1E45' : '#1D1B70',
      bottom: dark ? '#1A5F96' : colors.primary || '#1E83D3',
      sparkle: '#E8ECF4',
    },
    ember: {
      top: dark ? '#0A1E45' : '#1D1B70',
      bottom: dark ? '#1A6BA8' : '#2B8FD4',
      sparkle: '#F5D76E',
    },
    warm: {
      top: dark ? '#1A2848' : '#24356E',
      bottom: dark ? '#2E7AB0' : '#3A9AD4',
      sparkle: '#FFCC80',
    },
    blaze: {
      top: dark ? '#2A1838' : '#2E2258',
      bottom: dark ? '#3A88B8' : '#4A9FD4',
      sparkle: '#FFB88C',
    },
    stellar: {
      top: dark ? '#1E1848' : '#2A2068',
      bottom: dark ? '#4A68C8' : '#6B7FD4',
      sparkle: '#D4B8FF',
    },
    legend: {
      top: dark ? '#281E10' : '#3A2E18',
      bottom: dark ? '#5A7A28' : '#8A9A38',
      sparkle: '#FFE08A',
    },
  };

  const palette = palettes[tier];
  const gradient = heroGradients[tier];
  const accentSparkle = gradient.sparkle;

  const heroGradientTop = mixHex(gradient.top, accentSparkle, progress * 0.18);
  const heroGradientBottom = mixHex(gradient.bottom, palette.accent, progress * 0.24);
  const heroBackground = mixHex(heroSurfaces[tier], palette.accent, progress * 0.12);
  const sparkleColor = mixHex(gradient.sparkle, palette.accent, progress * 0.2);

  const orbBase =
    tier === 'legend'
      ? 'rgba(245, 197, 66, 0.35)'
      : tier === 'stellar'
        ? 'rgba(184, 140, 255, 0.3)'
        : tier === 'blaze'
          ? 'rgba(240, 122, 69, 0.28)'
          : dark
            ? 'rgba(68, 215, 251, 0.22)'
            : 'rgba(255, 255, 255, 0.18)';

  return {
    tier,
    days,
    progress,
    ...palette,
    accent: mixHex(palette.accent, accentSparkle, progress * 0.15),
    glow: mixRgba(palette.glow, intensity),
    surface: mixRgba(palette.surface, intensity),
    heroBackground,
    heroGradientTop,
    heroGradientBottom,
    sparkleColor,
    orbColor: mixRgba(orbBase, intensity),
  };
}
