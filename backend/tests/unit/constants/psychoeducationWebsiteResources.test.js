import {
  PSYCHOEDUCATION_TOPIC_WEB_RESOURCE_KEY,
  PSYCHOEDUCATION_WEBSITE_RESOURCES,
  getPsychoeducationWebsiteSource,
} from '../../../constants/psychoeducationWebsiteResources.js';
import { getAvailableTopics, getPsychoeducationModule } from '../../../constants/psychoeducation.js';

describe('psychoeducationWebsiteResources', () => {
  it('expone las 9 guías web del sitio', () => {
    expect(Object.keys(PSYCHOEDUCATION_WEBSITE_RESOURCES)).toHaveLength(9);
  });

  it('cada guía tiene URL https en es y en', () => {
    Object.values(PSYCHOEDUCATION_WEBSITE_RESOURCES).forEach((entry) => {
      expect(entry.es).toMatch(/^https:\/\/antoapps\.com\/recursos\//);
      expect(entry.en).toMatch(/^https:\/\/antoapps\.com\/en\/recursos\//);
    });
  });

  it('mapea variantes avanzadas a la guía base', () => {
    expect(PSYCHOEDUCATION_TOPIC_WEB_RESOURCE_KEY.anxietyAdvanced).toBe('anxiety');
    expect(PSYCHOEDUCATION_TOPIC_WEB_RESOURCE_KEY.depressionAdvanced).toBe('low_mood');
    expect(PSYCHOEDUCATION_TOPIC_WEB_RESOURCE_KEY.workStress).toBe('stress');
  });

  it('getPsychoeducationWebsiteSource devuelve etiqueta y URL por idioma', () => {
    const es = getPsychoeducationWebsiteSource('anxiety', 'es');
    expect(es.url).toBe(PSYCHOEDUCATION_WEBSITE_RESOURCES.anxiety.es);
    expect(es.label).toMatch(/Anto/);

    const en = getPsychoeducationWebsiteSource('anxiety', 'en');
    expect(en.url).toBe(PSYCHOEDUCATION_WEBSITE_RESOURCES.anxiety.en);
    expect(en.label).toMatch(/Anto/);
  });

  it('todos los temas de la app incluyen el enlace web como primera fuente', () => {
    getAvailableTopics('es').forEach((topic) => {
      const esMod = getPsychoeducationModule(topic, 'es');
      const enMod = getPsychoeducationModule(topic, 'en');
      expect(esMod.sources[0].url).toMatch(/^https:\/\/antoapps\.com\/recursos\//);
      expect(enMod.sources[0].url).toMatch(/^https:\/\/antoapps\.com\/en\/recursos\//);
      expect(esMod.sources[0].url).not.toBe(enMod.sources[0].url);
    });
  });
});
