import {
  hasContentSectionLabel,
  isRenderableContentSection,
  moduleContentEntries,
  PSYCHOEDUCATION_CONTENT_SECTION_KEYS,
  PSYCHOEDUCATION_META_KEYS,
} from '../psychoeducationDisplay';
import { buildModuleSections } from '../psychoeducationContentLayout';

const EXPECTED_META_KEYS = [
  'disclaimer',
  'sources',
  'topic',
  'title',
  'summary',
  'version',
  'interventionId',
  'mechanismLine',
  'clinicalReview',
  'tags',
  'estimatedMinutes',
  'cardVariant',
  'previewTitle',
  'previewSummary',
];

describe('psychoeducationDisplay', () => {
  it('META_KEYS alineadas con backend', () => {
    expect([...PSYCHOEDUCATION_META_KEYS].sort()).toEqual([...EXPECTED_META_KEYS].sort());
  });

  it('cada clave de contenido tiene etiqueta es/en', () => {
    PSYCHOEDUCATION_CONTENT_SECTION_KEYS.forEach((key) => {
      expect(hasContentSectionLabel(key, 'es')).toBe(true);
      expect(hasContentSectionLabel(key, 'en')).toBe(true);
    });
  });

  it('moduleContentEntries excluye metadatos', () => {
    const mod = {
      whatIs: 'Intro',
      symptoms: ['A'],
      title: 'Ansiedad',
      topic: 'anxiety',
      version: '1.0.0',
      mechanismLine: 'Mecanismo',
      clinicalReview: { note: 'x' },
      disclaimer: 'Aviso',
      sources: [{ label: 'OMS', url: 'https://who.int' }],
    };
    const keys = moduleContentEntries(mod).map(([k]) => k);
    EXPECTED_META_KEYS.forEach((meta) => expect(keys).not.toContain(meta));
    expect(keys).toEqual(expect.arrayContaining(['whatIs', 'symptoms']));
  });

  it('whatIs no es sección renderizable en acordeón', () => {
    expect(isRenderableContentSection('whatIs', 'es')).toBe(false);
    expect(isRenderableContentSection('symptoms', 'es')).toBe(true);
  });

  it('ignora claves desconocidas del API en buildModuleSections', () => {
    const mod = {
      whatIs: 'Intro larga del módulo.',
      symptoms: ['Señal'],
      whenToSeekHelp: 'Busca apoyo.',
      futureApiField: 'no debe verse',
      title: 'Título meta',
    };
    const sections = buildModuleSections(mod, 'es');
    expect(sections.some((s) => s.key === 'futureApiField')).toBe(false);
    expect(sections.some((s) => s.key === 'title')).toBe(false);
    expect(sections.every((s) => s.label !== 'futureApiField')).toBe(true);
  });
});
