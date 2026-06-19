import en from '../en';
import es from '../es';

const PROFILE_SUMMARY_KEYS = [
  'SUMMARY_HERO_ACTIVE_WEEK',
  'SUMMARY_HERO_QUIET_WEEK',
  'SUMMARY_HERO_ACTIVE_MONTH',
  'SUMMARY_HERO_QUIET_MONTH',
  'SUMMARY_METRICS_SECTION',
  'SUMMARY_EXPLORE_SECTION',
  'SUMMARY_NARRATIVE_TITLE',
  'SUMMARY_PULSE',
];

const TECHNIQUES_WEEKLY_KEYS = [
  'WEEKLY_INSIGHT_CONDUCT_TITLE',
  'WEEKLY_INSIGHT_CONDUCT_CTA',
  'WEEKLY_INSIGHT_ROW_CTA_PSYCHO',
  'WEEKLY_INSIGHT_ROW_CTA_TECHNIQUES',
  'WEEKLY_INSIGHT_SETTINGS_TITLE',
  'WEEKLY_INSIGHT_SETTINGS_HINT',
  'WEEKLY_INSIGHT_SOURCE_CHAT_DAYS',
  'WEEKLY_INSIGHT_SOURCE_TYPING',
  'WEEKLY_INSIGHT_SOURCE_PHENOTYPE',
];

describe('insights i18n parity', () => {
  it('PROFILE incluye claves del resumen rediseñado en ES y EN', () => {
    PROFILE_SUMMARY_KEYS.forEach((key) => {
      expect(es.PROFILE[key]).toBeTruthy();
      expect(en.PROFILE[key]).toBeTruthy();
    });
  });

  it('TECHNIQUES incluye claves del informe observacional en ES y EN', () => {
    TECHNIQUES_WEEKLY_KEYS.forEach((key) => {
      expect(es.TECHNIQUES[key]).toBeTruthy();
      expect(en.TECHNIQUES[key]).toBeTruthy();
    });
  });

  it('copy del resumen evita tono clínico en títulos', () => {
    expect(es.PROFILE.SUMMARY_NARRATIVE_TITLE).not.toMatch(/^Resumen$/);
    expect(es.PROFILE.SUMMARY_PULSE).not.toMatch(/Tono emocional/);
  });
});
