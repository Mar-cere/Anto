/**
 * Blindaje transversal: resumen + informe observacional.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'screens/SummaryScreen.js',
  'screens/WeeklyInsightScreen.js',
  'utils/summaryScreenUtils.js',
  'utils/weeklyInsightUtils.js',
  'components/summary/SummaryPeriodHero.js',
  'components/summary/SummaryMetricGrid.js',
  'components/summary/SummaryNarrativeCard.js',
  'components/summary/SummaryExploreLinks.js',
  'components/weeklyInsight/WeeklyInsightHero.js',
  'components/weeklyInsight/WeeklyInsightCard.js',
  'components/weeklyInsight/WeeklyInsightConductCard.js',
  'components/weeklyInsight/WeeklyInsightSourceStrip.js',
  'components/weeklyInsight/WeeklyInsightSettingsSection.js',
];

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('insightsExperience guard', () => {
  REQUIRED_FILES.forEach((file) => {
    it(`existe ${file}`, () => {
      expect(fs.existsSync(path.join(FRONTEND_SRC, file))).toBe(true);
    });
  });

  it('WeeklyInsightScreen persiste correlaciones para CTAs', () => {
    const src = readSrc('screens/WeeklyInsightScreen.js');
    expect(src).toMatch(/setCorrelations/);
    expect(src).toMatch(/enrichInsightRows/);
    expect(src).toMatch(/buildInsightRowNavigation/);
    expect(src).toMatch(/WeeklyInsightConductCard/);
  });

  it('SummaryScreen no bloquea métricas tras hero', () => {
    const src = readSrc('screens/SummaryScreen.js');
    expect(src).toMatch(/buildSummaryHeroCopy/);
    expect(src).toMatch(/formatSummaryPulseLine/);
    expect(src).not.toMatch(/await websocketService\.connect/);
  });

  it('SummaryScreen monta "lo que te ayuda" con navegación a la técnica', () => {
    const screen = readSrc('screens/SummaryScreen.js');
    expect(screen).toMatch(/import SummaryWhatHelpsSection/);
    expect(screen).toMatch(/<SummaryWhatHelpsSection \/>/);
    const section = readSrc('components/summary/SummaryWhatHelpsSection.js');
    expect(section).toMatch(/resolveInterventionScreen/);
    expect(section).toMatch(/recordInterventionClicked/);
    expect(section).toMatch(/navigation\.navigate/);
  });

  it('no quedan componentes de insights huérfanos sin montar', () => {
    expect(fs.existsSync(path.join(FRONTEND_SRC, 'components/summary/SummaryPatternsSection.js'))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(FRONTEND_SRC, 'components/InsightsQuickCard.js'))).toBe(false);
  });

  it('WeeklyInsightSettingsSection mantiene panel compacto colapsable', () => {
    const src = readSrc('components/weeklyInsight/WeeklyInsightSettingsSection.js');
    expect(src).toMatch(/SignalConsentPanel compact/);
    expect(src).toMatch(/DigitalHealthStatusCard compact/);
    expect(src).toMatch(/accessibilityState=\{\{ expanded \}\}/);
  });

  it('weeklyInsightUtils mapea psicoeducación alineada con PsychoeducationModule', () => {
    const moduleSrc = readSrc('screens/techniques/PsychoeducationModuleScreen.js');
    const utilsSrc = readSrc('utils/weeklyInsightUtils.js');
    const ids = [...moduleSrc.matchAll(/:\s+'(psychoeducation_[^']+)'/g)].map((m) => m[1]);
    ids.forEach((id) => {
      expect(utilsSrc).toContain(id);
    });
    expect(ids.length).toBeGreaterThanOrEqual(8);
  });
});
