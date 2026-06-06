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
    expect(mod?.whatIs).toMatch(/ansiedad/i);
    expect(mod?.disclaimer).toMatch(/educativo/i);
    expect(PSYCHOEDUCATION_MODULES.anxiety).toBeDefined();
  });

  it('incluye título localizado en el módulo', () => {
    expect(getPsychoeducationModule('anxiety', 'en')?.title).toMatch(/Anxiety/i);
    expect(getPsychoeducationModule('anxiety', 'es')?.title).toMatch(/Ansiedad/i);
  });

  it('devuelve nota de revisión en el idioma solicitado', () => {
    const modEn = getPsychoeducationModule('anxiety', 'en');
    expect(modEn?.clinicalReview?.note).toMatch(/Editorial/i);
    const modEs = getPsychoeducationModule('anxiety', 'es');
    expect(modEs?.clinicalReview?.note).toMatch(/editorial/i);
  });

  it('incluye ira y sueño en el catálogo', () => {
    const topics = getAvailableTopics('es');
    expect(topics).toEqual(
      expect.arrayContaining(['anger', 'sleep', 'trauma', 'emotionRegulation']),
    );
  });
});
