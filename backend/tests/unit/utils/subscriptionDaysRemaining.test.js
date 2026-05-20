import { describe, expect, it } from '@jest/globals';
import { calculateDaysRemainingUntil } from '../../../utils/subscriptionDaysRemaining.js';

describe('calculateDaysRemainingUntil', () => {
  const now = new Date('2026-05-19T12:00:00.000Z');

  it('devuelve días hasta fin de trial', () => {
    const end = new Date('2026-05-22T23:59:59.000Z');
    expect(calculateDaysRemainingUntil(end, now)).toBe(4);
  });

  it('devuelve 0 si la fecha ya pasó', () => {
    const end = new Date('2026-05-18T00:00:00.000Z');
    expect(calculateDaysRemainingUntil(end, now)).toBe(0);
  });

  it('devuelve 0 sin fecha', () => {
    expect(calculateDaysRemainingUntil(null, now)).toBe(0);
  });
});
