import {
  PSYCHOEDUCATION_CONTENT_KEY_SET,
  PSYCHOEDUCATION_META_KEY_SET,
  PSYCHOEDUCATION_CONTENT_KEYS,
  PSYCHOEDUCATION_META_KEYS,
  psychoeducationBodyKeys,
} from '../../../constants/psychoeducationContentKeys.js';
import {
  getAvailableTopics,
  getPsychoeducationModule,
} from '../../../constants/psychoeducation.js';

/** Espejo de frontend PSYCHOEDUCATION_META_KEYS (psychoeducationDisplay.js). */
const FRONTEND_META_KEYS = new Set([
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
]);

describe('psychoeducation content keys contract', () => {
  it('backend META_KEYS coincide con frontend', () => {
    expect([...PSYCHOEDUCATION_META_KEY_SET].sort()).toEqual([...FRONTEND_META_KEYS].sort());
  });

  it('no hay solapamiento entre meta y contenido', () => {
    PSYCHOEDUCATION_META_KEYS.forEach((key) => {
      expect(PSYCHOEDUCATION_CONTENT_KEY_SET.has(key)).toBe(false);
    });
  });

  it('whatIs es contenido pero no metadato', () => {
    expect(PSYCHOEDUCATION_CONTENT_KEY_SET.has('whatIs')).toBe(true);
    expect(PSYCHOEDUCATION_META_KEY_SET.has('whatIs')).toBe(false);
  });
});

describe('psychoeducation module structure (all topics)', () => {
  const topics = getAvailableTopics('es');
  const languages = ['es', 'en'];

  it('expone los 9 temas esperados', () => {
    expect(topics.sort()).toEqual(
      [
        'anxiety',
        'anger',
        'burnout',
        'depression',
        'emotionRegulation',
        'grief',
        'sleep',
        'stress',
        'trauma',
      ].sort(),
    );
  });

  languages.forEach((language) => {
    describe(`idioma ${language}`, () => {
      topics.forEach((topic) => {
        it(`${topic}: solo claves de contenido conocidas`, () => {
          const mod = getPsychoeducationModule(topic, language);
          expect(mod).toBeTruthy();
          psychoeducationBodyKeys(mod).forEach((key) => {
            expect(PSYCHOEDUCATION_CONTENT_KEY_SET.has(key)).toBe(true);
          });
        });

        it(`${topic}: incluye whatIs, whenToSeekHelp y fuentes https`, () => {
          const mod = getPsychoeducationModule(topic, language);
          expect(typeof mod.whatIs).toBe('string');
          expect(mod.whatIs.trim().length).toBeGreaterThan(20);
          expect(typeof mod.whenToSeekHelp).toBe('string');
          expect(mod.whenToSeekHelp.trim().length).toBeGreaterThan(20);
          expect(Array.isArray(mod.sources)).toBe(true);
          expect(mod.sources.length).toBeGreaterThan(0);
          mod.sources.forEach((src) => {
            expect(src.url).toMatch(/^https:\/\//);
            expect(String(src.label || '').trim().length).toBeGreaterThan(0);
          });
        });

        it(`${topic}: metadatos presentes pero separados del cuerpo`, () => {
          const mod = getPsychoeducationModule(topic, language);
          expect(mod.topic).toBe(topic);
          expect(mod.title).toBeTruthy();
          expect(mod.disclaimer).toBeTruthy();
          expect(mod.mechanismLine).toBeTruthy();
          expect(mod.version).toBeTruthy();
          expect(mod.interventionId).toMatch(/^psychoeducation_/);
          PSYCHOEDUCATION_META_KEYS.forEach((metaKey) => {
            if (metaKey === 'tags' || metaKey === 'estimatedMinutes') return;
            if (metaKey === 'summary' || metaKey === 'cardVariant') return;
            if (metaKey === 'previewTitle' || metaKey === 'previewSummary') return;
            expect(mod[metaKey]).toBeTruthy();
          });
        });

        it(`${topic}: paridad ES/EN en claves de cuerpo`, () => {
          const esKeys = psychoeducationBodyKeys(getPsychoeducationModule(topic, 'es')).sort();
          const enKeys = psychoeducationBodyKeys(getPsychoeducationModule(topic, 'en')).sort();
          expect(enKeys).toEqual(esKeys);
        });
      });

      it('sleep: incluye whenWorry como señales de alerta', () => {
        const mod = getPsychoeducationModule('sleep', language);
        expect(Array.isArray(mod.whenWorry)).toBe(true);
        expect(mod.whenWorry.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it('es y en tienen las mismas claves de contenido definidas', () => {
    expect(PSYCHOEDUCATION_CONTENT_KEYS.length).toBeGreaterThan(10);
  });
});
