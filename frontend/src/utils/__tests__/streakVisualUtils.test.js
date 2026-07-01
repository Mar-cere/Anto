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

  it('expone gradiente y brillo para la tarjeta dinámica', () => {
    const visual = getStreakVisual(1, { primary: '#1E83D3' }, 'light');
    expect(visual.heroGradientTop).toBeTruthy();
    expect(visual.heroGradientBottom).toBeTruthy();
    expect(visual.sparkleColor).toBeTruthy();
  });

  it('activa pulso a partir de 1 día', () => {
    expect(getStreakVisual(0, {}, 'dark').pulse).toBe(false);
    expect(getStreakVisual(3, {}, 'dark').pulse).toBe(true);
    expect(getStreakVisual(30, {}, 'dark').icon).toBe('trophy');
  });

  it('todos los tiers exponen gradiente y brillo para tarjeta dinámica', () => {
    [0, 1, 5, 10, 21, 45].forEach((days) => {
      const visual = getStreakVisual(days, { primary: '#1E83D3' }, 'light');
      expect(visual.heroGradientTop).toMatch(/^#/);
      expect(visual.heroGradientBottom).toMatch(/^#/);
      expect(visual.sparkleColor).toMatch(/^#/);
    });
  });

  it('intensifica colores al avanzar dentro del nivel', () => {
    const early = getStreakVisual(3, { primary: '#1E83D3' }, 'dark');
    const late = getStreakVisual(6, { primary: '#1E83D3' }, 'dark');
    expect(early.tier).toBe('warm');
    expect(late.tier).toBe('warm');
    expect(late.progress).toBeGreaterThan(early.progress);
    expect(late.heroGradientBottom).not.toBe(early.heroGradientBottom);
  });
});
