/**
 * Blindaje paleta clara: warning legible y tokens de marca.
 */
import fs from 'fs';
import path from 'path';
import { darkColors, lightColors } from '../styles/themePalettes';

const FRONTEND_SRC = path.resolve(__dirname, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('themeVisual guard', () => {
  it('modo claro evita amarillo limón en warning', () => {
    expect(lightColors.warning).not.toBe('#FFD93D');
    expect(lightColors.warningForeground).toBe('#FFFFFF');
    expect(lightColors.warningSoft).toBeTruthy();
    expect(lightColors.warningBorder).toBeTruthy();
    expect(lightColors.accentSecondary).toBe('#5B4BD4');
  });

  it('Toast warning usa foreground sobre fondo warning', () => {
    const toast = readSrc('components/Toast.js');
    expect(toast).toMatch(/warningForeground/);
  });

  it('icono de racha en perfil no usa warning', () => {
    const profile = readSrc('screens/profileScreen/profileScreenConstants.js');
    expect(profile).toMatch(/STAT_ICON_STREAK: colors\.accentWarm/);
    expect(profile).not.toMatch(/STAT_ICON_STREAK: colors\.warning/);
  });
});
