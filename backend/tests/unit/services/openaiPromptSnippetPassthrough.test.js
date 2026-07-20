import {
  applyEnhancementSnippetsToPromptContext,
  buildContextualizedPrompt,
  ENHANCEMENT_PROMPT_SNIPPET_KEYS,
  PROMPT_CONTEXT_PASSTHROUGH_KEYS,
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

  it('reenvía contexto de turno (fase, mood, distress, rolling summary, etc.)', () => {
    const gen = {
      rollingSummary: 'Resumen de prueba',
      sessionPhase: 'acute',
      dailyMoodCheckIn: { mood: 'tired' },
      distress: { theme: 'harm_intrusive_thoughts' },
      safetyHistory: [{ role: 'user', content: 'hola' }],
      sessionEmotionalIntensity: 8,
    };
    const out = applyEnhancementSnippetsToPromptContext({ base: 1 }, gen);
    for (const key of Object.keys(gen)) {
      expect(PROMPT_CONTEXT_PASSTHROUGH_KEYS).toContain(key);
      expect(out[key]).toEqual(gen[key]);
    }
  });

  it('no añade claves ausentes ni muta el contexto base', () => {
    const base = { base: 1 };
    const out = applyEnhancementSnippetsToPromptContext(base, {});
    expect(out).toEqual({ base: 1 });
    expect(out).not.toBe(base);
  });

  it('incluye sessionCommitment y snippets clave (fenotipo #216, RAG #203, follow-up #202, recall B, técnicas/gratitud)', () => {
    expect(ENHANCEMENT_PROMPT_SNIPPET_KEYS).toEqual(
      expect.arrayContaining([
        'sessionCommitmentPromptSnippet',
        'digitalPhenotypePromptSnippet',
        'personalPatternRagPromptSnippet',
        'commitmentFollowUpPromptSnippet',
        'experientialFollowUpPromptSnippet',
        'experientialRecallPromptSnippet',
        'techniqueSuggestionPromptSnippet',
        'gratitudeJournalPromptSnippet',
      ]),
    );
    expect(PROMPT_CONTEXT_PASSTHROUGH_KEYS).toEqual(
      expect.arrayContaining(['productActionToolEnabled', 'softCrisisCheckInActive']),
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

  it('concatena el snippet de recall experiencial (promesa B)', async () => {
    const ctx = applyEnhancementSnippetsToPromptContext(
      { emotional: {}, contextual: {} },
      { experientialRecallPromptSnippet: '\n\nRECALL_MARKER_B\n' },
    );
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, ctx);
    expect(systemMessage).toContain('RECALL_MARKER_B');
  });

  it('mutea RAG si hay recall en el mismo contexto', async () => {
    const ctx = applyEnhancementSnippetsToPromptContext(
      { emotional: {}, contextual: {} },
      {
        personalPatternRagPromptSnippet: '\n\nRAG_MARKER_203\n',
        experientialRecallPromptSnippet: '\n\nRECALL_MARKER_B\n',
      },
    );
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, ctx);
    expect(systemMessage).toContain('RECALL_MARKER_B');
    expect(systemMessage).not.toContain('RAG_MARKER_203');
  });

  it('concatena RAG cuando no hay follow-up ni recall', async () => {
    const ctx = applyEnhancementSnippetsToPromptContext(
      { emotional: {}, contextual: {} },
      { personalPatternRagPromptSnippet: '\n\nRAG_MARKER_203\n' },
    );
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, ctx);
    expect(systemMessage).toContain('RAG_MARKER_203');
  });

  it('concatena sessionCommitment al system message', async () => {
    const ctx = applyEnhancementSnippetsToPromptContext(
      { emotional: {}, contextual: {} },
      { sessionCommitmentPromptSnippet: '\n\nSESSION_COMMITMENT_MARKER\n' },
    );
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, ctx);
    expect(systemMessage).toContain('SESSION_COMMITMENT_MARKER');
  });

  it('inyecta rolling summary y fase cuando vienen del passthrough', async () => {
    const ctx = applyEnhancementSnippetsToPromptContext(
      { emotional: {}, contextual: {} },
      {
        rollingSummary: 'La persona habló de sueño y estrés laboral.',
        sessionPhase: 'acute',
      },
    );
    const { systemMessage } = await buildContextualizedPrompt({ content: 'hola' }, ctx);
    expect(systemMessage).toContain('Resumen acumulado del hilo');
    expect(systemMessage).toContain('sueño y estrés laboral');
    expect(systemMessage).toContain('### Cierre con avance (fase de seguridad)');
  });
});
