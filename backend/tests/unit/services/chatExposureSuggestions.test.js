import actionSuggestionService, {
  applyExposureSuggestionPolicy,
  shouldBoostExposureSuggestion,
} from '../../../services/actionSuggestionService.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import { getInterventionCatalogEntry } from '../../../constants/interventionCatalog.js';

const CANONICAL_AVOIDANCE =
  'Tengo ansiedad social, 6/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.';

describe('chatExposureSuggestions (#87)', () => {
  it('exposure_hierarchy existe en catálogo con pantalla ExposureHierarchy', () => {
    const entry = getInterventionCatalogEntry('exposure_hierarchy');
    expect(entry?.screen).toBe('ExposureHierarchy');
    const [card] = actionSuggestionService.formatSuggestions(['exposure_hierarchy'], 'es');
    expect(card.screen).toBe('ExposureHierarchy');
  });

  it('formatSuggestions en inglés para exposure_hierarchy', () => {
    const [card] = actionSuggestionService.formatSuggestions(['exposure_hierarchy'], 'en');
    expect(card.label).toMatch(/exposure/i);
  });

  it('shouldBoostExposureSuggestion detecta evitación', () => {
    expect(shouldBoostExposureSuggestion(CANONICAL_AVOIDANCE)).toBe(true);
    expect(shouldBoostExposureSuggestion('Estoy tranquilo hoy.')).toBe(false);
  });

  it('applyExposureSuggestionPolicy prioriza exposure en ansiedad media contextual', () => {
    const out = applyExposureSuggestionPolicy(
      ['mindfulness_reminder', 'self_care'],
      {
        emotion: 'ansiedad',
        intensityLevel: 'medium',
        userContent: CANONICAL_AVOIDANCE,
      },
    );
    expect(out[0]).toBe('exposure_hierarchy');
  });

  it('pipeline ansiedad media + evitación incluye exposure_hierarchy', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion(CANONICAL_AVOIDANCE);
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: CANONICAL_AVOIDANCE,
    });
    expect(actionIds).toContain('exposure_hierarchy');
  });
});
