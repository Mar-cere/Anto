import { getStreakVisual, resolveStreakTier } from '../streakVisualUtils';

describe('streakVisualUtils', () => {
  it('resuelve tier por días', () => {
    expect(resolveStreakTier(0)).toBe('none');
    expect(resolveStreakTier(1)).toBe('ember');
    expect(resolveStreakTier(5)).toBe('warm');
    expect(resolveStreakTier(10)).toBe('blaze');
    expect(resolveStreakTier(21)).toBe('stellar');
    expect(resolveStreakTier(45)).toBe('legend');
  });

  it('activa pulso a partir de 1 día', () => {
    expect(getStreakVisual(0, {}, 'dark').pulse).toBe(false);
    expect(getStreakVisual(3, {}, 'dark').pulse).toBe(true);
    expect(getStreakVisual(30, {}, 'dark').icon).toBe('trophy');
  });
});
