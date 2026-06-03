/**
 * Contrato chat: sugerencia Autorregistro ABC (#86 / #127).
 */
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import actionSuggestionService from '../../../services/actionSuggestionService.js';
import { enrichSuggestionsWithAbcPrefill } from '../../../services/abcRecordPrefillService.js';
import {
  applyPsychoeducationCardTiers,
} from '../../../services/psychoeducationPromptSnippetService.js';
import { getInterventionCatalogEntry } from '../../../constants/interventionCatalog.js';
import {
  CHAT_ABC_SMOKE_CASES,
  CHAT_ABC_SMOKE_CASES_EN,
} from '../../fixtures/chatAbcSmokeMessages.js';

function runAbcPipeline(message, language = 'es') {
  return emotionalAnalyzer.analyzeEmotion(message).then((analysis) => {
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const rawFormatted = actionSuggestionService.formatSuggestions(actionIds, language);
    const tiered = applyPsychoeducationCardTiers(rawFormatted, {
      userContent: message,
      mainEmotion: analysis.mainEmotion,
    });
    const formatted = enrichSuggestionsWithAbcPrefill(tiered, message);
    const abcCard = formatted.find((s) => s.id === 'abc_record');
    return { analysis, actionIds, formatted, abcCard };
  });
}

describe('chatAbcSuggestions (#86)', () => {
  it('abc_record existe en catálogo con pantalla AbcRecord', () => {
    const entry = getInterventionCatalogEntry('abc_record');
    expect(entry).toBeTruthy();
    expect(entry.screen).toBe('AbcRecord');
    expect(entry.type).toBe('exercise');
  });

  it('formatSuggestions devuelve screen navegable para abc_record', () => {
    const [card] = actionSuggestionService.formatSuggestions(['abc_record'], 'es');
    expect(card.id).toBe('abc_record');
    expect(card.screen).toBe('AbcRecord');
    expect(card.label).toMatch(/ABC|Autorregistro/i);
    expect(card.interventionType).toBe('exercise');
  });

  it('formatSuggestions en inglés para abc_record', () => {
    const [card] = actionSuggestionService.formatSuggestions(['abc_record'], 'en');
    expect(card.label).toMatch(/ABC/i);
  });

  describe('mensajes canónicos (dispositivo)', () => {
    it.each(CHAT_ABC_SMOKE_CASES)(
      '$id → pipeline emocional + abc esperado',
      async ({
        message,
        allowedEmotions,
        minIntensity,
        maxIntensity,
        expectAbc,
      }) => {
        const { analysis, actionIds, abcCard } = await runAbcPipeline(message);

        expect(allowedEmotions).toContain(analysis.mainEmotion);
        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (maxIntensity != null) {
          expect(analysis.intensity).toBeLessThanOrEqual(maxIntensity);
        }

        if (expectAbc) {
          expect(actionIds).toContain('abc_record');
          expect(actionIds[0]).toBe('abc_record');
          expect(abcCard?.screen).toBe('AbcRecord');
          expect(abcCard?.params?.fromChat).toBe(true);
          expect(abcCard?.params?.prefillActivatingEvent?.length).toBeGreaterThan(2);
          if (message.includes('pienso') || message.includes('thinking')) {
            expect(abcCard?.params?.prefillBeliefs?.length).toBeGreaterThan(2);
          }
        } else {
          expect(actionIds).not.toContain('abc_record');
        }
      },
    );
  });

  describe('paridad EN', () => {
    it.each(CHAT_ABC_SMOKE_CASES_EN)(
      '$id → incluye abc_record',
      async ({ message, minIntensity, expectAbc }) => {
        const { analysis, actionIds, abcCard } = await runAbcPipeline(message, 'en');
        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (expectAbc) {
          expect(actionIds).toContain('abc_record');
          expect(actionIds[0]).toBe('abc_record');
          expect(abcCard?.screen).toBe('AbcRecord');
        }
      },
    );
  });
});
