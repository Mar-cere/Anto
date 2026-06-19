/**
 * Contrato chat: análisis emocional + sugerencias con psicoed (#85 / #127).
 */
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import actionSuggestionService, {
  CONTEXTUAL_PSYCHOEDUCATION_RULES,
  resolveContextualPsychoeducationIds,
  resolveSuggestionEmotion,
  shouldAttachEmotionPsychoeducation,
} from '../../../services/actionSuggestionService.js';
import {
  applyPsychoeducationCardTiers,
  buildPsychoeducationPromptSnippet,
  pickPredominantPsychoeducationId,
} from '../../../services/psychoeducationPromptSnippetService.js';
import { getInterventionCatalogEntry } from '../../../constants/interventionCatalog.js';
import { CHAT_PSYCHOEDUCATION_SMOKE_CASES } from '../../fixtures/chatPsychoeducationSmokeMessages.js';

function runChatPipeline(message) {
  return emotionalAnalyzer.analyzeEmotion(message).then((analysis) => {
    const suggestions = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const raw = actionSuggestionService.formatSuggestions(suggestions, 'es');
    const formatted = applyPsychoeducationCardTiers(raw, {
      userContent: message,
      mainEmotion: analysis.mainEmotion,
    });
    return { analysis, suggestions, formatted };
  });
}

