import { ONBOARDING as ES_ONBOARDING } from '../../constants/translations/es';
import { ONBOARDING as EN_ONBOARDING } from '../../constants/translations/en';
import {
  ONBOARDING_REQUIRED_TRANSLATION_KEYS,
  ONBOARDING_STEP_COUNT,
  assertOnboardingContentValid,
  validateOnboardingContent,
  validateOnboardingTranslations,
  validateOnboardingTutorialSteps,
} from '../onboardingValidation';
import { buildOnboardingTutorialSteps } from '../onboardingSteps';

const COLORS = {
  primary: '#1E83D3',
  primaryBright: '#44D7FB',
  accentSecondary: '#5B4BD4',
  success: '#2ECC71',
};

describe('onboardingValidation', () => {
  it('traducciones ES y EN pasan validación completa', () => {
    expect(validateOnboardingContent(ES_ONBOARDING, COLORS)).toEqual([]);
    expect(validateOnboardingContent(EN_ONBOARDING, COLORS)).toEqual([]);
    expect(() => assertOnboardingContentValid(ES_ONBOARDING, COLORS)).not.toThrow();
    expect(() => assertOnboardingContentValid(EN_ONBOARDING, COLORS)).not.toThrow();
  });

  it('ES y EN comparten las mismas claves requeridas de ONBOARDING', () => {
    for (const key of ONBOARDING_REQUIRED_TRANSLATION_KEYS) {
      expect(ES_ONBOARDING).toHaveProperty(key);
      expect(EN_ONBOARDING).toHaveProperty(key);
    }
  });

  it('detecta traducciones incompletas', () => {
    const errors = validateOnboardingTranslations({
      ...ES_ONBOARDING,
      BENEFIT_2: '',
      DISCLAIMER: 'Sin límites',
    });
    expect(errors).toContain('missing:benefits');
    expect(errors).toContain('disclaimer:therapy');
    expect(errors).toContain('disclaimer:emergency');
  });

  it('detecta pasos con highlight inválido', () => {
    const steps = buildOnboardingTutorialSteps(ES_ONBOARDING, COLORS);
    const broken = steps.map((step, index) =>
      index === 0 ? { ...step, highlightElement: 'reminders' } : step,
    );
    const errors = validateOnboardingTutorialSteps(broken);
    expect(errors).toContain('step0:highlight:reminders');
  });

  it('exige exactamente cuatro pasos en el recorrido', () => {
    const steps = buildOnboardingTutorialSteps(ES_ONBOARDING, COLORS);
    expect(steps).toHaveLength(ONBOARDING_STEP_COUNT);
    expect(validateOnboardingTutorialSteps(steps.slice(0, 3))).toContain('steps:count:3');
  });
});
