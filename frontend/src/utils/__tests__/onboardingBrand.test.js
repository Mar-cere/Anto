import {
  buildOnboardingStepHighlights,
  resolveOnboardingBrandAccent,
  resolveOnboardingGradient,
} from '../onboardingBrand';

const COLORS = {
  primary: '#1E83D3',
  primaryBright: '#44D7FB',
  accentSecondary: '#5B4BD4',
};

describe('onboardingBrand', () => {
  it('resolveOnboardingBrandAccent usa primary de marca', () => {
    expect(resolveOnboardingBrandAccent(COLORS)).toBe('#1E83D3');
    expect(resolveOnboardingBrandAccent({})).toBe('#1E83D3');
  });

  it('resolveOnboardingGradient adapta fin según tema', () => {
    const light = resolveOnboardingGradient(COLORS, false);
    expect(light.start).toBe('#44D7FB');
    expect(light.mid).toBe('#1E83D3');
    expect(light.end).toBe('#24234F');

    const dark = resolveOnboardingGradient(COLORS, true);
    expect(dark.end).toBe('#5B4BD4');
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
