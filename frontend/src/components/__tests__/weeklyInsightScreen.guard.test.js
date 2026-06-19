/**
 * Guardrails del informe observacional rediseñado.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('weeklyInsightScreen guard', () => {
  it('WeeklyInsightScreen usa hero, chips y tarjetas accionables', () => {
    const src = readSrc('screens/WeeklyInsightScreen.js');
    expect(src).toMatch(/WeeklyInsightHero/);
    expect(src).toMatch(/WeeklyInsightCard/);
    expect(src).toMatch(/WeeklyInsightSourceStrip/);
    expect(src).toMatch(/formatInsightPeriodLabel/);
    expect(src).toMatch(/DashboardBrandBackdrop/);
    expect(src).not.toMatch(/ParticleBackground/);
  });

  it('WeeklyInsightSettingsSection colapsa ajustes cuando hay contenido', () => {
    const src = readSrc('screens/WeeklyInsightScreen.js');
    expect(src).toMatch(/WeeklyInsightSettingsSection/);
    expect(src).toMatch(/defaultExpanded=\{!hasInsightContent\}/);
  });

  it('traducciones TECHNIQUES incluyen copy del informe mejorado', () => {
    const es = readSrc('constants/translations/es.js');
    const en = readSrc('constants/translations/en.js');
    expect(es).toMatch(/WEEKLY_INSIGHT_SETTINGS_TITLE:/);
    expect(es).toMatch(/WEEKLY_INSIGHT_ROW_CTA_PSYCHO:/);
    expect(en).toMatch(/WEEKLY_INSIGHT_SOURCE_CHAT_DAYS:/);
  });
});
