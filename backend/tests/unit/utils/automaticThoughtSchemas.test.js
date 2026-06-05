import { automaticThoughtApiCopy } from '../../../utils/automaticThoughtApiCopy.js';
import { getCreateAutomaticThoughtSchema } from '../../../utils/automaticThoughtSchemas.js';

describe('automaticThoughtSchemas (#89)', () => {
  const copy = automaticThoughtApiCopy('es');

  it('requiere situación y pensamiento automático', () => {
    const schema = getCreateAutomaticThoughtSchema(copy);
    const { error } = schema.validate({});
    expect(error).toBeTruthy();
  });

  it('acepta distorsión válida y campos opcionales', () => {
    const schema = getCreateAutomaticThoughtSchema(copy);
    const { error, value } = schema.validate({
      situation: 'Reunión de trabajo',
      automaticThought: 'Van a pensar que soy un fraude',
      emotion: 'ansiedad',
      emotionIntensity: 7,
      distortionType: 'mind_reading',
      distortionName: 'Lectura de Mente',
      balancedThought: 'No puedo saber qué piensan sin preguntar',
    });
    expect(error).toBeUndefined();
    expect(value.distortionType).toBe('mind_reading');
  });

  it('rechaza distorsión inválida', () => {
    const schema = getCreateAutomaticThoughtSchema(copy);
    const { error } = schema.validate({
      situation: 'Situación',
      automaticThought: 'Pensamiento',
      distortionType: 'invalid_type',
    });
    expect(error).toBeTruthy();
  });
});
