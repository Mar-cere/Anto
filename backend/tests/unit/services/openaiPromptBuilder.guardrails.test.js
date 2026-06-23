import { beforeAll, describe, expect, it } from '@jest/globals';
import {
  buildContextualizedPrompt,
  buildShortReplyContinuityHint,
  resolveChatLanguage,
} from '../../../services/openai/openaiPromptBuilder.js';

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

  it('crisis prompt incluye números locales vía preferences.regionCountry', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'quiero morir' },
      {
        ...baseContext,
        crisis: {
          riskLevel: 'HIGH',
          preferences: { regionCountry: 'CL' },
          phone: null,
        },
      }
    );
    expect(systemMessage).toContain('133');
    expect(systemMessage).toMatch(/600\s*360\s*7777/);
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

  it('resolveChatLanguage usa preferences.language del perfil', () => {
    expect(resolveChatLanguage({ profile: { preferences: { language: 'en' } } })).toBe('en');
    expect(resolveChatLanguage({ profile: { preferences: { language: 'es' } } })).toBe('es');
    expect(resolveChatLanguage({ language: 'en' })).toBe('en');
    expect(resolveChatLanguage({})).toBe('es');
  });

  it('buildShortReplyContinuityHint continúa el último turno del asistente tras "Sí"', () => {
    const history = [
      { role: 'assistant', content: '¿Te resulta más fácil enfocarte con silencio?' },
      { role: 'user', content: 'Me cuesta concentrarme' },
      { role: 'assistant', content: '¿Qué te ayuda más: silencio o música suave?' },
    ];
    const hint = buildShortReplyContinuityHint('Sí', history, 'es');
    expect(hint).toContain('Continuidad tras respuesta breve');
    expect(hint).toContain('silencio o música suave');
    expect(hint).toContain('repitas una respuesta previa del hilo');
  });

  it('buildShortReplyContinuityHint no aplica a mensajes largos ni sin historial', () => {
    expect(buildShortReplyContinuityHint('Sí', [], 'es')).toBe('');
    expect(
      buildShortReplyContinuityHint(
        'Me cuesta mucho concentrarme cuando hay ruido en casa',
        [{ role: 'assistant', content: '¿Qué te ayuda?' }],
        'es',
      ),
    ).toBe('');
  });

  it('buildShortReplyContinuityHint usa copy en inglés cuando language=en', () => {
    const hint = buildShortReplyContinuityHint('Yes', [
      { role: 'assistant', content: 'Does quiet help you focus?' },
    ], 'en');
    expect(hint).toContain('Short reply continuity');
    expect(hint).toContain('Does quiet help you focus?');
  });

  it('inyecta directiva de respuesta en inglés cuando language=en', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'hello' },
      {
        ...baseContext,
        profile: { preferences: { language: 'en' } },
      },
    );
    expect(systemMessage).toContain('RESPONSE LANGUAGE (HIGHEST PRIORITY');
    expect(systemMessage).toContain('IDENTITY AND CLINICAL PRIORITY');
    expect(systemMessage).not.toContain('IDENTIDAD Y PRIORIDAD CLÍNICA');
  });

  it('amplía longitud en prompt cuando el usuario pide tips', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'me das mas tips' },
      {
        ...baseContext,
        userMessage: 'me das mas tips'
      }
    );
    expect(systemMessage).toContain('LONGITUD DE RESPUESTA');
    expect(systemMessage).toMatch(/tips|ideas prácticas/i);
  });

  it('inyecta snippet de angustia por pensamientos intrusivos de daño', async () => {
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'me da miedo pensar que les hago daño' },
      {
        ...baseContext,
        emotional: { mainEmotion: 'miedo', intensity: 9, requiresAttention: true },
        distress: {
          theme: 'harm_intrusive_thoughts',
          level: 'moderate',
          rejectedIntent: true
        }
      }
    );
    expect(systemMessage).toContain('NO es crisis suicida');
    expect(systemMessage).toMatch(/pensamiento vs intención/i);
  });
});
