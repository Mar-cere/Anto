/**
 * Regresión golden del ensamblado del system prompt (#119).
 */
import { describe, expect, it, beforeAll } from '@jest/globals';
import { buildContextualizedPrompt, BASE_ASSISTANT_PROMPT } from '../../../services/openai/openaiPromptBuilder.js';
import { PROMPT_GOLDEN_CASES } from '../../golden/promptRegression.fixtures.js';

beforeAll(() => {
  process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
});

describe('prompt regression golden (#119)', () => {
  it('BASE_ASSISTANT_PROMPT mantiene anclas de seguridad, tono y conversación primero', () => {
    expect(BASE_ASSISTANT_PROMPT).toContain('autolesión');
    expect(BASE_ASSISTANT_PROMPT).toContain('suicidio');
    expect(BASE_ASSISTANT_PROMPT).toContain('No diagnostiques');
    expect(BASE_ASSISTANT_PROMPT).toContain('español neutro');
    expect(BASE_ASSISTANT_PROMPT).toContain('nunca voseo');
    expect(BASE_ASSISTANT_PROMPT).toContain('Invitar al desahogo');
    expect(BASE_ASSISTANT_PROMPT).toContain('plus');
    expect(BASE_ASSISTANT_PROMPT).toContain('No asumir gana');
  });

  for (const c of PROMPT_GOLDEN_CASES) {
    it(`caso ${c.id}`, async () => {
      const { systemMessage } = await buildContextualizedPrompt(c.message, c.context);
      expect(systemMessage.length).toBeGreaterThan(200);
      for (const frag of c.expect.allOf) {
        expect(systemMessage).toContain(frag);
      }
      for (const frag of c.expect.noneOf) {
        expect(systemMessage).not.toContain(frag);
      }
    });
  }
});
