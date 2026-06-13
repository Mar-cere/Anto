/**
 * Tests — titular LLM de insight de sesión
 */
import { jest } from '@jest/globals';

const mockCreateChatCompletionResilient = jest.fn();

await jest.unstable_mockModule('../../../services/openaiService.js', () => ({
  __esModule: true,
  default: {
    createChatCompletionResilient: mockCreateChatCompletionResilient,
  },
}));

const { generateSessionInsightHeadline, isSessionInsightHeadlineLlmEnabled } = await import(
  '../../../services/sessionInsightHeadlineService.js'
);

describe('sessionInsightHeadlineService', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalEnable = process.env.ENABLE_SESSION_INSIGHT_HEADLINE_LLM;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.ENABLE_SESSION_INSIGHT_HEADLINE_LLM;
  });

  afterAll(() => {
    if (originalKey == null) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalEnable == null) delete process.env.ENABLE_SESSION_INSIGHT_HEADLINE_LLM;
    else process.env.ENABLE_SESSION_INSIGHT_HEADLINE_LLM = originalEnable;
  });

  it('isSessionInsightHeadlineLlmEnabled respeta flag false', () => {
    process.env.ENABLE_SESSION_INSIGHT_HEADLINE_LLM = 'false';
    expect(isSessionInsightHeadlineLlmEnabled()).toBe(false);
  });

  it('devuelve null sin API key', async () => {
    delete process.env.OPENAI_API_KEY;
    const out = await generateSessionInsightHeadline({
      userMsgs: [{ content: 'Me siento muy ansioso por el trabajo y no puedo parar de pensar' }],
      allMsgs: [{ role: 'user', content: 'test' }],
      language: 'es',
      fallbackHeadline: 'Titular base',
    });
    expect(out).toBeNull();
  });

  it('parsea headline desde JSON del LLM', async () => {
    mockCreateChatCompletionResilient.mockResolvedValue({
      choices: [{ message: { content: '{"headline":"Hoy nombraste lo que te pesa en el trabajo"}' } }],
    });

    const out = await generateSessionInsightHeadline({
      userMsgs: [
        { content: 'Me siento muy ansioso por el trabajo y no puedo parar de pensar' },
        { content: 'Siempre pienso que va a salir mal en las reuniones' },
      ],
      allMsgs: [
        { role: 'user', content: 'Me siento muy ansioso por el trabajo y no puedo parar de pensar' },
        { role: 'user', content: 'Siempre pienso que va a salir mal en las reuniones' },
      ],
      language: 'es',
      fallbackHeadline: 'Titular base',
      dominantEmotion: 'ansiedad',
    });

    expect(out).toBe('Hoy nombraste lo que te pesa en el trabajo');
  });

  it('omite LLM con riesgo medium/high', async () => {
    const out = await generateSessionInsightHeadline({
      userMsgs: [
        { content: 'Me siento muy mal y no veo salida en este momento difícil' },
        { content: 'Sigo pensando que todo está perdido y no aguanto más' },
      ],
      allMsgs: [
        {
          role: 'user',
          content: 'test',
          metadata: { crisis: { riskLevel: 'HIGH' } },
        },
      ],
      language: 'es',
      fallbackHeadline: 'Titular base',
    });
    expect(out).toBeNull();
    expect(mockCreateChatCompletionResilient).not.toHaveBeenCalled();
  });

  it('rechaza titular idéntico al fallback o demasiado corto', async () => {
    mockCreateChatCompletionResilient.mockResolvedValue({
      choices: [{ message: { content: '{"headline":"Titular base"}' } }],
    });
    const duplicate = await generateSessionInsightHeadline({
      userMsgs: [
        { content: 'Me siento muy ansioso por el trabajo y no puedo parar de pensar' },
        { content: 'Siempre pienso que va a salir mal en las reuniones' },
      ],
      allMsgs: [
        { role: 'user', content: 'Me siento muy ansioso por el trabajo y no puedo parar de pensar' },
        { role: 'user', content: 'Siempre pienso que va a salir mal en las reuniones' },
      ],
      language: 'es',
      fallbackHeadline: 'Titular base',
      dominantEmotion: 'ansiedad',
    });
    expect(duplicate).toBeNull();

    mockCreateChatCompletionResilient.mockResolvedValue({
      choices: [{ message: { content: '{"headline":"«Hoy nombraste lo que te pesa en el trabajo»"}' } }],
    });
    const stripped = await generateSessionInsightHeadline({
      userMsgs: [
        { content: 'Me siento muy ansioso por el trabajo y no puedo parar de pensar' },
        { content: 'Siempre pienso que va a salir mal en las reuniones' },
      ],
      allMsgs: [
        { role: 'user', content: 'Me siento muy ansioso por el trabajo y no puedo parar de pensar' },
        { role: 'user', content: 'Siempre pienso que va a salir mal en las reuniones' },
      ],
      language: 'es',
      fallbackHeadline: 'Otro titular',
      dominantEmotion: 'ansiedad',
    });
    expect(stripped).toBe('Hoy nombraste lo que te pesa en el trabajo');
  });
});
