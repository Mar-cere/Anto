/**
 * Límites CHAT_PROMPT_* y budgets 0/1 (imports dinámicos tras resetModules).
 */
import { jest } from '@jest/globals';

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

describe('openaiPromptBuilder — budget borde (env CHAT_PROMPT_*)', () => {
  let savedMax;
  let savedTail;

  beforeAll(() => {
    savedMax = process.env.CHAT_PROMPT_MAX_MESSAGES;
    savedTail = process.env.CHAT_PROMPT_SLIDING_TAIL;
  });

  afterEach(() => {
    jest.resetModules();
    if (savedMax === undefined) delete process.env.CHAT_PROMPT_MAX_MESSAGES;
    else process.env.CHAT_PROMPT_MAX_MESSAGES = savedMax;
    if (savedTail === undefined) delete process.env.CHAT_PROMPT_SLIDING_TAIL;
    else process.env.CHAT_PROMPT_SLIDING_TAIL = savedTail;
  });

  it('budget 1: un hueco en cabeza + cola (9+1=10)', async () => {
    jest.resetModules();
    process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
    process.env.CHAT_PROMPT_MAX_MESSAGES = '10';
    process.env.CHAT_PROMPT_SLIDING_TAIL = '9';
    const { selectHistoryForPrompt: sel } = await import(
      '../../../services/openai/openaiPromptBuilder.js'
    );
    const chronological = [];
    for (let i = 0; i < 20; i += 1) {
      chronological.push(msg('user', `x${i}`, i));
    }
    const out = sel(chronological, baseCtx);
    expect(out.length).toBe(10);
    expect(out[out.length - 1].content).toBe('x19');
    expect(out.map((m) => m.content)).toContain('x11');
  });

  it('budget 0: solo ventana final (cola = MAX)', async () => {
    jest.resetModules();
    process.env.ENABLE_PROMPT_HISTORY_TELEMETRY = 'false';
    process.env.CHAT_PROMPT_MAX_MESSAGES = '10';
    process.env.CHAT_PROMPT_SLIDING_TAIL = '10';
    const { selectHistoryForPrompt: sel } = await import(
      '../../../services/openai/openaiPromptBuilder.js'
    );
    const chronological = [];
    for (let i = 0; i < 25; i += 1) {
      chronological.push(msg('user', `y${i}`, i));
    }
    const out = sel(chronological, baseCtx);
    expect(out.length).toBe(10);
    expect(out[0].content).toBe('y15');
    expect(out[9].content).toBe('y24');
  });

  it('tail mayor que max se recorta al max', async () => {
    jest.resetModules();
    process.env.CHAT_PROMPT_MAX_MESSAGES = '8';
    process.env.CHAT_PROMPT_SLIDING_TAIL = '20';
    const { HISTORY_LIMITS: HL } = await import('../../../constants/openai.js');
    expect(HL.MESSAGES_IN_PROMPT).toBe(8);
    expect(HL.SLIDING_TAIL_MESSAGES).toBe(8);
  });
});
