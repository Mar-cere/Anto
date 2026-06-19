/**
 * Guardrails del resumen semanal/mensual rediseñado.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('summaryScreen guard', () => {
  it('SummaryScreen usa hero, métricas y enlaces agrupados', () => {
    const src = readSrc('screens/SummaryScreen.js');
    expect(src).toMatch(/SummaryPeriodHero/);
    expect(src).toMatch(/SummaryMetricGrid/);
    expect(src).toMatch(/SummaryExploreLinks/);
    expect(src).toMatch(/DashboardBrandBackdrop/);
    expect(src).not.toMatch(/ParticleBackground/);
  });

  it('SummaryScreen prioriza métricas antes del narrativo', () => {
    const src = readSrc('screens/SummaryScreen.js');
    const block = src.slice(src.indexOf('<SummaryPeriodHero'), src.indexOf('<SummaryExploreLinks'));
    expect(block.indexOf('SummaryMetricGrid')).toBeGreaterThan(-1);
    expect(block.indexOf('SummaryNarrativeCard')).toBeGreaterThan(block.indexOf('SummaryMetricGrid'));
  });

  it('traducciones PROFILE incluyen copy conversacional del hero', () => {
    const es = readSrc('constants/translations/es.js');
    const en = readSrc('constants/translations/en.js');
    expect(es).toMatch(/SUMMARY_HERO_ACTIVE_WEEK:/);
    expect(es).toMatch(/SUMMARY_METRICS_SECTION:/);
    expect(en).toMatch(/SUMMARY_HERO_QUIET_WEEK:/);
    expect(en).toMatch(/SUMMARY_EXPLORE_SECTION:/);
  });
});
