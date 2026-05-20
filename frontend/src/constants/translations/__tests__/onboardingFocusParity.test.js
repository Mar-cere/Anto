import { ONBOARDING_FOCUS_LABELS } from '../../../../../backend/constants/onboardingFocusLabels.js';
import { getTranslations } from '../index';

describe('onboarding focus parity frontend/backend', () => {
  it('QUESTIONS_FOCUS_OPTIONS coincide en español', () => {
    expect(getTranslations('es').ONBOARDING.QUESTIONS_FOCUS_OPTIONS).toEqual(
      ONBOARDING_FOCUS_LABELS.es,
    );
  });

  it('QUESTIONS_FOCUS_OPTIONS coincide en inglés', () => {
    expect(getTranslations('en').ONBOARDING.QUESTIONS_FOCUS_OPTIONS).toEqual(
      ONBOARDING_FOCUS_LABELS.en,
    );
  });
});
