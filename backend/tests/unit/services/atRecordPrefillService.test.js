import {
  buildAtPrefillParams,
  enrichSuggestionsWithAtPrefill,
  suggestDistortionFromMessage,
} from '../../../services/atRecordPrefillService.js';

const DISTORTION_MSG =
  'Me siento ansioso, 6/10. Sé que van a pensar mal de mí y nunca va a salir bien.';

describe('atRecordPrefillService (#89)', () => {
  it('suggestDistortionFromMessage detecta distorsión primaria', () => {
    const out = suggestDistortionFromMessage(DISTORTION_MSG);
    expect(out?.type).toBeTruthy();
    expect(out?.name).toBeTruthy();
  });

  it('buildAtPrefillParams extrae situación, pensamiento, intensidad y distorsión', () => {
    const params = buildAtPrefillParams(
      'Me siento triste, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.',
    );
    expect(params?.prefillAutomaticThought).toMatch(/pienso lo peor/i);
    expect(params?.prefillEmotionIntensity).toBe(7);
  });

  it('enrichSuggestionsWithAtPrefill solo toca automatic_thought_record', () => {
    const formatted = enrichSuggestionsWithAtPrefill(
      [
        { id: 'automatic_thought_record', screen: 'AutomaticThoughtRecord' },
        { id: 'abc_record', screen: 'AbcRecord' },
      ],
      DISTORTION_MSG,
    );
    const at = formatted.find((s) => s.id === 'automatic_thought_record');
    const abc = formatted.find((s) => s.id === 'abc_record');
    expect(at?.params?.fromChat).toBe(true);
    expect(at?.params?.prefillDistortionType).toBeTruthy();
    expect(abc?.params).toBeUndefined();
  });

  it('enrichSuggestionsWithAtPrefill no sugiere distorsión en apatía pura', () => {
    const formatted = enrichSuggestionsWithAtPrefill(
      [{ id: 'automatic_thought_record', screen: 'AutomaticThoughtRecord' }],
      'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.',
    );
    const at = formatted.find((s) => s.id === 'automatic_thought_record');
    expect(at?.params?.prefillDistortionType).toBeUndefined();
  });
});
