import { parseAtRecordRouteParams } from '../atRecordPrefill';

describe('parseAtRecordRouteParams', () => {
  it('normaliza prefill desde chat', () => {
    const out = parseAtRecordRouteParams({
      fromChat: true,
      prefillSituation: 'Reunión',
      prefillAutomaticThought: 'Van a juzgarme',
      prefillEmotionIntensity: 6,
      prefillDistortionType: 'mind_reading',
      prefillDistortionName: 'Lectura de Mente',
    });
    expect(out.fromChat).toBe(true);
    expect(out.prefillSituation).toBe('Reunión');
    expect(out.prefillAutomaticThought).toBe('Van a juzgarme');
    expect(out.prefillEmotionIntensity).toBe(6);
    expect(out.prefillDistortionType).toBe('mind_reading');
    expect(out.prefillDistortionName).toBe('Lectura de Mente');
  });

  it('ignora distorsión con tipo inválido', () => {
    const out = parseAtRecordRouteParams({
      fromChat: true,
      prefillDistortionType: 'Invalid-Type',
    });
    expect(out.prefillDistortionType).toBe('');
  });

  it('sin fromChat no aplica prefill', () => {
    const out = parseAtRecordRouteParams({
      prefillSituation: 'Test',
    });
    expect(out.prefillSituation).toBe('');
  });
});
