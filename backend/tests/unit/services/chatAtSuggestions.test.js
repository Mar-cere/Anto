import actionSuggestionService, {
  applyAutomaticThoughtSuggestionPolicy,
  applyBaSuggestionPolicy,
  shouldBoostAutomaticThoughtSuggestion,
} from '../../../services/actionSuggestionService.js';
import { enrichSuggestionsWithAtPrefill } from '../../../services/atRecordPrefillService.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import { getInterventionCatalogEntry } from '../../../constants/interventionCatalog.js';
import {
  CHAT_AT_SMOKE_CASES,
  CHAT_AT_SMOKE_CASES_EN,
} from '../../fixtures/chatAtSmokeMessages.js';

const CANONICAL_DISTORTION =
  'Me siento ansioso, 6/10. Sé que van a pensar mal de mí y nunca va a salir bien.';

function runAtPipeline(message, language = 'es') {
  return emotionalAnalyzer.analyzeEmotion(message).then((analysis) => {
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const formatted = actionSuggestionService.formatSuggestions(actionIds, language);
    const atCard = formatted.find((s) => s.id === 'automatic_thought_record');
    return { analysis, actionIds, formatted, atCard };
  });
}

describe('chatAtSuggestions (#89)', () => {
  it('automatic_thought_record existe en catálogo con pantalla AutomaticThoughtRecord', () => {
    const entry = getInterventionCatalogEntry('automatic_thought_record');
    expect(entry?.screen).toBe('AutomaticThoughtRecord');
    expect(entry?.type).toBe('exercise');
    const [card] = actionSuggestionService.formatSuggestions(['automatic_thought_record'], 'es');
    expect(card.screen).toBe('AutomaticThoughtRecord');
  });

  it('shouldBoostAutomaticThoughtSuggestion detecta distorsión', () => {
    expect(shouldBoostAutomaticThoughtSuggestion(CANONICAL_DISTORTION)).toBe(true);
    expect(shouldBoostAutomaticThoughtSuggestion('Estoy bien hoy.')).toBe(false);
  });

  it('applyAutomaticThoughtSuggestionPolicy prioriza AT con distorsión detectada', () => {
    const out = applyAutomaticThoughtSuggestionPolicy(
      ['abc_record', 'mindfulness_reminder'],
      {
        emotion: 'ansiedad',
        intensityLevel: 'medium',
        userContent: CANONICAL_DISTORTION,
      },
    );
    expect(out[0]).toBe('automatic_thought_record');
  });

  it('applyAutomaticThoughtSuggestionPolicy inserta AT tras ABC con señal cognitiva', () => {
    const msg =
      'Me siento enojado, 6/10. Noto que reaccioné mal y no paro de darle vueltas a lo que dije.';
    const out = applyAutomaticThoughtSuggestionPolicy(
      ['abc_record', 'psychoeducation_anger'],
      {
        emotion: 'enojo',
        intensityLevel: 'medium',
        userContent: msg,
      },
    );
    expect(out[0]).toBe('abc_record');
    expect(out[1]).toBe('automatic_thought_record');
  });

  it('applyAutomaticThoughtSuggestionPolicy no desplaza BA con apatía pura (#88)', () => {
    const apathy =
      'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.';
    const out = applyAutomaticThoughtSuggestionPolicy(
      applyBaSuggestionPolicy(
        ['gratitude_journal', 'psychoeducation_depression'],
        {
          emotion: 'tristeza',
          intensityLevel: 'medium',
          userContent: apathy,
        },
      ),
      {
        emotion: 'tristeza',
        intensityLevel: 'medium',
        userContent: apathy,
      },
    );
    expect(out[0]).toBe('behavioral_activation');
    expect(out).not.toContain('automatic_thought_record');
  });

  it('prefill AT en sugerencias formateadas desde mensaje con distorsión', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion(CANONICAL_DISTORTION);
    const actionIds = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: CANONICAL_DISTORTION,
    });
    expect(actionIds).toContain('automatic_thought_record');
    const formatted = enrichSuggestionsWithAtPrefill(
      actionSuggestionService.formatSuggestions(actionIds, 'es'),
      CANONICAL_DISTORTION,
      'es',
    );
    const at = formatted.find((s) => s.id === 'automatic_thought_record');
    expect(at?.params?.fromChat).toBe(true);
    expect(at?.params?.prefillDistortionType).toBeTruthy();
    expect(at?.params?.prefillEmotionIntensity).toBe(6);
  });

  describe('mensajes canónicos (dispositivo)', () => {
    it.each(CHAT_AT_SMOKE_CASES)(
      '$id → pipeline emocional + AT esperado',
      async ({
        message,
        allowedEmotions,
        minIntensity,
        maxIntensity,
        expectAt,
        expectAtFirst,
        expectAbc,
        expectAbcFirst,
        expectBa,
      }) => {
        const { analysis, actionIds, atCard } = await runAtPipeline(message);

        expect(allowedEmotions).toContain(analysis.mainEmotion);
        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (maxIntensity != null) {
          expect(analysis.intensity).toBeLessThanOrEqual(maxIntensity);
        }

        if (expectAt) {
          expect(actionIds).toContain('automatic_thought_record');
          expect(atCard?.screen).toBe('AutomaticThoughtRecord');
          if (expectAtFirst) {
            expect(actionIds[0]).toBe('automatic_thought_record');
          }
        } else {
          expect(actionIds).not.toContain('automatic_thought_record');
        }

        if (expectAbc) {
          expect(actionIds).toContain('abc_record');
          if (expectAbcFirst) {
            expect(actionIds[0]).toBe('abc_record');
          }
        } else if (expectAbc === false) {
          expect(actionIds).not.toContain('abc_record');
        }

        if (expectBa) {
          expect(actionIds).toContain('behavioral_activation');
        }
      },
    );
  });

  describe('paridad EN', () => {
    it.each(CHAT_AT_SMOKE_CASES_EN)(
      '$id → incluye automatic_thought_record',
      async ({ message, minIntensity, expectAt, expectAtFirst }) => {
        const { analysis, actionIds, atCard } = await runAtPipeline(message, 'en');
        expect(analysis.intensity).toBeGreaterThanOrEqual(minIntensity);
        if (expectAt) {
          expect(actionIds).toContain('automatic_thought_record');
          expect(atCard?.screen).toBe('AutomaticThoughtRecord');
          if (expectAtFirst) {
            expect(actionIds[0]).toBe('automatic_thought_record');
          }
        }
      },
    );
  });
});
