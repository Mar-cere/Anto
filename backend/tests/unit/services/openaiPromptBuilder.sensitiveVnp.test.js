/**
 * Regresión: fragmento V–N–P (#62) en el system message.
 */
import { describe, expect, it, beforeAll } from '@jest/globals';
import { buildContextualizedPrompt } from '../../../services/openai/openaiPromptBuilder.js';
import { SENSITIVE_VNP_INTENSITY_MIN } from '../../../services/chat/sensitiveResponseTemplate.js';

beforeAll(() => {
  process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
});

const minimalCtx = {
  emotional: { mainEmotion: 'neutral', intensity: 5 },
  contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 } },
  history: [],
  memory: {}
};

describe('openaiPromptBuilder — VNP sensible (#62)', () => {
  it('no incluye bloque VNP cuando el turno no es sensible', async () => {
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, minimalCtx);
    expect(systemMessage).not.toContain('### Turno sensible');
  });

  it('incluye bloque VNP cuando intensidad >= umbral', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'me siento muy mal' },
      {
        ...minimalCtx,
        emotional: { mainEmotion: 'tristeza', intensity: SENSITIVE_VNP_INTENSITY_MIN }
      }
    );
    expect(systemMessage).toContain('### Turno sensible');
    expect(systemMessage).toContain('Una sola pregunta');
  });

  it('incluye VNP con riesgo crisis WARNING sin depender de userId', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'test' },
      {
        ...minimalCtx,
        emotional: { mainEmotion: 'miedo', intensity: 4 },
        crisis: { riskLevel: 'WARNING' }
      }
    );
    expect(systemMessage).toContain('### Turno sensible');
  });
});
