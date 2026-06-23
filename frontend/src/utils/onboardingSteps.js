/**
 * Pasos del recorrido de onboarding (contenido + highlight en UI).
 */
import {
  buildOnboardingStepHighlights,
  resolveOnboardingBrandAccent,
} from './onboardingBrand.js';

export { resolveOnboardingBrandAccent, buildOnboardingStepHighlights };

export function buildOnboardingTutorialSteps(texts, colors) {
  const accent = resolveOnboardingBrandAccent(colors);

  const steps = [
    {
      id: 'chat',
      icon: 'message-text',
      stepLabel: texts.STEP_1_LABEL,
      title: texts.STEP_1_TITLE,
      description: texts.STEP_1_DESCRIPTION,
      benefit: texts.STEP_1_BENEFIT,
      highlights: buildOnboardingStepHighlights(texts, 1),
      highlightElement: 'chat',
    },
    {
      id: 'techniques',
      icon: 'brain',
      stepLabel: texts.STEP_2_LABEL,
      title: texts.STEP_2_TITLE,
      description: texts.STEP_2_DESCRIPTION,
      benefit: texts.STEP_2_BENEFIT,
      highlights: buildOnboardingStepHighlights(texts, 2),
      highlightElement: 'techniques',
    },
    {
      id: 'home',
      icon: 'home-heart',
      stepLabel: texts.STEP_3_LABEL,
      title: texts.STEP_3_TITLE,
      description: texts.STEP_3_DESCRIPTION,
      benefit: texts.STEP_3_BENEFIT,
      highlights: buildOnboardingStepHighlights(texts, 3),
      highlightElement: 'home-focus',
    },
    {
      id: 'safety',
      icon: 'shield-check',
      stepLabel: texts.STEP_4_LABEL,
      title: texts.STEP_4_TITLE,
      description: texts.STEP_4_DESCRIPTION,
      benefit: texts.STEP_4_BENEFIT,
      highlights: buildOnboardingStepHighlights(texts, 4),
      highlightElement: 'settings',
    },
  ];

  return steps.map((step) => ({ ...step, color: accent }));
}

export function buildOnboardingBenefits(texts) {
  return [texts.BENEFIT_1, texts.BENEFIT_2, texts.BENEFIT_3].filter(Boolean);
}
