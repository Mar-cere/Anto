import { getCreateAbcRecordSchema } from '../../../utils/abcRecordSchemas.js';
import { abcRecordApiCopy } from '../../../utils/abcRecordApiCopy.js';

describe('getCreateAbcRecordSchema', () => {
  const copy = abcRecordApiCopy('es');
  const schema = getCreateAbcRecordSchema(copy);

  it('acepta payload mínimo válido', () => {
    const { error, value } = schema.validate({
      activatingEvent: 'Situación de prueba',
      beliefs: 'Pensamiento de prueba',
    });
    expect(error).toBeUndefined();
    expect(value.emotionIntensity).toBe(5);
  });

  it('rechaza situación vacía', () => {
    const { error } = schema.validate({
      activatingEvent: '',
      beliefs: 'Pensamiento',
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe(copy.joiActivatingEmpty);
  });

  it('rechaza intensidad fuera de rango', () => {
    const { error } = schema.validate({
      activatingEvent: 'Situación',
      beliefs: 'Pensamiento',
      emotionIntensity: 11,
    });
    expect(error).toBeDefined();
  });

  it('recorta espacios en campos de texto', () => {
    const { error, value } = schema.validate({
      activatingEvent: '  Situación  ',
      beliefs: '  Pensamiento  ',
    });
    expect(error).toBeUndefined();
    expect(value.activatingEvent).toBe('Situación');
    expect(value.beliefs).toBe('Pensamiento');
  });
});
