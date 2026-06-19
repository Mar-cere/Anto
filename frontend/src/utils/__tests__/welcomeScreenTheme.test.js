import { darkColors, lightColors } from '../../styles/themePalettes';
import { getWelcomeScreenTheme } from '../welcomeScreenTheme';

describe('welcomeScreenTheme', () => {
  it('expone paleta clara con logo icon.png', () => {
    const theme = getWelcomeScreenTheme('light', lightColors);
    expect(theme.background).toBe(lightColors.background);
    expect(theme.text).toBe(lightColors.text);
    expect(theme.logo).toBeTruthy();
  });

  it('expone paleta oscura con logo Anto.png', () => {
    const theme = getWelcomeScreenTheme('dark', darkColors);
    expect(theme.background).toBe(darkColors.background);
    expect(theme.accent).toBe(darkColors.primaryBright);
    expect(theme.logo).toBeTruthy();
  });

  it('ajusta acento y botón secundario entre claro y oscuro', () => {
    const light = getWelcomeScreenTheme('light', lightColors);
    const dark = getWelcomeScreenTheme('dark', darkColors);
    expect(light.background).not.toBe(dark.background);
    expect(light.secondaryBtnText).not.toBe(dark.secondaryBtnText);
  });
});
