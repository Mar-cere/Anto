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

  it('muestra en excepción aunque ya hubo shown en la sesión', async () => {
    mockHasShown.mockResolvedValue(true);
    const result = await shouldShowChatActionSuggestions({
      emotionalAnalysis: { intensity: 8, mainEmotion: 'ansiedad' },
      contextualAnalysis: {},
      conversationHistory: baseHistory,
      userId: 'u1',
      conversationId: 'c1',
    });
    expect(result).toBe(true);
    expect(mockHasShown).not.toHaveBeenCalled();
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
});

describe('isActionSuggestionException', () => {
  it('detecta crisis', () => {
    expect(
      isActionSuggestionException(
        { intensity: 4 },
        { intencion: { tipo: 'CRISIS' } },
        [],
      ),
    ).toBe(true);
  });
});
