import { beforeAll, describe, expect, it } from '@jest/globals';
import { buildContextualizedPrompt } from '../../../services/openai/openaiPromptBuilder.js';

beforeAll(() => {
  process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
});

const baseContext = {
  emotional: { mainEmotion: 'neutral', intensity: 5 },
  contextual: {
    intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.8 },
    urgencia: 'NORMAL',
    tema: { categoria: 'GENERAL' }
  },
  history: [],
  memory: {}
};

describe('openaiPromptBuilder — guardrails de brevedad/factual/identidad clínica', () => {
  it('inyecta preferencia de sesión cuando forceShortMode está activo sin crisis', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'responde breve porfa' },
      {
        ...baseContext,
        forceShortMode: true
      }
    );
    expect(systemMessage).toContain('PREFERENCIA DE SESIÓN');
    expect(systemMessage).toContain('ESTILO DE RESPUESTA: BREVE');
  });

  it('no fuerza mensaje de brevedad cuando hay riesgo de crisis', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'responde breve porfa' },
      {
        ...baseContext,
        forceShortMode: true,
        crisis: { riskLevel: 'HIGH', country: 'GENERAL' }
      }
    );
    expect(systemMessage).not.toContain('PREFERENCIA DE SESIÓN');
  });

  it('mantiene prioridad clínica al activar modo factual con carga emocional alta', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'quién es Tina Turner' },
      {
        ...baseContext,
        emotional: { mainEmotion: 'ansiedad', intensity: 8 },
        forceFactualMode: true
      }
    );
    expect(systemMessage).toContain('IDENTIDAD Y PRIORIDAD CLÍNICA');
    expect(systemMessage).toContain('MODO FACTUAL (prioridad alta)');
    expect(systemMessage).toContain('responde lo factual en breve y vuelve a sostén emocional útil');
  });
});
