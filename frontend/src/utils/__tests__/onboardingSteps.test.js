import { buildOnboardingBenefits, buildOnboardingTutorialSteps } from '../onboardingSteps';

describe('onboardingSteps', () => {
  const texts = {
    STEP_1_TITLE: 'Chat',
    STEP_1_DESCRIPTION: 'Desc chat',
    STEP_1_BENEFIT: 'Benefit chat',
    STEP_2_TITLE: 'Tools',
    STEP_2_DESCRIPTION: 'Desc tools',
    STEP_2_BENEFIT: 'Benefit tools',
    STEP_3_TITLE: 'Home',
    STEP_3_DESCRIPTION: 'Desc home',
    STEP_3_BENEFIT: 'Benefit home',
    STEP_4_TITLE: 'Safety',
    STEP_4_DESCRIPTION: 'Desc safety',
    STEP_4_BENEFIT: 'Benefit safety',
    BENEFIT_1: 'One',
    BENEFIT_2: 'Two',
    BENEFIT_3: 'Three',
  };

  const colors = {
    primary: '#1E83D3',
    primaryBright: '#44D7FB',
    warning: '#F5A623',
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
  });

  it('buildOnboardingBenefits filtra vacíos', () => {
    expect(buildOnboardingBenefits(texts)).toEqual(['One', 'Two', 'Three']);
    expect(buildOnboardingBenefits({ BENEFIT_1: '', BENEFIT_2: 'X' })).toEqual(['X']);
  });
});
