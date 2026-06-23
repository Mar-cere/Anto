import { resolveInsightsHeroGradient } from '../insightsHeroGradient';
import { darkColors, lightColors } from '../../styles/themePalettes';

describe('resolveInsightsHeroGradient', () => {
  it('oscuro: gradiente opaco sobre surface (sin rgba)', () => {
    const g = resolveInsightsHeroGradient(darkColors, true);
    expect(g.top).toBe('#0A1E45');
    expect(g.bottom).toBe(darkColors.surface);
    expect(g.top).not.toMatch(/rgba/i);
  });

  it('claro: gradiente suave pero legible', () => {
    const g = resolveInsightsHeroGradient(lightColors, false);
    expect(g.top).toBe('#D8E4F4');
    expect(g.bottom).toBe(lightColors.surface);
    expect(g.top).not.toMatch(/rgba/i);
  });
});
