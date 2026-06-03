import actionSuggestionService from '../../../services/actionSuggestionService.js';
import {
  buildPsychoeducationPromptSnippet,
  extractPsychoeducationSuggestions,
} from '../../../services/psychoeducationPromptSnippetService.js';
import { buildContextualizedPrompt } from '../../../services/openai/openaiPromptBuilder.js';

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

  it('buildPsychoeducationPromptSnippet incluye títulos de tarjetas', () => {
    const formatted = actionSuggestionService.formatSuggestions(
      ['psychoeducation_stress', 'psychoeducation_anxiety'],
      'es',
    );
    const snippet = buildPsychoeducationPromptSnippet(formatted, 'es');
    expect(snippet).toMatch(/Estrés/);
    expect(snippet).toMatch(/Ansiedad/);
    expect(snippet).toMatch(/psicoeducación/i);
  });

  it('buildPsychoeducationPromptSnippet devuelve null sin psicoed', () => {
    const formatted = actionSuggestionService.formatSuggestions(
      ['breathing_exercise'],
      'es',
    );
    expect(buildPsychoeducationPromptSnippet(formatted, 'es')).toBeNull();
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
    expect(systemMessage).toMatch(/Tarjetas de psicoeducación/i);
    expect(systemMessage).toMatch(/Ansiedad/);
  });
});
