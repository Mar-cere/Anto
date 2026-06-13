import en from '../en';
import es from '../es';
import { buildMappedSectionTexts } from '../../../hooks/useTranslations';

const SUMMARY_DEFAULTS = {
  WEEKLY_INSIGHT_CTA: 'Ver patrones de la semana',
  WEEKLY_INSIGHT_CTA_HINT: 'Informe observacional, no diagnóstico.',
  MONTHLY_INSIGHT_CTA: 'Ver patrones del mes',
  MONTHLY_INSIGHT_CTA_HINT: 'Informe observacional del mes, no diagnóstico.',
};

const SUMMARY_KEY_MAP = {
  WEEKLY_INSIGHT_CTA: 'SUMMARY_WEEKLY_INSIGHT_CTA',
  WEEKLY_INSIGHT_CTA_HINT: 'SUMMARY_WEEKLY_INSIGHT_CTA_HINT',
  MONTHLY_INSIGHT_CTA: 'SUMMARY_MONTHLY_INSIGHT_CTA',
  MONTHLY_INSIGHT_CTA_HINT: 'SUMMARY_MONTHLY_INSIGHT_CTA_HINT',
};

describe('summary weekly insight i18n', () => {
  it('PROFILE incluye claves del CTA en es y en', () => {
    expect(es.PROFILE.SUMMARY_WEEKLY_INSIGHT_CTA).toBeTruthy();
    expect(en.PROFILE.SUMMARY_WEEKLY_INSIGHT_CTA).toBeTruthy();
    expect(es.PROFILE.SUMMARY_WEEKLY_INSIGHT_CTA_HINT).toBeTruthy();
    expect(en.PROFILE.SUMMARY_WEEKLY_INSIGHT_CTA_HINT).toBeTruthy();
    expect(es.PROFILE.SUMMARY_MONTHLY_INSIGHT_CTA).toBeTruthy();
    expect(en.PROFILE.SUMMARY_MONTHLY_INSIGHT_CTA).toBeTruthy();
  });

  it('useMappedSectionTexts resuelve inglés desde PROFILE', () => {
    const texts = buildMappedSectionTexts(en.PROFILE, SUMMARY_DEFAULTS, SUMMARY_KEY_MAP);
    expect(texts.WEEKLY_INSIGHT_CTA).toBe('See weekly patterns');
    expect(texts.WEEKLY_INSIGHT_CTA_HINT).toBe('Observational report, not a diagnosis.');
    expect(texts.MONTHLY_INSIGHT_CTA).toBe('See monthly patterns');
    expect(texts.MONTHLY_INSIGHT_CTA_HINT).toBe('Monthly observational report, not a diagnosis.');
  });
});
