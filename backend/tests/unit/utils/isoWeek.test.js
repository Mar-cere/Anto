import { describe, it, expect } from '@jest/globals';
import { getUtcIsoWeekParts, getUtcIsoWeekNumber } from '../../../utils/isoWeek.js';

describe('isoWeek', () => {
  it('calcula 2025-W01 para 2025-01-01 UTC', () => {
    const d = new Date('2025-01-01T12:00:00.000Z');
    expect(getUtcIsoWeekParts(d).yearWeekKey).toBe('2025-W01');
    expect(getUtcIsoWeekNumber(d)).toBe(1);
  });

  it('calcula 2025-W02 para 2025-01-06 UTC (lunes)', () => {
    const d = new Date('2025-01-06T12:00:00.000Z');
    expect(getUtcIsoWeekParts(d).yearWeekKey).toBe('2025-W02');
  });
});
