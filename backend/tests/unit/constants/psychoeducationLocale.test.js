import {
  getPsychoeducationModule,
  getAvailableTopics,
  PSYCHOEDUCATION_MODULES,
} from '../../../constants/psychoeducation.js';

describe('psychoeducation locale', () => {
  it('expone los mismos temas en es y en', () => {
    expect(getAvailableTopics('en').sort()).toEqual(getAvailableTopics('es').sort());
    expect(getAvailableTopics('es').length).toBeGreaterThan(0);
  });

  it('devuelve contenido en inglés para anxiety', () => {
    const mod = getPsychoeducationModule('anxiety', 'en');
    expect(mod?.whatIs).toMatch(/anxiety|stress|natural/i);
    expect(mod?.whatIs).not.toMatch(/La ansiedad es una respuesta/);
  });

  it('mantiene español por defecto', () => {
    const mod = getPsychoeducationModule('anxiety');
    expect(mod?.whatIs).toMatch(/La ansiedad/);
    expect(PSYCHOEDUCATION_MODULES.anxiety).toBeDefined();
  });
});
