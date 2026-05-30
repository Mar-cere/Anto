import { describe, it, expect } from '@jest/globals';
import { getDefaultTrialRetentionAfterHours } from '../../../constants/subscription.js';
import {
  buildTrialRetentionBaseFilter,
  computeTrialSpanMs,
  isTrialSpanEligibleForRetention,
  validateUserForTrialRetentionSend
} from '../../../services/emailMarketingService.js';

describe('buildTrialRetentionBaseFilter', () => {
  it('exige fechas de trial presentes y ventana de inicio', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const f = buildTrialRetentionBaseFilter(now, 12);
    expect(f['subscription.status']).toBe('trial');
    expect(f['subscription.trialStartDate'].$lte).toEqual(new Date('2026-06-10T00:00:00.000Z'));
    expect(f['subscription.trialEndDate'].$gt).toEqual(now);
    expect(f['subscription.trialStartDate'].$exists).toBe(true);
    expect(f['subscription.trialEndDate'].$exists).toBe(true);
  });

  it('usa default de APP_TRIAL_DAYS si afterHours es inválido', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const f = buildTrialRetentionBaseFilter(now, NaN);
    const expectedHours = getDefaultTrialRetentionAfterHours();
    expect(f['subscription.trialStartDate'].$lte).toEqual(
      new Date(now.getTime() - expectedHours * 60 * 60 * 1000)
    );
  });
});

describe('computeTrialSpanMs', () => {
  it('devuelve null si faltan fechas válidas', () => {
    expect(computeTrialSpanMs(null, new Date())).toBe(null);
    expect(computeTrialSpanMs(new Date(), 'no-date')).toBe(null);
  });

  it('calcula duración en ms', () => {
    const a = new Date('2026-06-01T00:00:00.000Z');
    const b = new Date('2026-06-04T00:00:00.000Z');
    expect(computeTrialSpanMs(a, b)).toBe(3 * 24 * 60 * 60 * 1000);
  });
});

describe('isTrialSpanEligibleForRetention', () => {
  it('rechaza null o fuera de rango', () => {
    expect(isTrialSpanEligibleForRetention(null, 96 * 3600000)).toBe(false);
    expect(isTrialSpanEligibleForRetention(0, 96 * 3600000)).toBe(false);
    expect(isTrialSpanEligibleForRetention(100 * 3600000, 96 * 3600000)).toBe(false);
  });

  it('acepta trial corto dentro del tope', () => {
    const maxMs = 30 * 3600000;
    expect(isTrialSpanEligibleForRetention(24 * 3600000, maxMs)).toBe(true);
  });
});

describe('validateUserForTrialRetentionSend', () => {
  const future = new Date(Date.now() + 48 * 3600000);

  it('rechaza email inválido', () => {
    const r = validateUserForTrialRetentionSend(
      { email: 'mal', username: 'u', subscription: { trialEndDate: future } },
      new Date()
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_email');
  });

  it('acepta email válido y username vacío como Usuario', () => {
    const r = validateUserForTrialRetentionSend(
      { email: 'a@b.co', username: '   ', subscription: { trialEndDate: future } },
      new Date()
    );
    expect(r.ok).toBe(true);
    expect(r.username).toBe('Usuario');
  });

  it('rechaza trial ya vencido', () => {
    const past = new Date(Date.now() - 3600000);
    const r = validateUserForTrialRetentionSend(
      { email: 'a@b.co', username: 'x', subscription: { trialEndDate: past } },
      new Date()
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('trial_already_ended');
  });
});
