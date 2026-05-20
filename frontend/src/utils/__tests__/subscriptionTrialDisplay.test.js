import {
  computeTrialDaysRemaining,
  formatTrialStatusDescription,
} from '../subscriptionTrialDisplay';

describe('subscriptionTrialDisplay', () => {
  const now = new Date('2026-05-19T12:00:00.000Z');

  it('recalcula desde trialEndDate si la API devuelve 0', () => {
    const days = computeTrialDaysRemaining(0, '2026-05-22T23:59:59.000Z', now);
    expect(days).toBe(4);
  });

  it('respeta daysRemaining positivo de la API', () => {
    expect(computeTrialDaysRemaining(3, '2026-05-22T23:59:59.000Z', now)).toBe(3);
  });

  it('formatea singular y plural en español', () => {
    const texts = {
      DESCRIPTION_TRIAL_ONE: 'Trial activo - 1 día restante',
      DESCRIPTION_TRIAL_MANY: 'Trial activo - {days} días restantes',
    };
    expect(formatTrialStatusDescription(1, texts)).toBe(texts.DESCRIPTION_TRIAL_ONE);
    expect(formatTrialStatusDescription(4, texts)).toBe('Trial activo - 4 días restantes');
  });

  it('formatea singular y plural en inglés', () => {
    const texts = {
      DESCRIPTION_TRIAL_ONE: 'Active trial - 1 day remaining',
      DESCRIPTION_TRIAL_MANY: 'Active trial - {days} days remaining',
    };
    expect(formatTrialStatusDescription(1, texts)).toBe(texts.DESCRIPTION_TRIAL_ONE);
    expect(formatTrialStatusDescription(4, texts)).toBe('Active trial - 4 days remaining');
  });
});
