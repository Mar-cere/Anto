import { describe, expect, it } from '@jest/globals';
import { buildOnboardingAnswersSystemSnippet } from '../../../../services/chat/onboardingPromptSnippet.js';
import { ONBOARDING_FOCUS_LABELS } from '../../../../constants/onboardingFocusLabels.js';

describe('onboardingPromptSnippet', () => {
  it('devuelve vacío sin respuestas', () => {
    expect(buildOnboardingAnswersSystemSnippet(null, 'es')).toBe('');
    expect(buildOnboardingAnswersSystemSnippet({}, 'en')).toBe('');
  });

  it('inyecta enfoque principal en español', () => {
    const snippet = buildOnboardingAnswersSystemSnippet(
      { whatExpectFromApp: ONBOARDING_FOCUS_LABELS.es[0] },
      'es',
    );
    expect(snippet).toContain('ONBOARDING INICIAL');
    expect(snippet).toContain(`Enfoque principal: ${ONBOARDING_FOCUS_LABELS.es[0]}`);
  });

  it('inyecta enfoque principal en inglés', () => {
    const snippet = buildOnboardingAnswersSystemSnippet(
      { whatExpectFromApp: ONBOARDING_FOCUS_LABELS.en[1] },
      'en',
    );
    expect(snippet).toContain('INITIAL ONBOARDING');
    expect(snippet).toContain(`Primary focus: ${ONBOARDING_FOCUS_LABELS.en[1]}`);
  });

  it('soporta respuestas legacy de las tres preguntas', () => {
    const snippet = buildOnboardingAnswersSystemSnippet(
      {
        whatExpectFromApp: ONBOARDING_FOCUS_LABELS.es[0],
        whatToImproveOrWorkOn: 'Autoestima',
        typeOfSpecialist: 'Paso a paso',
      },
      'es',
    );
    expect(snippet).toContain('Enfoque principal');
    expect(snippet).toContain('Quiere mejorar: Autoestima');
    expect(snippet).toContain('Estilo de apoyo preferido: Paso a paso');
  });
});
