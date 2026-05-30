import {
  DEFAULT_APP_TRIAL_DAYS,
  formatTrialPeriodLabel,
  applyTrialPeriodToFaq,
} from '../../constants/subscription';

describe('subscription constants (frontend)', () => {
  it('formatTrialPeriodLabel ES/EN', () => {
    expect(formatTrialPeriodLabel(1, 'es')).toBe('1 día');
    expect(formatTrialPeriodLabel(3, 'es')).toBe('3 días');
    expect(formatTrialPeriodLabel(1, 'en')).toBe('1-day');
    expect(formatTrialPeriodLabel(3, 'en')).toBe('3-day');
  });

  it('applyTrialPeriodToFaq sustituye token', () => {
    const sections = [
      {
        category: 'Pago',
        items: [
          {
            question: '¿Trial?',
            answer: 'Prueba de {{TRIAL_PERIOD}} gratis.',
          },
        ],
      },
    ];
    const out = applyTrialPeriodToFaq(sections, '1 día');
    expect(out[0].items[0].answer).toBe('Prueba de 1 día gratis.');
  });

  it('DEFAULT_APP_TRIAL_DAYS es 1', () => {
    expect(DEFAULT_APP_TRIAL_DAYS).toBe(1);
  });
});
