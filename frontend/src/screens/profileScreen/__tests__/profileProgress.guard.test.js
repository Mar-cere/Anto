/**
 * Guardrails: progreso en Perfil, no duplicado en Configuración.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('profileProgress guard', () => {
  it('ProfileProgressSection agrupa resumen, patrones y mapa con señales', () => {
    const src = readSrc('screens/profileScreen/ProfileProgressSection.js');
    expect(src).toMatch(/PROGRESS_TITLE/);
    expect(src).toMatch(/ActivitySummary/);
    expect(src).toMatch(/WeeklyInsight/);
    expect(src).toMatch(/InterventionGraph/);
    expect(src).toMatch(/SignalConsentPanel/);
    expect(src).toMatch(/DigitalHealthStatusCard/);
  });

  it('ProfileScreen muestra Progreso antes de Estadísticas', () => {
    const src = readSrc('screens/ProfileScreen.js');
    const body = src.slice(src.indexOf('<ScrollView'));
    const progressIdx = body.indexOf('ProfileProgressSection');
    const statsIdx = body.indexOf('ProfileStats');
    expect(progressIdx).toBeGreaterThan(-1);
    expect(statsIdx).toBeGreaterThan(progressIdx);
  });

  it('ProfileOptions ya no incluye enlaces de progreso', () => {
    const src = readSrc('screens/profileScreen/ProfileOptions.js');
    expect(src).not.toMatch(/ActivitySummary/);
    expect(src).not.toMatch(/WeeklyInsight/);
    expect(src).not.toMatch(/InterventionGraph/);
  });

  it('SettingsContent no duplica la sección Patrones y señales', () => {
    const src = readSrc('components/settings/SettingsContent.js');
    expect(src).not.toMatch(/SECTION_PATTERNS/);
    expect(src).not.toMatch(/SignalConsentPanel/);
    expect(src).not.toMatch(/InterventionGraph/);
  });

  it('settingsScreenConstants ya no expone claves de Patrones y señales', () => {
    const src = readSrc('screens/settings/settingsScreenConstants.js');
    expect(src).not.toMatch(/SECTION_PATTERNS/);
    expect(src).not.toMatch(/PATTERNS_OPEN_/);
  });

  it('traducciones PROFILE incluyen Progreso en ES y EN', () => {
    const es = readSrc('constants/translations/es.js');
    const en = readSrc('constants/translations/en.js');
    expect(es).toMatch(/PROGRESS_TITLE: 'Progreso'/);
    expect(en).toMatch(/PROGRESS_TITLE: 'Progress'/);
    expect(es).toMatch(/PROGRESS_INTRO:/);
    expect(en).toMatch(/PROGRESS_INTRO:/);
  });

  it('traducciones SETTINGS ya no incluyen Patrones y señales', () => {
    const es = readSrc('constants/translations/es.js');
    const en = readSrc('constants/translations/en.js');
    const esSettings = es.slice(es.indexOf('export const SETTINGS'), es.indexOf('export const AUTH'));
    const enSettings = en.slice(en.indexOf('export const SETTINGS'), en.indexOf('export const AUTH'));
    expect(esSettings).not.toMatch(/SECTION_PATTERNS/);
    expect(enSettings).not.toMatch(/SECTION_PATTERNS/);
  });
});
