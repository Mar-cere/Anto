/**
 * i18n SESSION_WAI (#98): paridad ES/EN y tono neutro.
 */
import en from '../en';
import es from '../es';

const ES_VOSEO =
  /\b(decírmelo|podés|querés|tenés|sabés|andá|dejá|contame|seguí|abrí|mirá|vení|decí|sentí|recordá|llegás|sentís)\b/i;

const WAI_KEYS = [
  'KICKER',
  'TITLE',
  'SUBTITLE',
  'AXIS_HEARD',
  'AXIS_SAFE',
  'AXIS_USEFUL',
  'AXIS_NO_PRESSURE',
  'SCALE_LOW',
  'SCALE_HIGH',
  'CTA_SUBMIT',
  'CTA_SKIP',
  'SUBMITTED',
  'SKIPPED',
  'ERROR',
];

const INSIGHT_REMINDER_KEYS = ['WAI_REMINDER_TITLE', 'WAI_REMINDER_BODY'];

describe('sessionWai i18n', () => {
  it('SESSION_WAI: paridad de claves es/en', () => {
    for (const key of WAI_KEYS) {
      expect(typeof es.SESSION_WAI[key]).toBe('string');
      expect(typeof en.SESSION_WAI[key]).toBe('string');
      expect(es.SESSION_WAI[key].length).toBeGreaterThan(0);
      expect(en.SESSION_WAI[key].length).toBeGreaterThan(0);
    }
  });

  it('SESSION_WAI es: sin voseo', () => {
    const hits = WAI_KEYS.filter((key) => ES_VOSEO.test(es.SESSION_WAI[key] || ''));
    expect(hits).toEqual([]);
  });

  it('recordatorio WAI en SESSION_INSIGHT es/en', () => {
    for (const key of INSIGHT_REMINDER_KEYS) {
      expect(es.SESSION_INSIGHT[key]).toBeTruthy();
      expect(en.SESSION_INSIGHT[key]).toBeTruthy();
    }
  });
});
