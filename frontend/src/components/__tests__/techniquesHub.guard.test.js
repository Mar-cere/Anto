/**
 * Guardrails del hub de técnicas y tab de navbar.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('techniquesHub guard', () => {
  it('FloatingNavBar usa tab techniques en lugar de pomodoro', () => {
    const src = readSrc('components/FloatingNavBar.js');
    expect(src).toMatch(/activeTab === 'techniques'/);
    expect(src).toMatch(/onNavPress\('Techniques'/);
    expect(src).toMatch(/TAB_TECHNIQUES_LABEL/);
    expect(src).toMatch(/diamond-outline/);
    expect(src).not.toMatch(/activeTab === 'pomodoro'/);
    expect(src).not.toMatch(/onNavPress\('Pomodoro'/);
    expect(src).not.toMatch(/TAB_POMODORO_LABEL/);
  });

  it('TechniquesHubScreen usa navegación centralizada', () => {
    const src = readSrc('screens/TechniquesHubScreen.js');
    expect(src).toMatch(/TECHNIQUES_HUB_FOCUS_TOOLS/);
    expect(src).toMatch(/TECHNIQUES_HUB_GUIDED/);
    expect(src).toMatch(/openTechniquesHubScreen/);
    expect(src).toMatch(/FloatingNavBar activeTab="techniques"/);
    expect(src).toMatch(/THERAPEUTIC_TECHNIQUES_ROUTE/);
  });

  it('Pomodoro ya no monta la navbar y vuelve al hub sin historial', () => {
    const src = readSrc('screens/PomodoroScreen.js');
    expect(src).not.toMatch(/FloatingNavBar/);
    expect(src).toMatch(/showBack/);
    const header = readSrc('components/pomodoro/PomodoroScreenHeader.js');
    expect(header).toMatch(/resolvePomodoroBackHandler/);
  });

  it('StackNavigator registra Techniques como hub', () => {
    const src = readSrc('navigation/StackNavigator.js');
    expect(src).toMatch(/TechniquesHubScreen/);
    expect(src).toMatch(/TECHNIQUES:\s*'Techniques'/);
    expect(src).toMatch(/POMODORO:\s*'Pomodoro'/);
  });

  it('PomodoroCard abre el hub de técnicas', () => {
    const src = readSrc('components/PomodoroCard.js');
    expect(src).toMatch(/navigate\('Techniques'\)/);
    expect(src).not.toMatch(/navigate\('Pomodoro'\)/);
  });

  it('traducciones NAV usan TAB_TECHNIQUES', () => {
    const es = readSrc('constants/translations/es.js');
    const en = readSrc('constants/translations/en.js');
    expect(es).toMatch(/TAB_TECHNIQUES_LABEL/);
    expect(en).toMatch(/TAB_TECHNIQUES_LABEL/);
    expect(es).toMatch(/export const TECHNIQUES_HUB/);
    expect(en).toMatch(/export const TECHNIQUES_HUB/);
  });
});
