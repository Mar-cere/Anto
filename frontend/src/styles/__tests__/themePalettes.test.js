import { darkColors, lightColors } from '../themePalettes';

describe('themePalettes warning', () => {
  it('modo claro usa ámbar oscuro, no amarillo limón', () => {
    expect(lightColors.warning).not.toBe('#FFD93D');
    expect(lightColors.warningForeground).toBe('#FFFFFF');
    expect(lightColors.warningSoft).toBeTruthy();
    expect(lightColors.warningBorder).toBeTruthy();
  });

  it('modo oscuro mantiene warning con texto oscuro sobre fondo claro', () => {
    expect(darkColors.warningForeground).toBeTruthy();
    expect(darkColors.warningSoft).toBeTruthy();
  });

  it('accentSecondary disponible en ambos temas para acentos de marca', () => {
    expect(lightColors.accentSecondary).toBe('#5B4BD4');
    expect(darkColors.accentSecondary).toBe('#8B7FE8');
  });
});
