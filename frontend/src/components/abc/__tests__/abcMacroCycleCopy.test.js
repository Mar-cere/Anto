import {
  ABC_MACRO_CYCLE_COPY,
  getAbcMacroCycleInterventionHint,
  getAbcMacroCycleLegSamples,
  normalizeAbcMacroCycleLanguage,
} from '../abcMacroCycleCopy';

describe('abcMacroCycleCopy (#212)', () => {
  const cycle = {
    trigger: 'Reunión',
    thoughts: ['No voy a poder', 'Me van a juzgar'],
    emotions: ['ansiedad'],
    consequences: ['Evité hablar'],
  };

  it('normaliza idioma', () => {
    expect(normalizeAbcMacroCycleLanguage('en-US')).toBe('en');
    expect(normalizeAbcMacroCycleLanguage('es')).toBe('es');
  });

  it('extrae muestras por pata A/B/C', () => {
    expect(getAbcMacroCycleLegSamples(cycle, 'A')).toEqual(['Reunión']);
    expect(getAbcMacroCycleLegSamples(cycle, 'B')).toHaveLength(2);
    expect(getAbcMacroCycleLegSamples(cycle, 'C')).toEqual(['ansiedad', 'Evité hablar']);
  });

  it('expone pistas de intervención en es y en', () => {
    expect(getAbcMacroCycleInterventionHint('B', 'es')).toMatch(/intervención/i);
    expect(getAbcMacroCycleInterventionHint('B', 'en')).toMatch(/intervention/i);
  });

  it('copy es/en sin voseo en exploreHint', () => {
    expect(ABC_MACRO_CYCLE_COPY.es.exploreHint).not.toMatch(/tocá|mirá/i);
    expect(ABC_MACRO_CYCLE_COPY.en.exploreHint).toMatch(/Tap each letter/i);
  });

  it('copy es: sin voseo en pistas de intervención y etiquetas', () => {
    const ES_VOSEO =
      /\b(podés|querés|tenés|sabés|andá|dejá|contame|seguí|abrí|mirá|vení|decí|sentí|recordá|llegás|sentís|tocá)\b/i;
    const es = ABC_MACRO_CYCLE_COPY.es;
    const strings = [
      es.exploreHint,
      es.legA,
      es.legB,
      es.legC,
      es.interventionA,
      es.interventionB,
      es.interventionC,
    ];
    for (const value of strings) {
      expect(ES_VOSEO.test(value)).toBe(false);
    }
  });

  it('paridad de claves es/en en copy del ciclo', () => {
    const esKeys = Object.keys(ABC_MACRO_CYCLE_COPY.es).filter((k) => k !== 'avgIntensity' && k !== 'a11yLeg');
    const enKeys = Object.keys(ABC_MACRO_CYCLE_COPY.en).filter((k) => k !== 'avgIntensity' && k !== 'a11yLeg');
    expect(esKeys.sort()).toEqual(enKeys.sort());
  });

  it('getAbcMacroCycleLegSamples tolera ciclo vacío', () => {
    expect(getAbcMacroCycleLegSamples(null, 'A')).toEqual([]);
    expect(getAbcMacroCycleLegSamples({}, 'B')).toEqual([]);
  });
});
