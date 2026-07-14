import {
  buildSuggestionRationaleShort,
  enrichSuggestionsWithRationaleShort,
} from '../../../utils/actionSuggestionRationale.js';
import actionSuggestionService from '../../../services/actionSuggestionService.js';

describe('actionSuggestionRationale', () => {
  it('devuelve default breve para pensamiento automático', () => {
    const why = buildSuggestionRationaleShort({
      id: 'automatic_thought_record',
      language: 'es',
    });
    expect(why).toMatch(/idea|vueltas|calma/i);
    expect(why.length).toBeLessThanOrEqual(96);
  });

  it('personaliza AT ante invalidación / “nunca la razón”', () => {
    const why = buildSuggestionRationaleShort({
      id: 'automatic_thought_record',
      language: 'es',
      userContent: 'Que nunca tengo la razon. Me trata como si estuviera loco',
    });
    expect(why).toMatch(/nunca tienes la razón/i);
  });

  it('personaliza BA ante impotencia', () => {
    const why = buildSuggestionRationaleShort({
      id: 'behavioral_activation',
      language: 'es',
      userContent: 'Nada solo sentirme mal, impotente',
    });
    expect(why).toMatch(/sin salida|paso mínimo/i);
  });

  it('devuelve variante en inglés', () => {
    const why = buildSuggestionRationaleShort({
      id: 'behavioral_activation',
      language: 'en',
      userContent: 'I feel helpless and stuck',
    });
    expect(why).toMatch(/stuck|powerless|tiny step/i);
  });

  it('formatSuggestions incluye rationaleShort en ejercicios', () => {
    const [card] = actionSuggestionService.formatSuggestions(
      ['automatic_thought_record'],
      'es',
      { userContent: 'Discutí con mi pareja y nunca tengo la razón' },
    );
    expect(card.rationaleShort).toBeTruthy();
    expect(card.rationaleShort).toMatch(/razón|pelea|idea/i);
  });

  it('no añade rationaleShort a psicoeducación', () => {
    const [card] = actionSuggestionService.formatSuggestions(['psychoeducation_anxiety'], 'es');
    expect(card.rationaleShort).toBeUndefined();
    expect(card.description || card.previewSummary).toBeTruthy();
  });

  it('enrichSuggestionsWithRationaleShort respeta psicoed', () => {
    const out = enrichSuggestionsWithRationaleShort(
      [
        { id: 'behavioral_activation', interventionType: 'exercise', label: 'BA' },
        {
          id: 'psychoeducation_anxiety',
          interventionType: 'psychoeducation',
          label: 'Ansiedad',
        },
      ],
      { language: 'es', userContent: 'Me siento impotente' },
    );
    expect(out[0].rationaleShort).toMatch(/sin salida|paso mínimo|quieto/i);
    expect(out[1].rationaleShort).toBeUndefined();
  });
});
