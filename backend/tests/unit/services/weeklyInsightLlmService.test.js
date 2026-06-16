import {
  isWeeklyInsightLlmEnabled,
  validateLlmInsightPayload,
  enrichPatternInsightWithLlm,
} from '../../../services/weeklyInsightLlmService.js';
import { buildAbcMacroPatterns, toClientAbcPatterns } from '../../../services/abcMacroPatternService.js';

describe('weeklyInsightLlmService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('isWeeklyInsightLlmEnabled requiere flag y API key', () => {
    delete process.env.WEEKLY_INSIGHT_LLM_ENABLED;
    delete process.env.OPENAI_API_KEY;
    expect(isWeeklyInsightLlmEnabled()).toBe(false);

    process.env.WEEKLY_INSIGHT_LLM_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test';
    expect(isWeeklyInsightLlmEnabled()).toBe(true);
  });

  it('validateLlmInsightPayload rechaza diagnósticos y citas largas', () => {
    const bad = validateLlmInsightPayload({
      headline: 'Tienes un trastorno de ansiedad',
      insights: [{ type: 'x', label: 'a', detail: 'b' }],
      disclaimers: [],
    });
    expect(bad).toBeNull();

    const emptyInsights = validateLlmInsightPayload({
      headline: 'Titular válido',
      insights: [],
      disclaimers: [],
    });
    expect(emptyInsights).toBeNull();

    const good = validateLlmInsightPayload({
      headline: 'Tu ritmo de sueño cambió',
      insights: [
        {
          type: 'phenotype_sleep',
          label: 'Sueño',
          detail: 'El sueño fue más corto estos días; conviene notarlo con suavidad.',
        },
      ],
      conductSuggestion: 'Prueba una rutina de 10 minutos antes de dormir.',
      disclaimers: ['Extra observacional'],
    });
    expect(good?.headline).toContain('sueño');
    expect(good?.disclaimers?.length).toBeGreaterThanOrEqual(2);
    expect(good?.conductSuggestion).toContain('rutina');
  });

  it('enrichPatternInsightWithLlm devuelve base si LLM deshabilitado', async () => {
    process.env.WEEKLY_INSIGHT_LLM_ENABLED = 'false';
    const base = { headline: 'h', insights: [{ label: 'a', detail: 'b' }] };
    const out = await enrichPatternInsightWithLlm({
      basePayload: base,
      correlations: [],
      language: 'es',
    });
    expect(out).toEqual(base);
  });
});

describe('abcMacroPatternService', () => {
  it('agrupa situaciones recurrentes con mínimo 2 ocurrencias', () => {
    const patterns = buildAbcMacroPatterns(
      [
        {
          activatingEvent: 'Reunión con el jefe',
          beliefs: 'No voy a poder',
          emotions: 'ansiedad',
          consequence: 'Evité hablar',
          emotionIntensity: 7,
        },
        {
          activatingEvent: 'Reunion con el jefe',
          beliefs: 'Me van a juzgar',
          emotions: 'miedo',
          consequence: 'Me quedé callado',
          emotionIntensity: 8,
        },
        {
          activatingEvent: 'Paseo por el parque',
          beliefs: 'Está bien',
          emotions: 'calma',
          consequence: 'Respiré',
          emotionIntensity: 3,
        },
      ],
      { language: 'es' },
    );

    expect(patterns).toHaveLength(1);
    expect(patterns[0].count).toBe(2);
    expect(patterns[0].summary).toContain('2×');
    expect(patterns[0].disclaimer).toBe('pattern_observed');
  });

  it('toClientAbcPatterns omite muestras sensibles', () => {
    const client = toClientAbcPatterns([
      {
        situationSample: 'Reunión',
        count: 3,
        summary: 'Patrón observado',
        beliefSamples: ['pensamiento privado'],
        disclaimer: 'pattern_observed',
      },
    ]);
    expect(client[0].summary).toBe('Patrón observado');
    expect(client[0].beliefSamples).toBeUndefined();
  });

  it('toClientAbcPatterns filtra texto clínico', () => {
    const client = toClientAbcPatterns([
      {
        situationSample: 'Trabajo',
        count: 2,
        summary: 'Tienes un trastorno de ansiedad',
        disclaimer: 'pattern_observed',
      },
    ]);
    expect(client).toHaveLength(0);
  });
});
