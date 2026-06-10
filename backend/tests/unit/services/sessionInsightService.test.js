/**
 * Tests — insight de sesión post-chat
 */
import { jest } from '@jest/globals';

const mockConversationFindOne = jest.fn();
const mockMessageFind = jest.fn();
const mockInterventionFindOne = jest.fn();

await jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  __esModule: true,
  default: { findOne: mockConversationFindOne },
}));

await jest.unstable_mockModule('../../../models/Message.js', () => ({
  __esModule: true,
  default: {
    find: mockMessageFind,
  },
}));

await jest.unstable_mockModule('../../../models/ChatInterventionEvent.js', () => ({
  __esModule: true,
  default: { findOne: mockInterventionFindOne },
}));

const mockGenerateHeadline = jest.fn().mockResolvedValue(null);

await jest.unstable_mockModule('../../../services/sessionInsightHeadlineService.js', () => ({
  __esModule: true,
  generateSessionInsightHeadline: mockGenerateHeadline,
  isSessionInsightHeadlineLlmEnabled: jest.fn().mockReturnValue(true),
}));

const { buildSessionInsight } = await import('../../../services/sessionInsightService.js');

const userId = '507f1f77bcf86cd799439011';
const conversationId = '507f1f77bcf86cd799439012';

function chainLean(result) {
  return {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
}

function chainInterventionLean(result) {
  return {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
}

describe('buildSessionInsight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateHeadline.mockResolvedValue(null);
    mockConversationFindOne.mockReturnValue(
      chainLean({ sessionIntention: 'vent' }),
    );
    mockInterventionFindOne.mockReturnValue(chainInterventionLean(null));
  });

  it('no es elegible con pocos mensajes', async () => {
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'hola',
          metadata: {},
          createdAt: new Date(),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(false);
    expect(insight.userTurns).toBe(1);
  });

  it('agrega emoción dominante y patrón cognitivo', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Siempre pienso lo peor y nunca va a salir bien',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 7, topic: 'trabajo' } },
          },
          createdAt: new Date(now - 60000),
        },
        {
          role: 'assistant',
          content: 'Te escucho',
          metadata: {
            context: {
              contextual: {
                primaryDistortion: {
                  type: 'fortune_telling',
                  name: 'Adivinación del Futuro',
                  description: 'Predecir que las cosas saldrán mal',
                  intervention: '¿Qué evidencia hay de que saldrá mal?',
                  confidence: 0.8,
                },
              },
            },
          },
          createdAt: new Date(now - 30000),
        },
        {
          role: 'user',
          content: 'Me da mucha ansiedad en el trabajo',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 6, topic: 'trabajo' } },
          },
          createdAt: new Date(now),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.dominantEmotion.key).toBe('ansiedad');
    expect(insight.thoughtPattern?.type).toBe('fortune_telling');
    expect(insight.themes).toContain('Trabajo');
    expect(insight.headline).toMatch(/patrón/i);
    expect(insight.headlineSource).toBe('rules');
    expect(mockGenerateHeadline).toHaveBeenCalled();
  });

  it('usa titular LLM cuando el servicio lo devuelve', async () => {
    mockGenerateHeadline.mockResolvedValue('Tu ansiedad en el trabajo merece espacio y cuidado');
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Me da mucha ansiedad en el trabajo y no sé cómo manejarlo',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 6, topic: 'trabajo' } },
          },
          createdAt: new Date(now - 60000),
        },
        {
          role: 'user',
          content: 'Siento que nunca voy a poder relajarme del todo',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 6, topic: 'trabajo' } },
          },
          createdAt: new Date(now),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.headline).toBe('Tu ansiedad en el trabajo merece espacio y cuidado');
    expect(insight.headlineSource).toBe('llm');
  });

  it('incluye paso sugerido desde último shown', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Me siento apagado y sin ganas',
          metadata: {
            context: { emotional: { mainEmotion: 'tristeza', intensity: 6, topic: 'general' } },
          },
          createdAt: new Date(now - 60000),
        },
        {
          role: 'user',
          content: 'Llevo días sin salir',
          metadata: {
            context: { emotional: { mainEmotion: 'tristeza', intensity: 6, topic: 'general' } },
          },
          createdAt: new Date(now),
        },
      ]),
    );
    mockInterventionFindOne.mockReturnValue(
      chainInterventionLean({ interventionId: 'behavioral_activation' }),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.suggestedStep?.id).toBe('behavioral_activation');
    expect(insight.suggestedStep?.screen).toBe('BehavioralActivation');
  });
});
