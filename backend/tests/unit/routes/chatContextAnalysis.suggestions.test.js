/**
 * Tests — cap de sugerencias por sesión (#127)
 */
import { jest } from '@jest/globals';

const mockHasShown = jest.fn();

await jest.unstable_mockModule('../../../services/chatInterventionGraphService.js', () => ({
  __esModule: true,
  default: {
    hasShownSuggestionsInActiveSession: mockHasShown,
  },
}));

const {
  shouldShowChatActionSuggestions,
  isActionSuggestionException,
} = await import('../../../routes/chat/chatContextAnalysis.js');

const baseHistory = [
  { role: 'user', content: 'hola' },
  { role: 'user', content: 'sigo mal' },
  { role: 'user', content: 'otro mensaje' },
];

describe('shouldShowChatActionSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasShown.mockResolvedValue(false);
  });

  it('no muestra si el usuario rechaza ayuda', async () => {
    const history = [{ role: 'user', content: 'no quiero ayuda' }];
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 5, mainEmotion: 'ansiedad' },
      contextualAnalysis: {},
      conversationHistory: history,
      userId: 'u1',
      conversationId: 'c1',
    });
    expect(result).toBe(false);
    expect(mockHasShown).not.toHaveBeenCalled();
  });

  it('muestra en excepción de seguridad aunque ya hubo shown en la sesión', async () => {
    mockHasShown.mockResolvedValue(true);
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 8, mainEmotion: 'ansiedad' },
      contextualAnalysis: { intencion: { tipo: 'CRISIS' } },
      conversationHistory: baseHistory,
      userId: 'u1',
      conversationId: 'c1',
    });
    expect(result).toBe(true);
    expect(mockHasShown).not.toHaveBeenCalled();
  });

  it('no muestra de nuevo solo por intensidad alta si ya hubo shown', async () => {
    mockHasShown.mockResolvedValue(true);
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 9, mainEmotion: 'ansiedad' },
      contextualAnalysis: {},
      conversationHistory: baseHistory,
      userId: 'u1',
      conversationId: 'c1',
    });
    expect(result).toBe(false);
    expect(mockHasShown).toHaveBeenCalled();
  });

  it('no muestra si ya hubo sugerencias en la sesión activa', async () => {
    mockHasShown.mockResolvedValue(true);
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 5, mainEmotion: 'ansiedad' },
      contextualAnalysis: {},
      conversationHistory: baseHistory,
      userId: 'u1',
      conversationId: 'c1',
    });
    expect(result).toBe(false);
    expect(mockHasShown).toHaveBeenCalled();
  });

  it('muestra en cadencia si no hubo shown en sesión', async () => {
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 5, mainEmotion: 'ansiedad' },
      contextualAnalysis: {},
      conversationHistory: baseHistory,
      userId: 'u1',
      conversationId: 'c1',
    });
    expect(result).toBe(true);
  });

  it('muestra en 1.er turno con señal TCC (evitación) aunque intensidad sea 6 (#87)', async () => {
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 6, mainEmotion: 'miedo' },
      contextualAnalysis: {},
      conversationHistory: [{ role: 'assistant', content: 'Hola' }],
      userId: 'u1',
      conversationId: 'c1',
      userContent:
        'Tengo ansiedad social, 6/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.',
    });
    expect(result).toBe(true);
    expect(mockHasShown).toHaveBeenCalled();
  });

  it('muestra en 1.er turno con señal TCC (apatía) aunque intensidad sea 6 (#88)', async () => {
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 6, mainEmotion: 'tristeza' },
      contextualAnalysis: {},
      conversationHistory: [{ role: 'assistant', content: 'Hi' }],
      userId: 'u1',
      conversationId: 'c1',
      userContent:
        'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.',
    });
    expect(result).toBe(true);
    expect(mockHasShown).toHaveBeenCalled();
  });

  it('muestra en 1.er turno con distorsión sin señal ABC explícita (#89 dispositivo)', async () => {
    const userContent =
      'Me siento ansioso, 6/10. Sé que van a pensar mal de mí y nunca va a salir bien';
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 6, mainEmotion: 'neutral' },
      contextualAnalysis: {},
      conversationHistory: [{ role: 'assistant', content: '¡Hola! ¿Cómo va tu día?' }],
      userId: 'u1',
      conversationId: 'c1',
      userContent,
    });
    expect(result).toBe(true);
  });
});

describe('isActionSuggestionSafetyException', () => {
  it('detecta crisis', async () => {
    const { isActionSuggestionSafetyException } = await import(
      '../../../routes/chat/chatContextAnalysis.js'
    );
    expect(
      isActionSuggestionSafetyException(
        { intensity: 4 },
        { intencion: { tipo: 'CRISIS' } },
        [],
      ),
    ).toBe(true);
  });
});
