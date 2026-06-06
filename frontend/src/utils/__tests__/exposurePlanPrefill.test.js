import { parseExposurePlanRouteParams } from '../exposurePlanPrefill';

describe('parseExposurePlanRouteParams', () => {
  it('normaliza prefill desde chat', () => {
    const out = parseExposurePlanRouteParams({
      fromChat: true,
      prefillGoal: 'hablar en reuniones',
      prefillSteps: [
        'Imaginar «hablar en reuniones» 1–2 min',
        'Paso pequeño: acercarte un poco',
      ],
    });
    expect(out.fromChat).toBe(true);
    expect(out.prefillGoal).toBe('hablar en reuniones');
    expect(out.prefillSteps).toHaveLength(2);
  });

  it('sin fromChat no aplica prefill', () => {
    const out = parseExposurePlanRouteParams({
      prefillGoal: 'Test',
      prefillSteps: ['a', 'b'],
    });
    expect(out.prefillGoal).toBe('');
    expect(out.prefillSteps).toEqual([]);
  });

  it('recorta pasos vacíos y limita cantidad', () => {
    const out = parseExposurePlanRouteParams({
      fromChat: true,
      prefillGoal: 'meta',
      prefillSteps: ['  ', 'uno', '', 'dos'],
    });
    expect(out.prefillSteps).toEqual(['uno', 'dos']);
  });
});
