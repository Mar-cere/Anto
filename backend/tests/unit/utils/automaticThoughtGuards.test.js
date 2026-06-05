import {
  hasActionableDistortionInMessage,
  normalizeAutomaticThoughtDistortion,
  prepareAutomaticThoughtCreatePayload,
} from '../../../utils/automaticThoughtGuards.js';

const APATHY =
  'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.';

const DISTORTION =
  'Me siento ansioso, 6/10. Sé que van a pensar mal de mí y nunca va a salir bien.';

describe('automaticThoughtGuards (#89)', () => {
  it('hasActionableDistortionInMessage ignora apatía pura (falso todo/nada)', () => {
    expect(hasActionableDistortionInMessage(APATHY)).toBe(false);
  });

  it('hasActionableDistortionInMessage detecta distorsión en ansiedad social cognitiva', () => {
    expect(hasActionableDistortionInMessage(DISTORTION)).toBe(true);
  });

  it('normalizeAutomaticThoughtDistortion rellena nombre desde catálogo', () => {
    const out = normalizeAutomaticThoughtDistortion({
      distortionType: 'mind_reading',
      distortionName: '',
    });
    expect(out.distortionType).toBe('mind_reading');
    expect(out.distortionName).toMatch(/mente/i);
  });

  it('normalizeAutomaticThoughtDistortion rechaza tipo inválido', () => {
    const out = normalizeAutomaticThoughtDistortion({
      distortionType: 'not_a_real_type',
      distortionName: 'Foo',
    });
    expect(out.distortionType).toBe('');
    expect(out.distortionName).toBe('');
  });

  it('prepareAutomaticThoughtCreatePayload limpia distorsión inválida', () => {
    const out = prepareAutomaticThoughtCreatePayload({
      situation: 'Reunión',
      automaticThought: 'Van a juzgarme',
      distortionType: 'invalid',
      distortionName: 'X',
    });
    expect(out.distortionType).toBe('');
    expect(out.distortionName).toBe('');
  });
});
