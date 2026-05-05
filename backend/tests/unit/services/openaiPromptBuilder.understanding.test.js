/**
 * Regresión: bloque de entendimiento previo (#56) en system message.
 */
import { describe, expect, it, beforeAll } from '@jest/globals';
import { buildContextualizedPrompt } from '../../../services/openai/openaiPromptBuilder.js';

beforeAll(() => {
  process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
});

const baselineCtx = {
  emotional: { mainEmotion: 'neutral', intensity: 5 },
  contextual: {
    intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 },
    urgencia: 'NORMAL',
    tema: { categoria: 'GENERAL', confianza: 0.5 }
  },
  history: [],
  memory: {}
};

describe('openaiPromptBuilder — pipeline entender→responder (#56)', () => {
  it('no inyecta bloque con señales totalmente basales', async () => {
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, baselineCtx);
    expect(systemMessage).not.toContain('Entendimiento previo a responder');
  });

  it('inyecta bloque cuando la intención es de apoyo emocional', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'necesito hablar' },
      {
        ...baselineCtx,
        contextual: {
          intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
          urgencia: 'NORMAL',
          tema: { categoria: 'GENERAL' }
        }
      }
    );
    expect(systemMessage).toContain('Entendimiento previo a responder');
    expect(systemMessage).toContain('AYUDA_EMOCIONAL');
  });
});
