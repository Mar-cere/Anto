import { getSuggestionRationaleFallback } from '../suggestionRationaleFallback';
import { hydrateInterventionSuggestion } from '../psychoeducationTopic';

describe('suggestionRationaleFallback', () => {
  it('devuelve copy ES/EN por id', () => {
    expect(getSuggestionRationaleFallback('behavioral_activation', 'es')).toMatch(/paso mínimo/i);
    expect(getSuggestionRationaleFallback('behavioral_activation', 'en')).toMatch(/tiny step/i);
  });

  it('hydrateInterventionSuggestion completa rationaleShort faltante', () => {
    const hydrated = hydrateInterventionSuggestion(
      {
        id: 'automatic_thought_record',
        label: 'Pensamiento automático',
        interventionType: 'exercise',
      },
      'es',
    );
    expect(hydrated.rationaleShort).toMatch(/idea/i);
  });

  it('hydrateInterventionSuggestion no pisa rationaleShort existente', () => {
    const hydrated = hydrateInterventionSuggestion(
      {
        id: 'automatic_thought_record',
        label: 'Pensamiento automático',
        interventionType: 'exercise',
        rationaleShort: 'Porque dijiste X.',
      },
      'es',
    );
    expect(hydrated.rationaleShort).toBe('Porque dijiste X.');
  });
});
