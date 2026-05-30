import { describe, it, expect } from '@jest/globals';
import { computeCappedTrialEnd } from '../../../scripts/migrateActiveAppTrials.js';
import { APP_TRIAL_DURATION_MS } from '../../../constants/subscription.js';

describe('computeCappedTrialEnd', () => {
  const now = new Date('2026-06-10T12:00:00.000Z');

  it('devuelve null si el trial ya cabe en APP_TRIAL_DAYS', () => {
    const start = new Date('2026-06-10T00:00:00.000Z');
    const end = new Date(start.getTime() + APP_TRIAL_DURATION_MS);
    expect(computeCappedTrialEnd(start, end, now)).toBe(null);
  });

  it('recorta trial de 3 días a APP_TRIAL_DAYS desde inicio', () => {
    const start = new Date('2026-06-09T12:00:00.000Z');
    const end = new Date(start.getTime() + 3 * APP_TRIAL_DURATION_MS);
    const capped = computeCappedTrialEnd(start, end, now);
    expect(capped.getTime()).toBe(start.getTime() + APP_TRIAL_DURATION_MS);
  });

  it('devuelve null si el trial ya expiró', () => {
    const start = new Date('2026-06-01T00:00:00.000Z');
    const end = new Date('2026-06-05T00:00:00.000Z');
    expect(computeCappedTrialEnd(start, end, now)).toBe(null);
  });
});
