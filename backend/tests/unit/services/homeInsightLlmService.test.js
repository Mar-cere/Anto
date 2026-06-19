import {
  buildWarmDeterministicHomeInsight,
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
