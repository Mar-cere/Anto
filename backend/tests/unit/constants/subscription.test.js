import { describe, it, expect, afterEach } from '@jest/globals';
import {
  APP_TRIAL_DAYS,
  APP_TRIAL_DURATION_MS,
  addTrialDays,
  computeTrialTimeRemaining,
  getAppTrialPublicConfig,
  getDefaultTrialRetentionAfterHours,
  getDefaultTrialRetentionMaxTrialHours,
  getWeeklySummaryTrialGiftDays,
} from '../../../constants/subscription.js';

describe('subscription constants', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('usa 1 día por defecto', () => {
    expect(APP_TRIAL_DAYS).toBe(1);
    expect(APP_TRIAL_DURATION_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('addTrialDays suma APP_TRIAL_DAYS desde la fecha dada', () => {
    const start = new Date('2026-06-01T12:00:00.000Z');
    const end = addTrialDays(start);
    expect(end.getTime() - start.getTime()).toBe(APP_TRIAL_DURATION_MS);
  });

  it('computeTrialTimeRemaining calcula días y horas', () => {
    const now = new Date('2026-06-01T12:00:00.000Z');
    const end = new Date('2026-06-02T06:00:00.000Z');
    const { daysRemaining, hoursRemaining } = computeTrialTimeRemaining(end, now);
    expect(daysRemaining).toBe(1);
    expect(hoursRemaining).toBe(18);
  });

  it('getAppTrialPublicConfig expone trialDays y regalo semanal', () => {
    expect(getAppTrialPublicConfig()).toEqual({
      trialDays: APP_TRIAL_DAYS,
      weeklySummaryTrialGiftDays: getWeeklySummaryTrialGiftDays(),
    });
  });

  it('defaults de retención derivan de APP_TRIAL_DAYS', () => {
    expect(getDefaultTrialRetentionAfterHours()).toBe(12);
    expect(getDefaultTrialRetentionMaxTrialHours()).toBe(30);
  });

  it('regalo resumen semanal default es 1 día con trial de 1 día', () => {
    expect(getWeeklySummaryTrialGiftDays()).toBe(1);
  });
});
