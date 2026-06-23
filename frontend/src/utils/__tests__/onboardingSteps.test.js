import { buildOnboardingBenefits, buildOnboardingTutorialSteps } from '../onboardingSteps';

describe('onboardingSteps', () => {
  const highlights = ['A', 'B', 'C'];

  const texts = {
    STEP_1_LABEL: 'Step 1',
    STEP_1_TITLE: 'Chat',
    STEP_1_DESCRIPTION: 'Desc chat',
    STEP_1_BENEFIT: 'Benefit chat',
    STEP_1_HIGHLIGHTS: highlights,
    STEP_2_LABEL: 'Step 2',
    STEP_2_TITLE: 'Tools',
    STEP_2_DESCRIPTION: 'Desc tools',
    STEP_2_BENEFIT: 'Benefit tools',
    STEP_2_HIGHLIGHTS: highlights,
    STEP_3_LABEL: 'Step 3',
    STEP_3_TITLE: 'Home',
    STEP_3_DESCRIPTION: 'Desc home',
    STEP_3_BENEFIT: 'Benefit home',
    STEP_3_HIGHLIGHTS: highlights,
    STEP_4_LABEL: 'Step 4',
    STEP_4_TITLE: 'Safety',
    STEP_4_DESCRIPTION: 'Desc safety',
    STEP_4_BENEFIT: 'Benefit safety',
    STEP_4_HIGHLIGHTS: highlights,
    BENEFIT_1: 'One',
    BENEFIT_2: 'Two',
    BENEFIT_3: 'Three',
  };

  const colors = {
    primary: '#1E83D3',
    primaryBright: '#44D7FB',
    accentSecondary: '#5B4BD4',
    success: '#2ECC71',
  };

  it('buildOnboardingTutorialSteps expone chat, técnicas, inicio y ajustes', () => {
    const steps = buildOnboardingTutorialSteps(texts, colors);
    expect(steps).toHaveLength(4);
    expect(steps.map((s) => s.highlightElement)).toEqual([
      'chat',
      'techniques',
      'home-focus',
      'settings',
    ]);
    expect(steps[0].benefit).toBe('Benefit chat');
    expect(steps[0].highlights).toEqual(highlights);
    expect(steps.every((step) => step.color === colors.primary)).toBe(true);
  });

  it('buildOnboardingBenefits filtra vacíos', () => {
    expect(buildOnboardingBenefits(texts)).toEqual(['One', 'Two', 'Three']);
    expect(buildOnboardingBenefits({ BENEFIT_1: '', BENEFIT_2: 'X' })).toEqual(['X']);
  });
});
