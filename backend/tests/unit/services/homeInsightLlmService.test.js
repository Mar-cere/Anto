import {
  buildWarmDeterministicHomeInsight,
  buildWelcomeHomeInsight,
  hasMeaningfulHomeInsightSignal,
  isDemotivatingHomeInsightText,
  validateHomeInsightLlmText,
} from '../../../services/homeInsightLlmService.js';
import { pickHomeRotatingInsight } from '../../../services/homeRotatingInsightService.js';

describe('homeInsightLlmService', () => {
  it('rechaza copy contable que desanima', () => {
    expect(
      isDemotivatingHomeInsightText(
        'Completaste 0 tareas y registraste 1 avance en hábitos.',
      ),
    ).toBe(true);
    expect(isDemotivatingHomeInsightText('Apareciste por tus hábitos esta semana.')).toBe(
      false,
    );
  });

  it('valida longitud y guardrails', () => {
    expect(validateHomeInsightLlmText('Muy corto')).toBeNull();
    const ok = validateHomeInsightLlmText(
      'Volviste a la app esta semana — aparecer cuenta, incluso en días tranquilos.',
    );
    expect(ok).toContain('Volviste a la app');
  });

  it('rechaza eslóganes de calma genéricos', () => {
    expect(
      validateHomeInsightLlmText(
        'Esta semana ha sido un espacio de calma, y cada pequeño paso que elijas dar te acercará a descubrir nuevos patrones en tu viaje.',
      ),
    ).toBeNull();
  });

  it('buildWarmDeterministicHomeInsight prioriza hábitos sin mencionar ceros', () => {
    const text = buildWarmDeterministicHomeInsight(
      {
        habits: { completionsInPeriod: 1, bestCurrentStreakAmongActive: 0 },
        tasks: { completedInPeriod: 0 },
        chat: { userMessages: 0, distinctActiveDays: 0 },
      },
      'es',
    );
    expect(text).toMatch(/hábitos/i);
    expect(text).not.toMatch(/0 tarea/i);
  });

  it('hasMeaningfulHomeInsightSignal es false sin actividad real', () => {
    expect(
      hasMeaningfulHomeInsightSignal({
        summary: {
          chat: { userMessages: 0 },
          habits: { completionsInPeriod: 0, bestCurrentStreakAmongActive: 0 },
          tasks: { completedInPeriod: 0 },
        },
        weeklyInsight: { status: 'pending' },
        graphCorrelations: [],
      }),
    ).toBe(false);
  });

  it('hasMeaningfulHomeInsightSignal detecta chat o hábitos', () => {
    expect(
      hasMeaningfulHomeInsightSignal({
        summary: { chat: { userMessages: 1 } },
      }),
    ).toBe(true);
    expect(
      hasMeaningfulHomeInsightSignal({
        summary: { habits: { completionsInPeriod: 1 } },
      }),
    ).toBe(true);
  });

  it('buildWelcomeHomeInsight rota mensajes sin fingir patrón', () => {
    const welcome = buildWelcomeHomeInsight('es', 'seed-a');
    expect(welcome.variant).toBe('welcome');
    expect(welcome.sectionKey).toBe('HOME_INSIGHT_WELCOME_SECTION');
    expect(welcome.ctaKey).toBe('HOME_INSIGHT_CTA_CHAT');
    expect(welcome.text).toMatch(/bienestar|descargado|salud mental/i);
    expect(buildWelcomeHomeInsight('es', 'seed-a').text).toBe(welcome.text);
    expect(buildWelcomeHomeInsight('es', 'seed-b').text).not.toBe(welcome.text);
  });
});

describe('pickHomeRotatingInsight priority', () => {
  const candidates = [
    { id: 's', text: 'Resumen seco con suficiente longitud.', source: 'summary', ctaKey: 'x' },
    { id: 'w', text: 'Patrón semanal con suficiente longitud.', source: 'weekly', ctaKey: 'y' },
  ];

  it('prefiere weekly sobre summary', () => {
    const picked = pickHomeRotatingInsight(candidates, 'seed');
    expect(picked.source).toBe('weekly');
  });
});
