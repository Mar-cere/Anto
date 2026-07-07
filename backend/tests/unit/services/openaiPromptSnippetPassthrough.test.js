import {
  applyEnhancementSnippetsToPromptContext,
  buildContextualizedPrompt,
  ENHANCEMENT_PROMPT_SNIPPET_KEYS,
} from '../../../services/openai/openaiPromptBuilder.js';

describe('applyEnhancementSnippetsToPromptContext (passthrough de snippets)', () => {
  it('reenvía todos los snippets de enhancement presentes', () => {
    const gen = {};
    ENHANCEMENT_PROMPT_SNIPPET_KEYS.forEach((k, i) => {
      gen[k] = `snippet-${i}`;
    });
    const out = applyEnhancementSnippetsToPromptContext({ base: 1 }, gen);
    expect(out.base).toBe(1);
    ENHANCEMENT_PROMPT_SNIPPET_KEYS.forEach((k, i) => {
      expect(out[k]).toBe(`snippet-${i}`);
    });
  });

  it('no añade claves ausentes ni muta el contexto base', () => {
    const base = { base: 1 };
    const out = applyEnhancementSnippetsToPromptContext(base, {});
    expect(out).toEqual({ base: 1 });
    expect(out).not.toBe(base);
  });

  it('incluye los snippets clave (fenotipo #216, RAG #203, follow-up #202)', () => {
    expect(ENHANCEMENT_PROMPT_SNIPPET_KEYS).toEqual(
      expect.arrayContaining([
        'digitalPhenotypePromptSnippet',
        'personalPatternRagPromptSnippet',
        'commitmentFollowUpPromptSnippet',
      ]),
    );
  });
});

describe('buildContextualizedPrompt + passthrough end-to-end', () => {
  it('concatena el snippet de follow-up de compromisos al system message', async () => {
    const ctx = applyEnhancementSnippetsToPromptContext(
      { emotional: {}, contextual: {} },
      { commitmentFollowUpPromptSnippet: '\n\nFOLLOW_UP_MARKER_202\n' },
    );
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, ctx);
    expect(systemMessage).toContain('FOLLOW_UP_MARKER_202');
  });

  it('concatena el snippet de fenotipo (#216) al system message', async () => {
    const ctx = applyEnhancementSnippetsToPromptContext(
      { emotional: {}, contextual: {} },
      { digitalPhenotypePromptSnippet: '\n\nPHENOTYPE_MARKER_216\n' },
    );
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, ctx);
    expect(systemMessage).toContain('PHENOTYPE_MARKER_216');
  });
});
