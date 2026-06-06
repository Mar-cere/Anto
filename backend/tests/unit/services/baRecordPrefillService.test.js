import {
  buildBaPrefillParams,
  enrichSuggestionsWithBaPrefill,
  extractMoodBeforeFromMessage,
  suggestMicroActivityFromMessage,
} from '../../../services/baRecordPrefillService.js';

const CANONICAL_APATHY =
  'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.';

describe('baRecordPrefillService (#88)', () => {
  it('extractMoodBeforeFromMessage lee intensidad 6/10', () => {
    expect(extractMoodBeforeFromMessage(CANONICAL_APATHY)).toBe(6);
  });

  it('suggestMicroActivityFromMessage sugiere paseo con aislamiento (es)', () => {
    const activity = suggestMicroActivityFromMessage(CANONICAL_APATHY, 'es');
    expect(activity).toMatch(/paseo/i);
  });

  it('suggestMicroActivityFromMessage en inglés', () => {
    const msg = 'I feel numb, 6/10. I have not left home in days.';
    const activity = suggestMicroActivityFromMessage(msg, 'en');
    expect(activity).toMatch(/walk|home/i);
  });

  it('buildBaPrefillParams incluye actividad, ánimo y tipo', () => {
    const params = buildBaPrefillParams(CANONICAL_APATHY, 'es');
    expect(params.prefillActivityDescription).toBeTruthy();
    expect(params.prefillMoodBefore).toBe(6);
    expect(params.prefillActivityType).toBe('pleasant');
  });

  it('buildBaPrefillParams devuelve null para mensaje vacío', () => {
    expect(buildBaPrefillParams('')).toBeNull();
    expect(buildBaPrefillParams('   ')).toBeNull();
  });

  it('enrichSuggestionsWithBaPrefill solo toca behavioral_activation', () => {
    const formatted = enrichSuggestionsWithBaPrefill(
      [
        { id: 'abc_record', screen: 'AbcRecord' },
        { id: 'behavioral_activation', screen: 'BehavioralActivation' },
      ],
      CANONICAL_APATHY,
      'es',
    );
    expect(formatted[0].params).toBeUndefined();
    expect(formatted[1].params?.fromChat).toBe(true);
    expect(formatted[1].params?.prefillMoodBefore).toBe(6);
    expect(formatted[1].params?.prefillActivityDescription).toBeTruthy();
  });
});
