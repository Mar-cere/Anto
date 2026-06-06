import {
  buildAbcPrefillParams,
  enrichSuggestionsWithAbcPrefill,
  extractActivatingEventFromMessage,
  extractBeliefsFromMessage,
  sanitizeAbcPrefillText,
} from '../../../services/abcRecordPrefillService.js';
import actionSuggestionService from '../../../services/actionSuggestionService.js';
import { applyPsychoeducationCardTiers } from '../../../services/psychoeducationPromptSnippetService.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';

describe('abcRecordPrefillService (#86)', () => {
  const canonical =
    'Me siento triste y apagado, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.';

  it('extrae situación activadora sin intensidad', () => {
    const event = extractActivatingEventFromMessage(canonical);
    expect(event).toMatch(/discutir con mi pareja/i);
    expect(event).not.toMatch(/7\/10/);
    expect(event).not.toMatch(/pienso lo peor/i);
  });

  it('buildAbcPrefillParams devuelve prefillActivatingEvent y prefillBeliefs', () => {
    const params = buildAbcPrefillParams(canonical);
    expect(params?.prefillActivatingEvent).toMatch(/discutir con mi pareja/i);
    expect(params?.prefillBeliefs).toMatch(/pienso lo peor/i);
  });

  it('extractBeliefsFromMessage separa pensamiento de situación', () => {
    const beliefs = extractBeliefsFromMessage(canonical);
    expect(beliefs).toMatch(/pienso lo peor/i);
    expect(beliefs).not.toMatch(/discutir/i);
  });

  it('enrichSuggestionsWithAbcPrefill solo toca abc_record', () => {
    const formatted = enrichSuggestionsWithAbcPrefill(
      [
        { id: 'abc_record', screen: 'AbcRecord', params: {} },
        { id: 'communication_tool', screen: 'CommunicationTool' },
      ],
      canonical,
    );
    expect(formatted[0].params.prefillActivatingEvent).toMatch(/discutir/i);
    expect(formatted[0].params.prefillBeliefs).toMatch(/pienso lo peor/i);
    expect(formatted[0].params.fromChat).toBe(true);
    expect(formatted[1].params).toBeUndefined();
  });

  it('devuelve null para mensaje vacío o demasiado corto', () => {
    expect(buildAbcPrefillParams('')).toBeNull();
    expect(buildAbcPrefillParams('ok')).toBeNull();
  });

  it('soporta mensaje EN con situación after', () => {
    const event = extractActivatingEventFromMessage(
      'I feel sad and low, 7/10. I keep thinking the worst after arguing with my partner.',
    );
    expect(event).toMatch(/arguing with my partner/i);
  });

  it('extrae situación en contexto laboral (reunión)', () => {
    const event = extractActivatingEventFromMessage(
      'Estoy enojado, 6/10. Reaccioné mal en la reunión y quiero entender qué pasó.',
    );
    expect(event).toMatch(/reuni[oó]n/i);
    expect(event).not.toMatch(/6\/10/);
  });

  it('sanitizeAbcPrefillText elimina caracteres de control', () => {
    expect(sanitizeAbcPrefillText('discutir\u0001 pareja')).toBe('discutir pareja');
  });

  it('no enriquece si abc_record no está en la lista', () => {
    const formatted = enrichSuggestionsWithAbcPrefill(
      [{ id: 'communication_tool', screen: 'CommunicationTool' }],
      canonical,
    );
    expect(formatted[0].params).toBeUndefined();
  });

  it('pipeline chat canónico incluye params de prefill en abc_record', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion(canonical);
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: canonical,
    });
    const tiered = applyPsychoeducationCardTiers(
      actionSuggestionService.formatSuggestions(actionIds, 'es'),
      { userContent: canonical, mainEmotion: analysis.mainEmotion },
    );
    const formatted = enrichSuggestionsWithAbcPrefill(tiered, canonical);
    const abc = formatted.find((s) => s.id === 'abc_record');
    expect(abc?.params?.fromChat).toBe(true);
    expect(abc?.params?.prefillActivatingEvent).toMatch(/discutir/i);
    expect(abc?.params?.prefillBeliefs).toMatch(/pienso lo peor/i);
    expect(abc?.screen).toBe('AbcRecord');
  });

  it('extrae pensamiento en mensaje de culpa', () => {
    const beliefs = extractBeliefsFromMessage(
      'Siento mucha culpa por lo que dije ayer, 7/10. Repaso una y otra vez cómo reaccioné mal.',
    );
    expect(beliefs).toMatch(/reaccion[eé]/i);
  });

  it('buildAbcPrefillParams puede devolver solo prefillBeliefs', () => {
    const params = buildAbcPrefillParams(
      'Repaso una y otra vez cómo reaccioné mal con mi hijo.',
    );
    expect(params?.prefillBeliefs).toMatch(/reaccion[eé]/i);
  });
});
