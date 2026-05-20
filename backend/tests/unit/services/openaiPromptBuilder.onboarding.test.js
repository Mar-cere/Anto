import { beforeAll, describe, expect, it } from '@jest/globals';
import { buildContextualizedPrompt } from '../../../services/openai/openaiPromptBuilder.js';
import { ONBOARDING_FOCUS_LABELS } from '../../../constants/onboardingFocusLabels.js';

beforeAll(() => {
  process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
});

const baseContext = {
  emotional: { mainEmotion: 'neutral', intensity: 5 },
  contextual: {
    intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.8 },
    urgencia: 'NORMAL',
    tema: { categoria: 'GENERAL' },
  },
  history: [],
  memory: {},
};

describe('openaiPromptBuilder — onboarding en chat', () => {
  it('incluye onboarding en español cuando el perfil tiene enfoque', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'Hola' },
      {
        ...baseContext,
        profile: {
          preferences: { language: 'es' },
          onboardingAnswers: {
            whatExpectFromApp: ONBOARDING_FOCUS_LABELS.es[0],
          },
        },
      },
    );
    expect(systemMessage).toContain('ONBOARDING INICIAL');
    expect(systemMessage).toContain(ONBOARDING_FOCUS_LABELS.es[0]);
  });

  it('incluye onboarding en inglés cuando el perfil tiene enfoque', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'Hi' },
      {
        ...baseContext,
        profile: {
          preferences: { language: 'en' },
          onboardingAnswers: {
            whatExpectFromApp: ONBOARDING_FOCUS_LABELS.en[2],
          },
        },
      },
    );
    expect(systemMessage).toContain('INITIAL ONBOARDING');
    expect(systemMessage).toContain(ONBOARDING_FOCUS_LABELS.en[2]);
  });
});
