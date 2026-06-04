/**
 * Regresión: prefills ABC (#86) y BA (#88) en la misma cadena de sugerencias.
 */
import { enrichSuggestionsWithAbcPrefill } from '../../../services/abcRecordPrefillService.js';
import { enrichSuggestionsWithBaPrefill } from '../../../services/baRecordPrefillService.js';
import { applyPsychoeducationCardTiers } from '../../../services/psychoeducationPromptSnippetService.js';
import actionSuggestionService from '../../../services/actionSuggestionService.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';

const APATHY =
  'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.';
const COGNITIVE_ABC =
  'Me siento triste y apagado, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.';

function enrichTechniquePrefills(formatted, userContent, language = 'es') {
  return enrichSuggestionsWithBaPrefill(
    enrichSuggestionsWithAbcPrefill(formatted, userContent),
    userContent,
    language,
  );
}

describe('techniqueSuggestionPrefills (ABC + BA)', () => {
  it('apatía: BA con prefill; ABC sin beliefs cognitivos', () => {
    const formatted = enrichTechniquePrefills(
      [
        { id: 'behavioral_activation', screen: 'BehavioralActivation' },
        { id: 'abc_record', screen: 'AbcRecord' },
      ],
      APATHY,
      'es',
    );
    const ba = formatted.find((s) => s.id === 'behavioral_activation');
    const abc = formatted.find((s) => s.id === 'abc_record');
    expect(ba?.params?.fromChat).toBe(true);
    expect(ba?.params?.prefillMoodBefore).toBe(6);
    expect(ba?.params?.prefillActivityDescription).toMatch(/paseo/i);
    expect(abc?.params?.prefillBeliefs).toBeUndefined();
  });

  it('cognitivo: ABC con prefill; BA sin params si no está en lista', () => {
    const formatted = enrichTechniquePrefills(
      [{ id: 'abc_record', screen: 'AbcRecord' }],
      COGNITIVE_ABC,
      'es',
    );
    const abc = formatted.find((s) => s.id === 'abc_record');
    expect(abc?.params?.fromChat).toBe(true);
    expect(abc?.params?.prefillBeliefs).toMatch(/pienso lo peor/i);
  });

  it('pipeline apatía prioriza BA y enriquece prefill', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion(APATHY);
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: APATHY,
    });
    expect(actionIds[0]).toBe('behavioral_activation');
    const tiered = applyPsychoeducationCardTiers(
      actionSuggestionService.formatSuggestions(actionIds, 'es'),
      { userContent: APATHY, mainEmotion: analysis.mainEmotion },
    );
    const formatted = enrichTechniquePrefills(tiered, APATHY, 'es');
    const ba = formatted.find((s) => s.id === 'behavioral_activation');
    expect(ba?.params?.prefillMoodBefore).toBe(6);
    expect(ba?.screen).toBe('BehavioralActivation');
  });
});
