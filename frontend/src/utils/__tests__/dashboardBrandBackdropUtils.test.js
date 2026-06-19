import {
  BRAND_HALO_KEYS,
  getBrandHaloColor,
  getHaloLayers,
} from '../dashboardBrandBackdropUtils';

describe('dashboardBrandBackdropUtils', () => {
  const colors = {
    background: '#E8EDF8',
    gradientTop: '#FCF6F9',
  };

  it('coloca base y wash antes que los halos visibles', () => {
    const layers = getHaloLayers('light', colors);
    const keys = layers.map((layer) => layer.key);
    expect(keys.indexOf('base')).toBeLessThan(keys.indexOf('blue'));
    expect(keys.indexOf('wash')).toBeLessThan(keys.indexOf('indigo'));
    expect(keys.indexOf('rose')).toBe(keys.length - 1);
  });

  it('incluye los tres halos de marca', () => {
    const keys = getHaloLayers('light', colors).map((layer) => layer.key);
    BRAND_HALO_KEYS.forEach((key) => {
      expect(keys).toContain(key);
    });
  });

  it('usa opacidades más tenues en modo claro', () => {
    const lightBlue = getBrandHaloColor('light', 'blue');
    const darkBlue = getBrandHaloColor('dark', 'blue');
    const lightOpacity = Number(lightBlue.match(/[\d.]+(?=\))/)?.[0]);
    const darkOpacity = Number(darkBlue.match(/[\d.]+(?=\))/)?.[0]);
    expect(lightOpacity).toBeLessThan(darkOpacity);
  });

  it('evita amarillo warning en halos', () => {
    BRAND_HALO_KEYS.forEach((key) => {
      ['light', 'dark'].forEach((scheme) => {
        const color = getBrandHaloColor(scheme, key);
        expect(color.toLowerCase()).not.toContain('#ffd93d');
        expect(color).toMatch(/rgba/i);
      });
    });
  });
});
