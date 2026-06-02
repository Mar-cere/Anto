/**
 * Contrato API ↔ UI para módulos (#85).
 */
import { buildModuleSections } from '../psychoeducationContentLayout';
import { getModuleLeadText } from '../psychoeducationContentLayout';
import { PSYCHOEDUCATION_META_KEYS } from '../psychoeducationDisplay';

const TOPICS = [
  'anxiety',
  'depression',
  'stress',
  'anger',
  'sleep',
  'emotionRegulation',
  'trauma',
];

function apiModuleEnvelope(topic, language = 'es') {
  const titles = {
    es: {
      anxiety: 'Ansiedad',
      depression: 'Bajo ánimo',
      stress: 'Estrés',
      anger: 'Enojo e ira',
      sleep: 'Sueño',
      emotionRegulation: 'Regulación emocional',
      trauma: 'Experiencias difíciles',
    },
    en: {
      anxiety: 'Anxiety',
      depression: 'Low mood',
      stress: 'Stress',
      anger: 'Anger',
      sleep: 'Sleep',
      emotionRegulation: 'Emotion regulation',
      trauma: 'Difficult experiences',
    },
  };
  const lang = language === 'en' ? 'en' : 'es';
  return {
    topic,
    title: titles[lang][topic],
    version: '1.0.0',
    interventionId: `psychoeducation_${topic === 'emotionRegulation' ? 'emotion_regulation' : topic}`,
    disclaimer: 'Aviso educativo.',
    mechanismLine: 'Línea mecanismo.',
    clinicalReview: { version: '1.0.0', note: 'Nota editorial.' },
    whatIs: 'Texto introductorio del módulo con suficiente longitud.',
    symptoms: ['Señal uno', 'Señal dos'],
    whenToSeekHelp: 'Busca apoyo si persiste varias semanas.',
    sources: [{ label: 'OMS', url: 'https://www.who.int' }],
  };
}

describe('psychoeducation API contract (all modules)', () => {
  TOPICS.forEach((topic) => {
    it(`${topic}: payload API no genera secciones de metadato`, () => {
      const mod = apiModuleEnvelope(topic);
      const sections = buildModuleSections(mod, 'es');
      const keys = sections.map((s) => s.key);
      [...PSYCHOEDUCATION_META_KEYS, 'title', 'whatIs'].forEach((k) => {
        expect(keys).not.toContain(k);
      });
      expect(getModuleLeadText(mod)).toBeTruthy();
    });

    it(`${topic}: ninguna etiqueta expone clave cruda`, () => {
      const mod = { ...apiModuleEnvelope(topic), unknownField: 'x' };
      const sections = buildModuleSections(mod, 'es');
      sections.forEach((s) => {
        expect(s.label).not.toBe(s.key);
        expect(s.label.length).toBeGreaterThan(2);
      });
    });
  });

  it('sleep: tarjeta fusionada de apoyo', () => {
    const mod = {
      ...apiModuleEnvelope('sleep'),
      symptoms: undefined,
      hygiene: ['Rutina'],
      whenWorry: ['Insomnio'],
      whenToSeekHelp: 'Consulta profesional.',
    };
    const sections = buildModuleSections(mod, 'es');
    expect(sections.filter((s) => s.isHighlight)).toHaveLength(1);
    expect(sections.find((s) => s.highlightLayout === 'supportGroup')).toBeTruthy();
  });
});
