import {
  buildModuleSections,
  getModuleLeadText,
} from '../psychoeducationContentLayout';

describe('psychoeducationContentLayout', () => {
  const sample = {
    whatIs: 'Texto introductorio.',
    title: 'Ansiedad',
    symptoms: ['A', 'B'],
    causes: ['C'],
    whenToSeekHelp: 'Busca apoyo.',
    disclaimer: 'No es diagnóstico.',
    mechanismLine: 'Mecanismo',
    sources: [{ label: 'OMS', url: 'https://who.int' }],
  };

  it('extrae el texto principal', () => {
    expect(getModuleLeadText(sample)).toBe('Texto introductorio.');
    expect(getModuleLeadText({})).toBeNull();
  });

  it('ordena secciones y marca ayuda como destacada', () => {
    const sections = buildModuleSections(sample, 'es');
    expect(sections.map((s) => s.key)).toEqual(['symptoms', 'causes', 'whenToSeekHelp']);
    expect(sections.find((s) => s.key === 'whenToSeekHelp').isHighlight).toBe(true);
    expect(sections.find((s) => s.key === 'symptoms').defaultExpanded).toBe(true);
  });

  it('no incluye metadatos ni whatIs en acordeón', () => {
    const sections = buildModuleSections(sample, 'en');
    expect(sections.some((s) => s.key === 'whatIs')).toBe(false);
    expect(sections.some((s) => s.key === 'title')).toBe(false);
    expect(sections.some((s) => s.key === 'disclaimer')).toBe(false);
  });

  it('fusiona señales de alerta y apoyo en sueño', () => {
    const sleep = {
      whatIs: 'Intro sueño.',
      hygiene: ['Horario regular'],
      whenWorry: ['Insomnio frecuente'],
      whenToSeekHelp: 'Busca apoyo profesional.',
    };
    const sections = buildModuleSections(sleep, 'es');
    expect(sections.filter((s) => s.isHighlight)).toHaveLength(1);
    expect(sections.find((s) => s.key === 'whenToSeekHelp')?.highlightLayout).toBe('supportGroup');
  });
});
