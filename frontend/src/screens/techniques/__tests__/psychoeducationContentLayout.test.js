import {
  buildModuleSections,
  getModuleLeadText,
} from '../psychoeducationContentLayout';

describe('psychoeducationContentLayout', () => {
  const sample = {
    whatIs: 'Texto introductorio.',
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
    expect(sections.some((s) => s.key === 'disclaimer')).toBe(false);
  });
});
