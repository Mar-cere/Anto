import actionSuggestionService, {
  applyBaSuggestionPolicy,
  shouldBoostBaSuggestion,
} from '../../../services/actionSuggestionService.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import { getInterventionCatalogEntry } from '../../../constants/interventionCatalog.js';
import { planChatActionSuggestions } from '../../../services/psychoeducationPromptSnippetService.js';
import {
  CHAT_BA_SMOKE_CASES,
  CHAT_BA_SMOKE_CASES_EN,
} from '../../fixtures/chatBaSmokeMessages.js';

const CANONICAL_APATHY =
  'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.';

function runBaPipeline(message, language = 'es') {
  return emotionalAnalyzer.analyzeEmotion(message).then((analysis) => {
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const formatted = actionSuggestionService.formatSuggestions(actionIds, language);
    const baCard = formatted.find((s) => s.id === 'behavioral_activation');
    return { analysis, actionIds, formatted, baCard };
  });
}

describe('chatBaSuggestions (#88)', () => {
  it('behavioral_activation existe en catálogo con pantalla BehavioralActivation', () => {
    const entry = getInterventionCatalogEntry('behavioral_activation');
    expect(entry?.screen).toBe('BehavioralActivation');
    expect(entry?.type).toBe('exercise');
    const [card] = actionSuggestionService.formatSuggestions(['behavioral_activation'], 'es');
    expect(card.screen).toBe('BehavioralActivation');
  });

  it('shouldBoostBaSuggestion detecta apatía', () => {
    expect(shouldBoostBaSuggestion(CANONICAL_APATHY)).toBe(true);
    expect(shouldBoostBaSuggestion('Estoy bien hoy.')).toBe(false);
  });

  it('applyBaSuggestionPolicy prioriza BA en tristeza media con apatía', () => {
    const out = applyBaSuggestionPolicy(
      ['gratitude_journal', 'psychoeducation_depression'],
      {
        emotion: 'tristeza',
        intensityLevel: 'medium',
        userContent: CANONICAL_APATHY,
      },
    );
    expect(out[0]).toBe('behavioral_activation');
  });

  it('planChatActionSuggestions incluye prefill en behavioral_activation', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion(CANONICAL_APATHY);
    const plan = await planChatActionSuggestions({
      emotionalAnalysis: analysis,
      contextualAnalysis: {},
      userContent: CANONICAL_APATHY,
      userId: 'u1',
      conversationId: 'c1',
      conversationHistory: [{ role: 'assistant', content: 'Hola' }],
      language: 'es',
    });
    const ba = plan.formatted.find((s) => s.id === 'behavioral_activation');
    expect(ba?.params?.fromChat).toBe(true);
    expect(ba?.params?.prefillMoodBefore).toBe(6);
    expect(ba?.params?.prefillActivityDescription).toMatch(/paseo/i);
  });

  it('applyBaSuggestionPolicy no desplaza ABC si ya es primero', () => {
    const out = applyBaSuggestionPolicy(
      ['abc_record', 'behavioral_activation', 'gratitude_journal'],
      {
        emotion: 'tristeza',
        intensityLevel: 'medium',
        userContent: CANONICAL_APATHY,
      },
    );
    expect(out[0]).toBe('abc_record');
  });

  describe('mensajes canónicos (dispositivo)', () => {
    it.each(CHAT_BA_SMOKE_CASES)(
      '$id → pipeline emocional + BA esperado',
      async ({
        message,
        minIntensity,
        maxIntensity,
        expectBa,
        expectBaFirst,
        expectAbc,
        expectAbcFirst,
        expectAt,
        expectAtFirst,
      }) => {
        const { analysis, actionIds, baCard } = await runBaPipeline(message);

        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (maxIntensity != null) {
          expect(analysis.intensity).toBeLessThanOrEqual(maxIntensity);
        }

        if (expectBa) {
          expect(actionIds).toContain('behavioral_activation');
          expect(baCard?.screen).toBe('BehavioralActivation');
          if (expectBaFirst) {
            expect(actionIds[0]).toBe('behavioral_activation');
          }
        } else {
          expect(actionIds).not.toContain('behavioral_activation');
        }

        if (expectAbc) {
          expect(actionIds).toContain('abc_record');
          if (expectAbcFirst) {
            expect(actionIds[0]).toBe('abc_record');
          }
        } else if (expectAbc === false) {
          expect(actionIds).not.toContain('abc_record');
        }

        if (expectAt) {
          expect(actionIds).toContain('automatic_thought_record');
          if (expectAtFirst) {
            expect(actionIds[0]).toBe('automatic_thought_record');
          }
        }
      },
    );
  });

  describe('paridad EN', () => {
    it.each(CHAT_BA_SMOKE_CASES_EN)(
      '$id → incluye behavioral_activation',
      async ({ message, minIntensity, expectBa, expectBaFirst }) => {
        const { analysis, actionIds, baCard } = await runBaPipeline(message, 'en');
        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (expectBa) {
          expect(actionIds).toContain('behavioral_activation');
          expect(baCard?.screen).toBe('BehavioralActivation');
          if (expectBaFirst) {
            expect(actionIds[0]).toBe('behavioral_activation');
          }
        }
      },
    );
  });
});