describe('chatPsychoeducationSuggestions (#85)', () => {
  describe('helpers exportados', () => {
    it('resolveContextualPsychoeducationIds devuelve ids del catálogo', () => {
      const ids = resolveContextualPsychoeducationIds(
        'El estrés del trabajo me tiene agotada',
      );
      expect(ids).toContain('psychoeducation_work_stress');
      ids.forEach((id) => {
        expect(getInterventionCatalogEntry(id)).toBeTruthy();
      });
    });

    it('resolveContextualPsychoeducationIds detecta psicoed avanzada #90–#92', () => {
      expect(
        resolveContextualPsychoeducationIds(
          'Rumio todo con autocrítica constante, nada va a mejorar',
        ),
      ).toContain('psychoeducation_depression_advanced');
      expect(
        resolveContextualPsychoeducationIds(
          'Preocupación constante, no paro de pensar y busco confirmación',
        ),
      ).toContain('psychoeducation_anxiety_advanced');
      expect(
        resolveContextualPsychoeducationIds(
          'No puedo desconectar del trabajo, ansiedad dominical',
        ),
      ).toContain('psychoeducation_work_stress');
    });

    it('resolveSuggestionEmotion mapea neutral + estrés a ansiedad', () => {
      expect(
        resolveSuggestionEmotion(
          'neutral',
          'El estrés del trabajo me tiene agotada',
        ),
      ).toBe('ansiedad');
    });

    it('resolveSuggestionEmotion mapea neutral + sad (EN) a tristeza', () => {
      expect(
        resolveSuggestionEmotion('neutral', 'I feel sad and low, 7/10'),
      ).toBe('tristeza');
    });

    it('resolveSuggestionEmotion prioriza desborde sobre estrés', () => {
      expect(
        resolveSuggestionEmotion(
          'neutral',
          'Me desborda el estrés y exploto sin querer',
        ),
      ).toBe('enojo');
    });

    it('resolveSuggestionEmotion no fuerza ansiedad con insomnio (EN)', () => {
      expect(
        resolveSuggestionEmotion('neutral', "I can't sleep and wake up at night"),
      ).toBe('neutral');
    });

    it('resolveContextualPsychoeducationIds detecta duelo en inglés', () => {
      const ids = resolveContextualPsychoeducationIds('I lost my dad last month');
      expect(ids).toContain('psychoeducation_grief');
    });

    it('shouldAttachEmotionPsychoeducation enojo desde intensidad 6', () => {
      expect(shouldAttachEmotionPsychoeducation('enojo', 'Hoy me molestó algo', 6)).toBe(
        true,
      );
      expect(shouldAttachEmotionPsychoeducation('enojo', 'Hoy me molestó algo', 5)).toBe(
        false,
      );
    });

    it('CONTEXTUAL_PSYCHOEDUCATION_RULES solo referencia ids válidos', () => {
      for (const { id } of CONTEXTUAL_PSYCHOEDUCATION_RULES) {
        const entry = getInterventionCatalogEntry(id);
        expect(entry?.type).toBe('psychoeducation');
        expect(entry?.screen).toBe('PsychoeducationModule');
      }
    });
  });

  describe('mensajes canónicos (dispositivo)', () => {
    it.each(CHAT_PSYCHOEDUCATION_SMOKE_CASES)(
      '$id → sugerencias con psicoed esperada',
      async ({
        message,
        expectedPsycho,
        allowedEmotions,
        minIntensity,
        minSuggestions,
        expectPromptSnippet,
      }) => {
        const { analysis, suggestions, formatted } = await runChatPipeline(message);

        expect(allowedEmotions).toContain(analysis.mainEmotion);
        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        expect(suggestions.length).toBeGreaterThanOrEqual(minSuggestions);

        const presentPsycho = expectedPsycho.filter((id) => suggestions.includes(id));
        expect(presentPsycho.length).toBeGreaterThanOrEqual(1);
        const primaryId = pickPredominantPsychoeducationId(formatted, {
          userContent: message,
          mainEmotion: analysis.mainEmotion,
        });

        for (const psychoId of presentPsycho) {
          const card = formatted.find((c) => c.id === psychoId);
          expect(card?.screen).toBe('PsychoeducationModule');
          expect(card?.params?.topic).toBeTruthy();
          expect(card?.previewTitle?.length).toBeGreaterThan(0);
          if (psychoId === primaryId) {
            expect(card?.cardDisplayMode).toBe('expanded');
            expect(card?.microSteps?.length).toBeGreaterThanOrEqual(2);
          } else if (presentPsycho.length > 1) {
            expect(card?.cardDisplayMode).toBe('compact');
            expect(card?.microSteps?.length || 0).toBe(0);
            expect(card?.mechanismLine).toBeUndefined();
          }
        }

        if (expectPromptSnippet) {
          const snippet = buildPsychoeducationPromptSnippet(
            formatted,
            'es',
            primaryId,
          );
          expect(snippet).toMatch(/tarjeta principal/i);
          const primaryCard = formatted.find((c) => c.id === primaryId);
          expect(snippet).toContain(primaryCard.previewTitle);
        }
      },
    );
  });

  describe('regresiones', () => {
    it('neutral sin señales contextual ni emoción mapeada → []', async () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'neutral', intensity: 6, topic: 'general' },
        {},
        { userContent: 'Hoy el clima está agradable.' },
      );
      expect(suggestions).toEqual([]);
    });

    it('fallback contextual respeta rankingScores', async () => {
      const message =
        'Llevo semanas con insomnio y me despierto a la noche sin poder volver a dormir. 7/10';
      const analysis = await emotionalAnalyzer.analyzeEmotion(message);
      const suggestions = actionSuggestionService.generateSuggestions(
        analysis,
        {},
        {
          userContent: message,
          rankingScores: new Map([
            ['psychoeducation_sleep', 10],
            ['mindfulness_reminder', -5],
          ]),
        },
      );
      expect(suggestions).toContain('psychoeducation_sleep');
      expect(suggestions.indexOf('psychoeducation_sleep')).toBeLessThan(
        suggestions.includes('mindfulness_reminder')
          ? suggestions.indexOf('mindfulness_reminder')
          : Number.MAX_SAFE_INTEGER,
      );
    });

    it('getAllReferencedInterventionIds incluye psicoed contextual', () => {
      const ids = actionSuggestionService.getAllReferencedInterventionIds();
      for (const { id } of CONTEXTUAL_PSYCHOEDUCATION_RULES) {
        expect(ids).toContain(id);
      }
    });
  });
});
