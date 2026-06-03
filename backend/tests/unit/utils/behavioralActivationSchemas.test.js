import { getCreateBehavioralActivationSchema } from '../../../utils/behavioralActivationSchemas.js';
import { behavioralActivationApiCopy } from '../../../utils/behavioralActivationApiCopy.js';

describe('getCreateBehavioralActivationSchema (#88)', () => {
  const copy = behavioralActivationApiCopy('es');
  const schema = getCreateBehavioralActivationSchema(copy);

  it('acepta payload mínimo válido', () => {
    const { error } = schema.validate({
      activityDescription: 'Paseo de 10 minutos',
      activityType: 'pleasant',
      moodBefore: 3,
      moodAfter: 5,
    });
    expect(error).toBeUndefined();
  });

  it('rechaza actividad vacía', () => {
    const { error } = schema.validate({
      activityDescription: '   ',
      moodBefore: 3,
      moodAfter: 5,
    });
    expect(error).toBeDefined();
  });

  it('rechaza ánimo fuera de rango', () => {
    const { error } = schema.validate({
      activityDescription: 'Paseo',
      moodBefore: 0,
      moodAfter: 5,
    });
    expect(error).toBeDefined();
  });
});

describe('behavioralActivationApiCopy', () => {
  it('expone claves es/en en paridad', () => {
    const esKeys = Object.keys(behavioralActivationApiCopy('es')).sort();
    const enKeys = Object.keys(behavioralActivationApiCopy('en')).sort();
    expect(esKeys).toEqual(enKeys);
  });
});
