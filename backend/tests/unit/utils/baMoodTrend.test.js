import { describe, expect, it } from '@jest/globals';
import { computeBaMoodTrend } from '../../../utils/baMoodTrend.js';

describe('computeBaMoodTrend', () => {
  it('no es elegible con menos de 2 registros', () => {
    expect(computeBaMoodTrend([{ moodBefore: 3, moodAfter: 5 }])).toEqual({
      eligible: false,
      sampleSize: 1,
      avgDelta: null,
      direction: null,
    });
  });

  it('detecta mejora cuando el delta medio es positivo', () => {
    const trend = computeBaMoodTrend([
      { moodBefore: 3, moodAfter: 6 },
      { moodBefore: 4, moodAfter: 6 },
    ]);
    expect(trend.eligible).toBe(true);
    expect(trend.direction).toBe('improving');
    expect(trend.avgDelta).toBeGreaterThanOrEqual(2);
  });
});
