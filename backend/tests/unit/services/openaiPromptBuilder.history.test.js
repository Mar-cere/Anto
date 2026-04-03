/**
 * Ventana deslizante del historial para prompts (regresión).
 */
import {
  buildHistoryForPromptFromMessages,
  computeHistorySelectionForPrompt,
  selectHistoryForPrompt,
} from '../../../services/openai/openaiPromptBuilder.js';
import { HISTORY_LIMITS } from '../../../constants/openai.js';

beforeAll(() => {
  process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
});

const baseCtx = {
  emotional: { mainEmotion: 'ansiedad', intensity: 5 },
  contextual: {},
  currentMessage: 'hola',
};

function msg(role, content, i, intensity = 5) {
  const t = new Date(Date.now() + i * 60000);
  return {
    role,
    content,
    createdAt: t,
    metadata: { context: { emotional: { intensity, mainEmotion: 'neutral' } } },
  };
}

describe('openaiPromptBuilder — historial para prompt', () => {
  it('defaults: MESSAGES_IN_PROMPT 12 y SLIDING_TAIL 7 (sin env)', () => {
    expect(HISTORY_LIMITS.MESSAGES_IN_PROMPT).toBe(12);
    expect(HISTORY_LIMITS.SLIDING_TAIL_MESSAGES).toBe(7);
  });

  it('buildHistoryForPromptFromMessages respeta orden antiguo→reciente', () => {
    const newestFirst = [msg('user', 'c', 2), msg('assistant', 'b', 1), msg('user', 'a', 0)];
    const out = buildHistoryForPromptFromMessages(newestFirst, baseCtx);
    expect(out.map((m) => m.content).join('|')).toBe('a|b|c');
  });

  it('selectHistoryForPrompt conserva cola y respeta MESSAGES_IN_PROMPT', () => {
    const chronological = [];
    for (let i = 0; i < 24; i += 1) {
      chronological.push(msg('user', `u${i}`, i, i === 3 ? 9 : 4));
    }
    const out = selectHistoryForPrompt(chronological, {
      ...baseCtx,
      currentMessage: 'último',
    });
    expect(out.length).toBeLessThanOrEqual(HISTORY_LIMITS.MESSAGES_IN_PROMPT);
    expect(out[out.length - 1].content).toBe('u23');
    expect(out[out.length - 2].content).toBe('u22');
  });

  it('computeHistorySelectionForPrompt expone telemetría al truncar', () => {
    const chronological = [];
    for (let i = 0; i < 24; i += 1) {
      chronological.push(msg('user', `u${i}`, i, 4));
    }
    const { messages, telemetry } = computeHistorySelectionForPrompt(chronological, baseCtx);
    expect(telemetry.truncated).toBe(true);
    expect(telemetry.nonemptyCount).toBe(24);
    expect(telemetry.droppedTotal).toBeGreaterThan(0);
    expect(messages.length).toBeLessThanOrEqual(HISTORY_LIMITS.MESSAGES_IN_PROMPT);
    expect(telemetry.tailOnly === true || telemetry.pickedFromHeadCount >= 0).toBe(true);
  });

  it('prioriza mensaje con alta intensidad en el tramo viejo', () => {
    const chronological = [];
    for (let i = 0; i < 20; i += 1) {
      chronological.push(msg('user', `m${i}`, i, 4));
    }
    chronological[2] = {
      ...chronological[2],
      content: 'crisis-old',
      metadata: { context: { emotional: { intensity: 9, mainEmotion: 'miedo' } } },
    };
    const out = selectHistoryForPrompt(chronological, baseCtx);
    const contents = out.map((m) => m.content);
    expect(contents).toContain('crisis-old');
    expect(contents).toContain('m19');
  });
});
