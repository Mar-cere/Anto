import actionSuggestionService from '../../../services/actionSuggestionService.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import {
  applyPsychoeducationCardTiers,
  buildPsychoeducationPromptSnippet,
  extractPsychoeducationSuggestions,
  pickPredominantPsychoeducationId,
} from '../../../services/psychoeducationPromptSnippetService.js';
import { buildContextualizedPrompt } from '../../../services/openai/openaiPromptBuilder.js';
import { CHAT_PSYCHOEDUCATION_SMOKE_CASES } from '../../fixtures/chatPsychoeducationSmokeMessages.js';

describe('psychoeducationPromptSnippetService (#78)', () => {
  it('extractPsychoeducationSuggestions filtra solo psicoed', () => {
    const formatted = actionSuggestionService.formatSuggestions(
      ['breathing_exercise', 'psychoeducation_stress', 'psychoeducation_anxiety'],
      'es',
    );
    const psycho = extractPsychoeducationSuggestions(formatted);
    expect(psycho.map((p) => p.id)).toEqual([
      'psychoeducation_stress',
      'psychoeducation_anxiety',
    ]);
  });

  it('buildPsychoeducationPromptSnippet solo menciona tarjeta principal', () => {
    const raw = actionSuggestionService.formatSuggestions(
      ['psychoeducation_stress', 'psychoeducation_anxiety'],
      'es',
    );
    const formatted = applyPsychoeducationCardTiers(raw, {
      userContent: 'crisis de pánico y mucha ansiedad',
      mainEmotion: 'ansiedad',
    });
    const primaryId = pickPredominantPsychoeducationId(formatted, {
      userContent: 'crisis de pánico',
      mainEmotion: 'ansiedad',
    });
    const snippet = buildPsychoeducationPromptSnippet(formatted, 'es', primaryId);
    expect(snippet).toMatch(/Ansiedad/);
    expect(snippet).not.toMatch(/«Estrés»/);
    expect(snippet).toMatch(/tarjeta principal/i);
  });

  it('buildPsychoeducationPromptSnippet devuelve null sin psicoed', () => {
    const formatted = actionSuggestionService.formatSuggestions(
      ['breathing_exercise'],
      'es',
    );
    expect(buildPsychoeducationPromptSnippet(formatted, 'es')).toBeNull();
  });

  it('buildPsychoeducationPromptSnippet en inglés', () => {
    const formatted = actionSuggestionService.formatSuggestions(
      ['psychoeducation_sleep'],
      'en',
    );
    const snippet = buildPsychoeducationPromptSnippet(formatted, 'en');
    expect(snippet).toMatch(/Psychoeducation card in the UI/i);
    expect(snippet).toMatch(/Sleep/i);
  });

  it('device_stress_panic: ansiedad expandida, estrés compacto', async () => {
    const fixture = CHAT_PSYCHOEDUCATION_SMOKE_CASES.find(
      (c) => c.id === 'device_stress_panic',
    );
    const analysis = await emotionalAnalyzer.analyzeEmotion(fixture.message);
    const ids = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: fixture.message,
    });
    const formatted = applyPsychoeducationCardTiers(
      actionSuggestionService.formatSuggestions(ids, 'es'),
      { userContent: fixture.message, mainEmotion: analysis.mainEmotion },
    );
    const anxiety = formatted.find((c) => c.id === 'psychoeducation_anxiety');
    const snippet = buildPsychoeducationPromptSnippet(
      formatted,
      'es',
      'psychoeducation_anxiety',
    );
    expect(analysis.mainEmotion).toBe('ansiedad');
    expect(ids).toContain('psychoeducation_anxiety');
    expect(anxiety?.cardDisplayMode).toBe('expanded');
    expect(anxiety?.microSteps?.length).toBe(2);
    expect(snippet).toMatch(/Ansiedad/);
    expect(snippet).not.toMatch(/«Estrés»/);
  });

  it('formatSuggestions incluye microSteps (#78)', () => {
    const [card] = actionSuggestionService.formatSuggestions(
      ['psychoeducation_stress'],
      'es',
    );
    expect(card.microSteps?.length).toBe(2);
    expect(card.microSteps[0]).toMatch(/columnas|depende/i);
  });
});

describe('openaiPromptBuilder — snippet psicoed (#78)', () => {
  it('inyecta psychoeducationPromptSnippet en systemMessage', async () => {
    const snippet = buildPsychoeducationPromptSnippet(
      actionSuggestionService.formatSuggestions(['psychoeducation_anxiety'], 'es'),
      'es',
    );
    const { systemMessage } = await buildContextualizedPrompt(
      { content: 'Me siento ansioso', userId: 'u1', conversationId: 'c1' },
      {
        emotional: { mainEmotion: 'ansiedad', intensity: 8 },
        psychoeducationPromptSnippet: snippet,
      },
    );
    expect(systemMessage).toMatch(/tarjeta principal de psicoeducación/i);
    expect(systemMessage).toMatch(/Ansiedad/);
  });
});
