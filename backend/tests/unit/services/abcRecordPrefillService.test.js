import {
  buildAbcPrefillParams,
  enrichSuggestionsWithAbcPrefill,
  extractActivatingEventFromMessage,
} from '../../../services/abcRecordPrefillService.js';

describe('abcRecordPrefillService (#86)', () => {
  const canonical =
    'Me siento triste y apagado, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.';

  it('extrae situación activadora sin intensidad', () => {
    const event = extractActivatingEventFromMessage(canonical);
    expect(event).toMatch(/discutir con mi pareja/i);
    expect(event).not.toMatch(/7\/10/);
    expect(event).not.toMatch(/pienso lo peor/i);
  });

  it('buildAbcPrefillParams devuelve prefillActivatingEvent', () => {
    const params = buildAbcPrefillParams(canonical);
    expect(params?.prefillActivatingEvent).toMatch(/discutir con mi pareja/i);
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
});
