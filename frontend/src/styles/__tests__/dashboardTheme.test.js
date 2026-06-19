import { createDashboardStyles, getDashboardTheme } from '../dashboardTheme';
import { darkColors, lightColors } from '../themePalettes';

describe('dashboardTheme', () => {
  it('light y dark usan superficies distintas', () => {
    const light = getDashboardTheme(lightColors, 'light');
    const dark = getDashboardTheme(darkColors, 'dark');

    expect(light.SURFACE.backgroundColor).toBe(lightColors.surface);
    expect(dark.SURFACE.backgroundColor).toBe(darkColors.chromeCard);
    expect(light.SURFACE.backgroundColor).not.toBe(dark.SURFACE.backgroundColor);
    expect(light.HERO_SURFACE.backgroundColor).not.toBe(dark.HERO_SURFACE.backgroundColor);
  });

  it('ajusta sombras y pills según el esquema', () => {
    const light = getDashboardTheme(lightColors, 'light');
    const dark = getDashboardTheme(darkColors, 'dark');

    expect(light.SURFACE.shadowOpacity).toBeLessThan(dark.SURFACE.shadowOpacity);
    expect(light.PILL_DEFAULT.backgroundColor).not.toBe(dark.PILL_DEFAULT.backgroundColor);
  });

  it('createDashboardStyles expone tokens usados por el dashboard', () => {
    const lightStyles = createDashboardStyles(lightColors, 'light');
    const darkStyles = createDashboardStyles(darkColors, 'dark');

    for (const token of [
      'section',
      'surfaceCard',
      'groupedList',
      'groupedRow',
      'sectionTitle',
      'heroCard',
      'moodPill',
      'rowTitle',
    ]) {
      expect(lightStyles[token]).toBeDefined();
      expect(darkStyles[token]).toBeDefined();
    }

    expect(lightStyles.rowTitle.color).toBe(lightColors.text);
    expect(darkStyles.rowTitle.color).toBe(darkColors.text);
  });
});
