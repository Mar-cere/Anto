import {
  buildOnboardingStepHighlights,
  resolveOnboardingBrandAccent,
  resolveOnboardingGradient,
} from '../onboardingBrand';

const COLORS = {
  primary: '#1E83D3',
  primaryBright: '#44D7FB',
  accentSecondary: '#5B4BD4',
  accentWarm: '#E89BB8',
};

describe('onboardingBrand', () => {
  it('resolveOnboardingBrandAccent usa primary de marca', () => {
    expect(resolveOnboardingBrandAccent(COLORS)).toBe('#1E83D3');
    expect(resolveOnboardingBrandAccent({})).toBe('#1E83D3');
  });

  it('resolveOnboardingGradient expone cyan, azul, índigo y rosa de marca', () => {
    const light = resolveOnboardingGradient(COLORS, false);
    expect(light.start).toBe('#44D7FB');
    expect(light.mid).toBe('#1E83D3');
    expect(light.indigo).toBe('#5B4BD4');
    expect(light.warm).toBe('#E89BB8');

    const dark = resolveOnboardingGradient(COLORS, true);
    expect(dark.indigo).toBe('#5B4BD4');
    expect(dark.warm).toBe('#E89BB8');
  });

  it('buildOnboardingStepHighlights filtra líneas vacías', () => {
    expect(
      buildOnboardingStepHighlights(
        { STEP_1_HIGHLIGHTS: ['Uno', '', '  ', 'Dos'] },
        1,
      ),
    ).toEqual(['Uno', 'Dos']);
    expect(buildOnboardingStepHighlights({}, 1)).toEqual([]);
    expect(buildOnboardingStepHighlights({ STEP_2_HIGHLIGHTS: 'x' }, 2)).toEqual([]);
  });
});
