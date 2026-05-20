/**
 * Fragmento de system prompt con respuestas de onboarding.
 */

export function buildOnboardingAnswersSystemSnippet(onboardingAnswers, language = 'es') {
  if (!onboardingAnswers || typeof onboardingAnswers !== 'object') {
    return '';
  }

  const { whatExpectFromApp, whatToImproveOrWorkOn, typeOfSpecialist } =
    onboardingAnswers;
  if (!whatExpectFromApp && !whatToImproveOrWorkOn && !typeOfSpecialist) {
    return '';
  }

  const isEn = language === 'en';
  const parts = [];

  if (whatExpectFromApp) {
    parts.push(
      isEn
        ? `Primary focus: ${whatExpectFromApp}`
        : `Enfoque principal: ${whatExpectFromApp}`,
    );
  }
  if (whatToImproveOrWorkOn) {
    parts.push(
      isEn
        ? `Wants to improve: ${whatToImproveOrWorkOn}`
        : `Quiere mejorar: ${whatToImproveOrWorkOn}`,
    );
  }
  if (typeOfSpecialist) {
    parts.push(
      isEn
        ? `Preferred support style: ${typeOfSpecialist}`
        : `Estilo de apoyo preferido: ${typeOfSpecialist}`,
    );
  }

  if (parts.length === 0) return '';

  const header = isEn
    ? 'INITIAL ONBOARDING (use it to personalize tone and focus in this conversation):'
    : 'ONBOARDING INICIAL (úsalo para personalizar tono y enfoque en esta conversación):';

  return `\n\n${header}\n${parts.join('\n')}`;
}
