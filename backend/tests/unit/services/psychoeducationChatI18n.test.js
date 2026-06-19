/**
 * Paridad EN: tiers, snippet, microSteps (#78 / #85).
 */
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import actionSuggestionService from '../../../services/actionSuggestionService.js';
import {
  applyPsychoeducationCardTiers,
  buildPsychoeducationPromptSnippet,
  pickPredominantPsychoeducationId,
} from '../../../services/psychoeducationPromptSnippetService.js';
import { resolveContextualPsychoeducationIds } from '../../../services/actionSuggestionService.js';
import { CHAT_PSYCHOEDUCATION_SMOKE_CASES_EN } from '../../fixtures/chatPsychoeducationSmokeMessages.en.js';

function runPipeline(message, language = 'en') {
  return emotionalAnalyzer.analyzeEmotion(message).then((analysis) => {
    const ids = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const formatted = applyPsychoeducationCardTiers(
      actionSuggestionService.formatSuggestions(ids, language),
      { userContent: message, mainEmotion: analysis.mainEmotion },
    );
    return { analysis, ids, formatted };
  });
}

describe('psychoeducationChatI18n', () => {
  it('resolveContextualPsychoeducationIds detecta stress en inglés', () => {
    const ids = resolveContextualPsychoeducationIds(
      'Work stress has me burned out',
    );
    expect(ids).toContain('psychoeducation_work_stress');
  });

  it('resolveContextualPsychoeducationIds detecta sleep en inglés', () => {
    const ids = resolveContextualPsychoeducationIds(
      'I have insomnia and wake up at night',
    );
    expect(ids).toContain('psychoeducation_sleep');
  });

  it('resolveContextualPsychoeducationIds detecta duelo en inglés', () => {
    const ids = resolveContextualPsychoeducationIds('I miss him so much since he passed');
    expect(ids).toContain('psychoeducation_grief');
  });

  it.each(CHAT_PSYCHOEDUCATION_SMOKE_CASES_EN)(
    '$id (en)',
    async ({
      message,
      expectedPsycho,
      allowedEmotions,
      minIntensity,
      minSuggestions,
      expectPromptSnippet,
      primaryPsycho,
      language,
    }) => {
      const { analysis, ids, formatted } = await runPipeline(message, language);

      expect(allowedEmotions).toContain(analysis.mainEmotion);
      expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
      expect(ids.length).toBeGreaterThanOrEqual(minSuggestions);

      for (const psychoId of expectedPsycho) {
        expect(ids).toContain(psychoId);
      }

      const primaryId =
        primaryPsycho ||
        pickPredominantPsychoeducationId(formatted, {
          userContent: message,
          mainEmotion: analysis.mainEmotion,
        });

      for (const psychoId of expectedPsycho) {
        const card = formatted.find((c) => c.id === psychoId);
        expect(card?.previewTitle).toMatch(/[A-Za-z]/);
        if (psychoId === primaryId) {
          expect(card?.cardDisplayMode).toBe('expanded');
          expect(card?.microSteps?.length).toBe(2);
          expect(card.microSteps[0]).toMatch(/[A-Za-z]/);
          expect(card.microSteps[0]).not.toMatch(/ñ|á|é|í|ó|ú/i);
        } else if (expectedPsycho.length > 1) {
          expect(card?.cardDisplayMode).toBe('compact');
        }
      }

      if (expectPromptSnippet) {
        const snippet = buildPsychoeducationPromptSnippet(
          formatted,
          'en',
          primaryId,
        );
        expect(snippet).toMatch(/Psychoeducation card in the UI/i);
        const primaryCard = formatted.find((c) => c.id === primaryId);
        expect(snippet).toContain(primaryCard.previewTitle);
      }
    },
  );
});
