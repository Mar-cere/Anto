import actionSuggestionService, {
  applyExposureSuggestionPolicy,
  shouldBoostExposureSuggestion,
  shouldBypassTccSuggestionCadence,
} from '../../../services/actionSuggestionService.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import { getInterventionCatalogEntry } from '../../../constants/interventionCatalog.js';
import {
  CHAT_EXPOSURE_SMOKE_CASES,
  CHAT_EXPOSURE_SMOKE_CASES_EN,
} from '../../fixtures/chatExposureSmokeMessages.js';

const CANONICAL_AVOIDANCE =
  'Tengo ansiedad social, 6/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.';

function runExposurePipeline(message, language = 'es') {
  return emotionalAnalyzer.analyzeEmotion(message).then((analysis) => {
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const formatted = actionSuggestionService.formatSuggestions(actionIds, language);
    const exposureCard = formatted.find((s) => s.id === 'exposure_hierarchy');
    return { analysis, actionIds, formatted, exposureCard };
  });
}

describe('chatExposureSuggestions (#87)', () => {
  it('exposure_hierarchy existe en catálogo con pantalla ExposureHierarchy', () => {
    const entry = getInterventionCatalogEntry('exposure_hierarchy');
    expect(entry?.screen).toBe('ExposureHierarchy');
    expect(entry?.type).toBe('exercise');
    const [card] = actionSuggestionService.formatSuggestions(['exposure_hierarchy'], 'es');
    expect(card.screen).toBe('ExposureHierarchy');
    expect(card.interventionType).toBe('exercise');
  });

  it('formatSuggestions en inglés para exposure_hierarchy', () => {
    const [card] = actionSuggestionService.formatSuggestions(['exposure_hierarchy'], 'en');
    expect(card.label).toMatch(/exposure/i);
  });

  it('shouldBoostExposureSuggestion detecta evitación', () => {
    expect(shouldBoostExposureSuggestion(CANONICAL_AVOIDANCE)).toBe(true);
    expect(shouldBoostExposureSuggestion('Estoy tranquilo hoy.')).toBe(false);
  });

  it('shouldBypassTccSuggestionCadence con evitación en 6/10 solo en 1.er turno', () => {
    expect(shouldBypassTccSuggestionCadence(CANONICAL_AVOIDANCE)).toBe(true);
    expect(shouldBypassTccSuggestionCadence('Me siento bien hoy.')).toBe(false);
    expect(
      shouldBypassTccSuggestionCadence(CANONICAL_AVOIDANCE, [
        { role: 'user', content: 'hola' },
        { role: 'user', content: 'otro' },
      ]),
    ).toBe(false);
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

  it('applyExposureSuggestionPolicy no inyecta exposure en ansiedad alta sin evitación', () => {
    const out = applyExposureSuggestionPolicy(
      ['breathing_exercise', 'grounding_technique', 'psychoeducation_anxiety'],
      {
        emotion: 'ansiedad',
        intensityLevel: 'high',
        userContent: 'Me siento muy ansioso, corazón acelerado. 9/10',
      },
    );
    expect(out).not.toContain('exposure_hierarchy');
    expect(out[0]).toBe('breathing_exercise');
  });

  describe('mensajes canónicos (dispositivo)', () => {
    it.each(CHAT_EXPOSURE_SMOKE_CASES)(
      '$id → pipeline emocional + exposure esperado',
      async ({
        message,
        minIntensity,
        maxIntensity,
        expectExposure,
        expectExposureFirst,
        expectRegulation,
      }) => {
        const { analysis, actionIds, exposureCard } = await runExposurePipeline(message);

        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (maxIntensity != null) {
          expect(analysis.intensity).toBeLessThanOrEqual(maxIntensity);
        }

        if (expectExposure) {
          expect(actionIds).toContain('exposure_hierarchy');
          expect(exposureCard?.screen).toBe('ExposureHierarchy');
          if (expectExposureFirst) {
            expect(actionIds[0]).toBe('exposure_hierarchy');
          }
        } else {
          expect(actionIds).not.toContain('exposure_hierarchy');
        }

        if (expectRegulation) {
          expect(
            actionIds.some((id) =>
              ['breathing_exercise', 'grounding_technique'].includes(id),
            ),
          ).toBe(true);
        }
      },
    );
  });

  describe('paridad EN', () => {
    it.each(CHAT_EXPOSURE_SMOKE_CASES_EN)(
      '$id → incluye exposure_hierarchy',
      async ({ message, minIntensity, expectExposure, expectExposureFirst }) => {
        const { analysis, actionIds, exposureCard } = await runExposurePipeline(message, 'en');
        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (expectExposure) {
          expect(actionIds).toContain('exposure_hierarchy');
          expect(exposureCard?.screen).toBe('ExposureHierarchy');
          if (expectExposureFirst) {
            expect(actionIds[0]).toBe('exposure_hierarchy');
          }
        }
      },
    );
  });
});
