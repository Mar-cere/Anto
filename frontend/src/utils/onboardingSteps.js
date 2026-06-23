/**
 * Pasos del recorrido de onboarding (contenido + highlight en UI).
 */
export function buildOnboardingTutorialSteps(texts, colors) {
  return [
    {
      id: 'chat',
      icon: 'message-text',
      title: texts.STEP_1_TITLE,
      description: texts.STEP_1_DESCRIPTION,
      benefit: texts.STEP_1_BENEFIT,
      color: colors.primary,
      highlightElement: 'chat',
    },
    {
      id: 'techniques',
      icon: 'brain',
      title: texts.STEP_2_TITLE,
      description: texts.STEP_2_DESCRIPTION,
      benefit: texts.STEP_2_BENEFIT,
      color: colors.primaryBright ?? colors.primary,
      highlightElement: 'techniques',
    },
    {
      id: 'home',
      icon: 'home-heart',
      title: texts.STEP_3_TITLE,
      description: texts.STEP_3_DESCRIPTION,
      benefit: texts.STEP_3_BENEFIT,
      color: colors.accentSecondary ?? colors.navy,
      highlightElement: 'home-focus',
    },
    {
      id: 'safety',
      icon: 'shield-check',
      title: texts.STEP_4_TITLE,
      description: texts.STEP_4_DESCRIPTION,
      benefit: texts.STEP_4_BENEFIT,
      color: colors.success ?? colors.primary,
      highlightElement: 'settings',
    },
  ];
}

export function buildOnboardingBenefits(texts) {
  return [texts.BENEFIT_1, texts.BENEFIT_2, texts.BENEFIT_3].filter(Boolean);
}
