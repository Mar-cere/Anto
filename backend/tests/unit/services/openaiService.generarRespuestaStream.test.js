/**
 * #168 — Regresión streaming OpenAI / generarRespuestaStream (#59).
 * Ejecutar en suite aislada (test:streaming-suite) para mock fresco de OpenAI.
 */
import { jest, describe, it, expect, afterEach } from '@jest/globals';
import { CircuitBreakerOpenError } from '../../../utils/circuitBreaker.js';

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-streaming-168';

await jest.unstable_mockModule('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  })),
}));

const { default: openaiService } = await import('../../../services/openaiService.js');

const baseContext = {
  emotional: { mainEmotion: 'neutral', intensity: 5 },
  contextual: { intencion: { tipo: 'SEEKING_HELP' } },
  profile: { preferences: {} },
  therapeutic: null,
  memory: {},
  history: [],
};

const baseMessage = {
  content: 'me siento mal hoy',
  userId: '507f1f77bcf86cd799439011',
  role: 'user',
};

describe('openaiService.generarRespuestaStream (#168 / #59)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rechaza mensaje vacío', async () => {
    const gen = openaiService.generarRespuestaStream(
      { ...baseMessage, content: '' },
      baseContext,
    );
    await expect(gen.next()).rejects.toThrow();
  });

  it('off-scope emite chunk y done sin llamar OpenAI', async () => {
    const spy = jest.spyOn(openaiService, 'createChatCompletionResilient');
    const events = [];
    for await (const ev of openaiService.generarRespuestaStream(
      { ...baseMessage, content: 'te gusta michael jackson' },
      baseContext,
    )) {
      events.push(ev);
    }
    expect(events.some((e) => e.type === 'chunk')).toBe(true);
    expect(events.some((e) => e.type === 'done')).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('emite chunks desde stream mockeado de OpenAI', async () => {
    async function* fakeStream() {
      yield { choices: [{ delta: { content: 'Te ' } }] };
      yield {
        choices: [{ delta: { content: 'escucho.' }, finish_reason: 'stop' }],
        usage: { completion_tokens: 4, prompt_tokens: 8, total_tokens: 12 },
      };
    }

    jest.spyOn(openaiService, 'createChatCompletionResilient').mockResolvedValue(fakeStream());

    const events = [];
    for await (const ev of openaiService.generarRespuestaStream(baseMessage, baseContext)) {
      events.push(ev);
    }

    const chunks = events.filter((e) => e.type === 'chunk');
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(events.find((e) => e.type === 'done')?.content).toBeTruthy();
  });

  it('circuit breaker devuelve done degradado sin chunks', async () => {
    jest
      .spyOn(openaiService, 'createChatCompletionResilient')
      .mockRejectedValue(
        Object.assign(new CircuitBreakerOpenError('open'), { code: 'CIRCUIT_BREAKER_OPEN' }),
      );

    const events = [];
    for await (const ev of openaiService.generarRespuestaStream(baseMessage, baseContext)) {
      events.push(ev);
    }

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('done');
    expect(events[0].context?.degraded).toBe(true);
    expect(events[0].context?.degradedReason).toBe('openai_breaker_open');
  });

  it('post-procesa y elimina cierre de tramo en recuperación de pánico', async () => {
    const closureTail =
      ' Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.';
    async function* fakeStream() {
      yield {
        choices: [
          {
            delta: {
              content: `Bien, eso ya indica que está cediendo.${closureTail}`,
            },
            finish_reason: 'stop',
          },
        ],
        usage: { completion_tokens: 20, prompt_tokens: 8, total_tokens: 28 },
      };
    }

    jest.spyOn(openaiService, 'createChatCompletionResilient').mockResolvedValue(fakeStream());

    const events = [];
    for await (const ev of openaiService.generarRespuestaStream(
      { ...baseMessage, content: 'Ya va bajando' },
      {
        ...baseContext,
        sessionPhase: 'default',
        crisis: { riskLevel: 'LOW' },
        sessionRetention: { userTurnCount: 5, likelyFarewell: false },
        safetyHistory: [
          { role: 'user', content: 'Todo, tuve crisis de panico' },
          { role: 'assistant', content: 'Eso puede dejarte muy sacudido.' },
          { role: 'user', content: 'Acaba de pasar' },
        ],
      },
    )) {
      events.push(ev);
    }

    const done = events.find((e) => e.type === 'done');
    expect(done?.content || '').toMatch(/cediendo/i);
    expect(done?.content || '').not.toMatch(/cerrar aqu[ií] este tramo/i);
  });
});
