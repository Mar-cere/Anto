import { getCreateExposurePlanSchema, getLogExposureAttemptSchema } from '../../../utils/exposurePlanSchemas.js';
import { exposurePlanApiCopy } from '../../../utils/exposurePlanApiCopy.js';

describe('getCreateExposurePlanSchema (#87)', () => {
  const copy = exposurePlanApiCopy('es');
  const schema = getCreateExposurePlanSchema(copy);

  it('acepta payload mínimo válido', () => {
    const { error } = schema.validate({
      title: 'Hablar en público',
      steps: ['Mirar a la audiencia', 'Decir mi nombre en voz alta'],
    });
    expect(error).toBeUndefined();
  });

  it('rechaza menos de 2 pasos', () => {
    const { error } = schema.validate({
      title: 'Test',
      steps: ['Solo uno'],
    });
    expect(error).toBeDefined();
  });

  it('rechaza objetivo vacío', () => {
    const { error } = schema.validate({
      title: '   ',
      steps: ['Paso 1', 'Paso 2'],
    });
    expect(error).toBeDefined();
  });
});

describe('getLogExposureAttemptSchema (#87)', () => {
  const copy = exposurePlanApiCopy('es');
  const schema = getLogExposureAttemptSchema(copy);

  it('acepta intento con SUDS válidos', () => {
    const { error } = schema.validate({
      stepIndex: 0,
      peakSuds: 70,
      endSuds: 40,
    });
    expect(error).toBeUndefined();
  });

  it('rechaza SUDS fuera de rango', () => {
    const { error } = schema.validate({
      stepIndex: 0,
      peakSuds: 101,
      endSuds: 40,
    });
    expect(error).toBeDefined();
  });
});

describe('exposurePlanApiCopy', () => {
  it('expone claves es/en en paridad', () => {
    const esKeys = Object.keys(exposurePlanApiCopy('es')).sort();
    const enKeys = Object.keys(exposurePlanApiCopy('en')).sort();
    expect(esKeys).toEqual(enKeys);
  });
});
