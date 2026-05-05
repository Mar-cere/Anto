/**
 * Regresión: instrucción de baja certeza (#57) en system message.
 */
import { describe, expect, it, beforeAll } from '@jest/globals';
import { buildContextualizedPrompt } from '../../../services/openai/openaiPromptBuilder.js';
import { CLARIFY_MIN_USER_MESSAGE_CHARS } from '../../../services/chat/lowConfidenceClarifyTemplate.js';

beforeAll(() => {
  process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
});

const longUser =
  'Llevo varios días con la cabeza muy cargada y no sé bien si quiero desahogarme o que me den ideas.';

describe('openaiPromptBuilder — baja certeza (#57)', () => {
  it('inyecta bloque cuando confianza de intención es baja y el mensaje es sustantivo', async () => {
    expect(longUser.length).toBeGreaterThanOrEqual(CLARIFY_MIN_USER_MESSAGE_CHARS);
    const { systemMessage } = await buildContextualizedPrompt(
      { content: longUser },
      {
        emotional: { mainEmotion: 'neutral', intensity: 5 },
        contextual: {
          intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 },
          urgencia: 'NORMAL',
          tema: { categoria: 'GENERAL' }
        },
        currentMessage: longUser,
        history: [],
        memory: {}
      }
    );
    expect(systemMessage).toContain('Baja certeza interpretativa');
  });

  it('no inyecta bloque con confianza alta', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: longUser },
      {
        emotional: { mainEmotion: 'ansiedad', intensity: 6 },
        contextual: {
          intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
          urgencia: 'NORMAL',
          tema: { categoria: 'EMOCIONAL' }
        },
        currentMessage: longUser,
        history: [],
        memory: {}
      }
    );
    expect(systemMessage).not.toContain('Baja certeza interpretativa');
  });
});
