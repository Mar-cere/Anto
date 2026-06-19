/**
 * Guardrails del onboarding alineado con la navbar y el home actuales.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('onboarding guard', () => {
  it('OnboardingTutorial cubre inicio, chat, recordatorios, técnicas y ajustes', () => {
    const src = readSrc('components/OnboardingTutorial.js');
    expect(src).toMatch(/highlightElement: 'home-focus'/);
    expect(src).toMatch(/highlightElement: 'chat'/);
    expect(src).toMatch(/highlightElement: 'reminders'/);
    expect(src).toMatch(/highlightElement: 'techniques'/);
    expect(src).toMatch(/highlightElement: 'settings'/);
    expect(src).toMatch(/STEP_5_TITLE/);
    expect(src).not.toMatch(/highlightElement: 'tasks-habits'/);
    expect(src).not.toMatch(/Dashboard Principal/);
  });

  it('TutorialHighlight resalta tabs de navbar y zona de foco del home', () => {
    const src = readSrc('components/TutorialHighlight.js');
    expect(src).toMatch(/'home-focus'/);
    expect(src).toMatch(/reminders:/);
    expect(src).toMatch(/techniques:/);
    expect(src).toMatch(/NAV_CENTER_WIDTH/);
    expect(src).not.toMatch(/height: 300/);
  });

  it('traducciones ES describen el hub de técnicas y recordatorios', () => {
    const src = readSrc('constants/translations/es.js');
    expect(src).toMatch(/STEP_3_TITLE: 'Recordatorios'/);
    expect(src).toMatch(/STEP_4_TITLE: 'Técnicas'/);
    expect(src).toMatch(/STEP_5_TITLE: 'Seguridad y perfil'/);
    expect(src).toMatch(/foco del día/);
    expect(src).not.toMatch(/STEP_4_TITLE: 'Contactos de Emergencia'/);
  });

  it('traducciones EN mantienen paridad de pasos del tutorial', () => {
    const src = readSrc('constants/translations/en.js');
    expect(src).toMatch(/STEP_3_TITLE: 'Reminders'/);
    expect(src).toMatch(/STEP_4_TITLE: 'Techniques'/);
    expect(src).toMatch(/STEP_5_TITLE: 'Safety and profile'/);
  });
});
