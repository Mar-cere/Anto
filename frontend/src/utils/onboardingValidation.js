/**
 * Validación estática del contenido y estructura del onboarding.
 */
import {
  buildOnboardingBenefits,
  buildOnboardingTutorialSteps,
} from './onboardingSteps.js';

export const ONBOARDING_STEP_COUNT = 4;

export const ONBOARDING_STEP_IDS = ['chat', 'techniques', 'home', 'safety'];

export const ONBOARDING_HIGHLIGHT_ELEMENTS = [
  'chat',
  'techniques',
  'home-focus',
  'settings',
];

export const ONBOARDING_REQUIRED_TRANSLATION_KEYS = [
  'WELCOME',
  'WELCOME_SUBTITLE',
  'WELCOME_DESCRIPTION',
  'BENEFIT_1',
  'BENEFIT_2',
  'BENEFIT_3',
  'BENEFITS_HEADING',
  'DISCLAIMER',
  'SKIP',
  'NEXT',
  'PREVIOUS',
  'GET_STARTED',
  'FINISH',
  'STEP_1_TITLE',
  'STEP_1_DESCRIPTION',
  'STEP_1_BENEFIT',
  'STEP_2_TITLE',
  'STEP_2_DESCRIPTION',
  'STEP_2_BENEFIT',
  'STEP_3_TITLE',
  'STEP_3_DESCRIPTION',
  'STEP_3_BENEFIT',
  'STEP_4_TITLE',
  'STEP_4_DESCRIPTION',
  'STEP_4_BENEFIT',
  'QUESTIONS_TITLE',
  'QUESTIONS_SUBTITLE',
  'QUESTIONS_BENEFITS_HEADING',
  'QUESTIONS_MAIN_LABEL',
  'QUESTIONS_SUBMIT',
  'QUESTIONS_FOCUS_OPTIONS',
];

const STEP_FIELDS = [
  'id',
  'title',
  'description',
  'benefit',
  'highlightElement',
  'icon',
  'color',
];

const DISCLAIMER_THERAPY_MARKERS = ['terapia', 'therapy'];
const DISCLAIMER_EMERGENCY_MARKERS = ['emergencia', 'emergency'];

export function validateOnboardingTranslations(onboarding = {}) {
  const errors = [];

  for (const key of ONBOARDING_REQUIRED_TRANSLATION_KEYS) {
    const value = onboarding[key];
    if (value === undefined || value === null || value === '') {
      errors.push(`missing:${key}`);
    }
  }

  const focusOptions = onboarding.QUESTIONS_FOCUS_OPTIONS;
  if (!Array.isArray(focusOptions) || focusOptions.length !== 5) {
    errors.push('invalid:QUESTIONS_FOCUS_OPTIONS');
  } else if (focusOptions.some((option) => !String(option || '').trim())) {
    errors.push('empty:QUESTIONS_FOCUS_OPTIONS');
  }

  const benefits = buildOnboardingBenefits(onboarding);
  if (benefits.length < 3) {
    errors.push('missing:benefits');
  }

  const disclaimer = String(onboarding.DISCLAIMER || '').toLowerCase();
  const hasTherapyLimit = DISCLAIMER_THERAPY_MARKERS.some((marker) =>
    disclaimer.includes(marker),
  );
  const hasEmergencyLimit = DISCLAIMER_EMERGENCY_MARKERS.some((marker) =>
    disclaimer.includes(marker),
  );
  if (!hasTherapyLimit) errors.push('disclaimer:therapy');
  if (!hasEmergencyLimit) errors.push('disclaimer:emergency');

  for (let step = 1; step <= ONBOARDING_STEP_COUNT; step += 1) {
    const benefit = onboarding[`STEP_${step}_BENEFIT`];
    if (!String(benefit || '').trim()) {
      errors.push(`missing:STEP_${step}_BENEFIT`);
    }
  }

  return errors;
}

export function validateOnboardingTutorialSteps(steps) {
  const errors = [];

  if (!Array.isArray(steps)) {
    return ['steps:not_array'];
  }

  if (steps.length !== ONBOARDING_STEP_COUNT) {
    errors.push(`steps:count:${steps.length}`);
  }

  steps.forEach((step, index) => {
    for (const field of STEP_FIELDS) {
      if (!step?.[field]) {
        errors.push(`step${index}:missing:${field}`);
      }
    }
    if (
      step?.highlightElement &&
      !ONBOARDING_HIGHLIGHT_ELEMENTS.includes(step.highlightElement)
    ) {
      errors.push(`step${index}:highlight:${step.highlightElement}`);
    }
  });

  const ids = steps.map((step) => step.id);
  if (JSON.stringify(ids) !== JSON.stringify(ONBOARDING_STEP_IDS)) {
    errors.push(`steps:ids:${ids.join(',')}`);
  }

  return errors;
}

export function validateOnboardingContent(
  onboarding = {},
  colors = {
    primary: '#1E83D3',
    primaryBright: '#44D7FB',
    accentSecondary: '#5B4BD4',
    success: '#2ECC71',
  },
) {
  const translationErrors = validateOnboardingTranslations(onboarding);
  const steps = buildOnboardingTutorialSteps(onboarding, colors);
  const stepErrors = validateOnboardingTutorialSteps(steps);
  return [...translationErrors, ...stepErrors];
}

export function assertOnboardingContentValid(onboarding, colors) {
  const errors = validateOnboardingContent(onboarding, colors);
  if (errors.length > 0) {
    throw new Error(`Onboarding inválido: ${errors.join(', ')}`);
  }
}
