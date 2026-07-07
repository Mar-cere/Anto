/**
 * Guardrails visuales y de copy del dashboard (racha, insight, fondo).
 */
import en from '../en';
import es from '../es';

const DASH_STREAK_CARD_KEYS = [
  'STREAK_CARD_DAY_UNIT',
  'STREAK_CARD_DAYS_UNIT',
  'STREAK_CARD_NUDGE',
  'STREAK_CHIP_ONE',
  'STREAK_TIER_EMBER',
  'STREAK_TIER_EMBER_0',
  'STREAK_NUDGE_EMBER_0',
  'STREAK_NUDGE_LEGEND_3',
];

const FORBIDDEN_VOSEO = /\b(seguí|querés|podés)\b/i;

describe('dashboardVisualTone', () => {
  it('DASH es/en: claves de tarjeta de racha presentes', () => {
    DASH_STREAK_CARD_KEYS.forEach((key) => {
      expect(es.DASH[key]?.trim?.()).toBeTruthy();
      expect(en.DASH[key]?.trim?.()).toBeTruthy();
    });
  });

  it('DASH es: nudges sin voseo', () => {
    const nudgeKeys = Object.keys(es.DASH).filter((key) => key.startsWith('STREAK_NUDGE_'));
    expect(nudgeKeys.length).toBeGreaterThanOrEqual(20);
    nudgeKeys.forEach((key) => {
      expect(es.DASH[key]).not.toMatch(FORBIDDEN_VOSEO);
    });
    expect(es.DASH.STREAK_CARD_NUDGE).toMatch(/sigue así/i);
  });

  it('DASH es/en: sección de insight presente', () => {
    expect(es.DASH.HOME_INSIGHT_SECTION?.trim?.()).toBeTruthy();
    expect(en.DASH.HOME_INSIGHT_SECTION?.trim?.()).toBeTruthy();
  });
});
