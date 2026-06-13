import { buildModuleSections, getModuleLeadText } from '../psychoeducationContentLayout';
import { moduleContentEntries, PSYCHOEDUCATION_META_KEYS } from '../psychoeducationDisplay';

const TOPICS = [
  'anxiety',
  'depression',
  'stress',
  'anger',
  'sleep',
  'emotionRegulation',
  'trauma',
  'grief',
  'burnout',
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
      grief: 'Duelo y pérdida',
      burnout: 'Agotamiento y burnout',
    },
    en: {
      anxiety: 'Anxiety',
      depression: 'Low mood',
      stress: 'Stress',
      anger: 'Anger',
      sleep: 'Sleep',
      emotionRegulation: 'Emotion regulation',
      trauma: 'Difficult experiences',
      grief: 'Grief and loss',
      burnout: 'Exhaustion and burnout',
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

describe('psychoeducation all modules (frontend layout)', () => {
  TOPICS.forEach((topic) => {
    it(`${topic}: no renderiza metadatos como secciones`, () => {
      const mod = apiModuleEnvelope(topic);
      const entries = moduleContentEntries(mod).map(([key]) => key);
      [...PSYCHOEDUCATION_META_KEYS, 'title', 'topic'].forEach((key) => {
        expect(entries).not.toContain(key);
      });
      expect(getModuleLeadText(mod)).toBeTruthy();
    });

    it(`${topic}: abre la primera sección de contenido`, () => {
      const mod = apiModuleEnvelope(topic);
      const sections = buildModuleSections(mod, 'es');
      expect(sections.length).toBeGreaterThan(0);
      expect(sections[0].defaultExpanded).toBe(true);
      expect(sections.some((s) => s.key === 'whenToSeekHelp' && s.isHighlight)).toBe(true);
    });
  });

  it('sleep: fusiona whenWorry y whenToSeekHelp en una tarjeta', () => {
    const mod = {
      ...apiModuleEnvelope('sleep'),
      symptoms: undefined,
      hygiene: ['Rutina regular'],
      whenWorry: ['Insomnio frecuente', 'Somnolencia diurna'],
      whenToSeekHelp: 'Consulta con un profesional si persiste.',
    };
    const sections = buildModuleSections(mod, 'es');
    const highlights = sections.filter((s) => s.isHighlight);
    expect(highlights).toHaveLength(1);
    expect(highlights[0].key).toBe('whenToSeekHelp');
    expect(highlights[0].highlightLayout).toBe('supportGroup');
    expect(highlights[0].supportGroup.worryItems).toHaveLength(2);
    expect(highlights[0].supportGroup.seekHelpText).toMatch(/profesional/i);
    expect(sections[0].key).toBe('hygiene');
    expect(sections.some((s) => s.key === 'whenWorry')).toBe(false);
  });

  it('emotionRegulation: skills abre primero', () => {
    const mod = {
      ...apiModuleEnvelope('emotionRegulation'),
      symptoms: undefined,
      skills: ['Nombrar emoción'],
      techniques: ['Respiración'],
      benefits: ['Menos conflictos'],
    };
    const sections = buildModuleSections(mod, 'es');
    expect(sections[0].key).toBe('skills');
    expect(sections[0].defaultExpanded).toBe(true);
  });
});
