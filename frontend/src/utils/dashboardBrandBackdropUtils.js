/**
 * Capas de fondo con halos de marca para el dashboard.
 */

export const BRAND_HALO_KEYS = ['blue', 'indigo', 'rose'];

const LIGHT_HALO_COLORS = {
  blue: 'rgba(30, 131, 211, 0.11)',
  indigo: 'rgba(29, 27, 112, 0.07)',
  rose: 'rgba(232, 155, 184, 0.10)',
};

const DARK_HALO_COLORS = {
  blue: 'rgba(68, 215, 251, 0.14)',
  indigo: 'rgba(29, 27, 112, 0.32)',
  rose: 'rgba(232, 155, 184, 0.15)',
};

/**
 * @param {'light'|'dark'} resolvedScheme
 * @param {{ background?: string, gradientTop?: string }} colors
 */
export function getHaloLayers(resolvedScheme, colors = {}) {
  const light = resolvedScheme === 'light';
  const haloColors = light ? LIGHT_HALO_COLORS : DARK_HALO_COLORS;

  return [
    {
      key: 'base',
      style: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: colors.background,
      },
    },
    {
      key: 'wash',
      style: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: colors.gradientTop,
        opacity: light ? 0.42 : 0.38,
      },
    },
    {
      key: 'blue',
      style: {
        top: -72,
        left: -56,
        width: 268,
        height: 268,
        borderRadius: 134,
        backgroundColor: haloColors.blue,
      },
    },
    {
      key: 'indigo',
      style: {
        top: '14%',
        right: -88,
        width: 228,
        height: 228,
        borderRadius: 114,
        backgroundColor: haloColors.indigo,
      },
    },
    {
      key: 'rose',
      style: {
        bottom: 96,
        left: '22%',
        width: 252,
        height: 252,
        borderRadius: 126,
        backgroundColor: haloColors.rose,
      },
    },
  ];
}

export function getBrandHaloColor(resolvedScheme, haloKey) {
  const palette = resolvedScheme === 'light' ? LIGHT_HALO_COLORS : DARK_HALO_COLORS;
  return palette[haloKey] || null;
}
