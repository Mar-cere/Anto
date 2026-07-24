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

  it('expone userChars en insight elegible', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Texto suficientemente largo para contar caracteres en la sesión activa',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 6, topic: 'trabajo' } },
          },
          createdAt: new Date(now - 60000),
        },
        {
          role: 'assistant',
          content: 'Te escucho',
          metadata: {},
          createdAt: new Date(now - 30000),
        },
        {
          role: 'user',
          content: 'Sigo con más detalle sobre lo que me pasa en el trabajo esta semana',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 5, topic: 'trabajo' } },
          },
          createdAt: new Date(now),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.userChars).toBeGreaterThan(40);
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
    expect(Array.isArray(insight.suggestedCommitments)).toBe(true);
    expect(insight.suggestedCommitments.length).toBeGreaterThanOrEqual(1);
    expect(insight.suggestedCommitments[0]).toMatch(/paso pequeño|small step/i);
  });

  it('expone tccLiteResume cuando hay patrón cognitivo', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Siempre todo sale mal y nunca puedo',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 6, topic: 'general' } },
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
                  type: 'all_or_nothing',
                  name: 'Pensamiento Todo-o-Nada (Polarizado)',
                  description: 'Ver las cosas en categorías absolutas',
                  intervention: 'Explorar matices',
                  confidence: 0.8,
                },
              },
            },
          },
          createdAt: new Date(now - 30000),
        },
        {
          role: 'user',
          content: 'Es que nunca tengo tiempo para mis hijos',
          metadata: {
            context: { emotional: { mainEmotion: 'tristeza', intensity: 6, topic: 'vida_diaria' } },
          },
          createdAt: new Date(now),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.tccLiteResume?.eligible).toBe(true);
    expect(insight.tccLiteResume?.distortionType).toBe('all_or_nothing');
  });

  it('calcula duración solo de la sesión activa, no del hilo completo', async () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Mensaje antiguo del hilo que ya no cuenta para esta visita',
          metadata: {
            context: { emotional: { mainEmotion: 'tristeza', intensity: 5, topic: 'general' } },
          },
          createdAt: new Date(twoDaysAgo),
        },
        {
          role: 'assistant',
          content: 'Respuesta antigua',
          metadata: {},
          createdAt: new Date(twoDaysAgo + 60000),
        },
        {
          role: 'user',
          content: 'Hoy el trabajo me agobia y llego cansado a casa',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 5, topic: 'vida_diaria' } },
          },
          createdAt: new Date(now - 8 * 60000),
        },
        {
          role: 'assistant',
          content: 'Te escucho',
          metadata: {},
          createdAt: new Date(now - 7 * 60000),
        },
        {
          role: 'user',
          content: 'No puedo ver a mis hijos con la energía que me queda',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 6, topic: 'vida_diaria' } },
          },
          createdAt: new Date(now - 2 * 60000),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.durationMinutes).toBeGreaterThanOrEqual(5);
    expect(insight.durationMinutes).toBeLessThanOrEqual(15);
    expect(insight.userTurns).toBe(2);
  });

  it('prioriza crisis y emoción del asistente en sesiones de riesgo', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Estuve nervioso en la entrevista',
          metadata: { crisis: { riskLevel: 'LOW' } },
          createdAt: new Date(now - 300000),
        },
        {
          role: 'assistant',
          content: 'Te escucho',
          metadata: {
            context: { emotional: { mainEmotion: 'ansiedad', intensity: 5, topic: 'trabajo' } },
          },
          createdAt: new Date(now - 280000),
        },
        {
          role: 'user',
          content: 'Quiero morir y no aguanto más',
          metadata: { crisis: { riskLevel: 'HIGH' } },
          createdAt: new Date(now - 120000),
        },
        {
          role: 'assistant',
          content: 'Gracias por decírmelo. Tu seguridad es lo primero.',
          metadata: {
            context: { emotional: { mainEmotion: 'miedo', intensity: 9, topic: 'salud' } },
            crisis: { riskLevel: 'HIGH' },
          },
          createdAt: new Date(now - 100000),
        },
        {
          role: 'user',
          content: 'Estoy solo',
          metadata: { crisis: { riskLevel: 'HIGH' } },
          createdAt: new Date(now - 60000),
        },
        {
          role: 'assistant',
          content: 'Lo más importante ahora es tu seguridad',
          metadata: {
            context: { emotional: { mainEmotion: 'miedo', intensity: 9, topic: 'salud' } },
            crisis: { riskLevel: 'HIGH' },
          },
          createdAt: new Date(now - 30000),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.crisisTier).toBe('high');
    expect(insight.headlineSource).toBe('crisis_rules');
    expect(insight.headline).toMatch(/seguridad/i);
    expect(insight.dominantEmotion.key).not.toBe('neutral');
    expect(insight.dominantEmotion.intensity).toBeGreaterThanOrEqual(7);
    expect(insight.suggestedStep).toBeNull();
    expect(insight.thoughtPattern).toBeNull();
    expect(insight.tccLiteResume).toBeNull();
    expect(insight.themes.some((t) => /salud|seguridad/i.test(t))).toBe(true);
    expect(mockGenerateHeadline).not.toHaveBeenCalled();
  });

  it('detecta crisis WARNING desde metadata del asistente', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'A veces me dan ganas de morir y no sé qué hacer',
          metadata: {},
          createdAt: new Date(now - 120000),
        },
        {
          role: 'assistant',
          content: 'Gracias por compartirlo',
          metadata: {
            crisis: { riskLevel: 'WARNING' },
            context: { emotional: { mainEmotion: 'tristeza', intensity: 7, topic: 'salud' } },
          },
          createdAt: new Date(now - 100000),
        },
        {
          role: 'user',
          content: 'Sigo pensando en eso todo el día',
          metadata: {},
          createdAt: new Date(now - 60000),
        },
        {
          role: 'assistant',
          content: 'Estoy aquí contigo',
          metadata: {
            context: { emotional: { mainEmotion: 'tristeza', intensity: 7, topic: 'salud' } },
          },
          createdAt: new Date(now - 30000),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.crisisTier).toBe('warning');
    expect(insight.headlineSource).toBe('crisis_rules');
    expect(insight.dominantEmotion.intensity).toBeGreaterThanOrEqual(6);
    expect(insight.thoughtPattern).toBeNull();
    expect(mockGenerateHeadline).not.toHaveBeenCalled();
  });

  it('usa insight de recuperación cuando hubo crisis y el cierre es tranquilo', async () => {
    const { buildCrisisRecoverySessionMessages } = await import(
      '../../fixtures/crisisRecoverySessionInsightMessages.js'
    );
    const now = Date.now();
    mockMessageFind.mockReturnValue(chainLean(buildCrisisRecoverySessionMessages(now)));

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.crisisTier).toBeNull();
    expect(insight.sessionPhase).toBe('crisis_recovered');
    expect(insight.headlineSource).toBe('crisis_recovered_rules');
    expect(insight.headline).toMatch(/tranquilo|calma/i);
    expect(insight.suggestedStep).toBeNull();
    expect(mockGenerateHeadline).not.toHaveBeenCalled();
  });

  it('no marca Calma mixta tras crisis de pánico verbalizada con cierre calmado', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Hoy no me siento bien, tuve una crisis de pánico en la mañana',
          metadata: {
            crisis: { riskLevel: 'LOW' },
            context: { emotional: { mainEmotion: 'neutral', intensity: 4, topic: 'salud' } },
          },
          createdAt: new Date(now - 200000),
        },
        {
          role: 'assistant',
          content: 'Entiendo que fue muy intenso',
          metadata: {
            context: { emotional: { mainEmotion: 'neutral', intensity: 4, topic: 'salud' } },
            crisis: { riskLevel: 'LOW' },
          },
          createdAt: new Date(now - 180000),
        },
        {
          role: 'user',
          content: 'Si he descansado un poco pero no quita el susto',
          metadata: {
            crisis: { riskLevel: 'LOW' },
            context: { emotional: { mainEmotion: 'miedo', intensity: 5, topic: 'general' } },
          },
          createdAt: new Date(now - 100000),
        },
        {
          role: 'assistant',
          content: 'Te acompaño en eso',
          metadata: {
            context: { emotional: { mainEmotion: 'neutral', intensity: 4, topic: 'general' } },
          },
          createdAt: new Date(now - 80000),
        },
        {
          role: 'user',
          content: 'No lo se',
          metadata: {
            crisis: { riskLevel: 'LOW' },
            context: { emotional: { mainEmotion: 'neutral', intensity: 3, topic: 'general' } },
          },
          createdAt: new Date(now - 40000),
        },
        {
          role: 'assistant',
          content: 'Está bien no saberlo ahora',
          metadata: {
            context: { emotional: { mainEmotion: 'neutral', intensity: 3, topic: 'general' } },
          },
          createdAt: new Date(now - 20000),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.dominantEmotion.key).not.toBe('neutral');
    expect(['ansiedad', 'miedo']).toContain(insight.dominantEmotion.key);
    expect(insight.dominantEmotion.intensity).toBeGreaterThanOrEqual(6);
  });

  it('no marca Calma mixta ni Soledad tras charla de estrés y sueño', async () => {
    const now = Date.now();
    mockMessageFind.mockReturnValue(
      chainLean([
        {
          role: 'user',
          content: 'Relativamente bien, solo que he tenido problemas para dormir',
          metadata: {
            crisis: { riskLevel: 'LOW' },
            context: { emotional: { mainEmotion: 'neutral', intensity: 4, topic: 'soledad' } },
          },
          createdAt: new Date(now - 200000),
        },
        {
          role: 'assistant',
          content: '¿Te cuesta conciliar el sueño?',
          metadata: { context: { emotional: { mainEmotion: 'neutral', intensity: 4, topic: 'soledad' } } },
          createdAt: new Date(now - 180000),
        },
        {
          role: 'user',
          content: 'Me cuesta dormirme, luego me cuesta despertar porque siento que no descanse',
          metadata: {
            crisis: { riskLevel: 'LOW' },
            context: { emotional: { mainEmotion: 'neutral', intensity: 5, topic: 'soledad' } },
          },
          createdAt: new Date(now - 100000),
        },
        {
          role: 'assistant',
          content: '¿Desde hace cuánto?',
          metadata: { context: { emotional: { mainEmotion: 'neutral', intensity: 4 } } },
          createdAt: new Date(now - 80000),
        },
        {
          role: 'user',
          content: 'Estrés y falta de rutina o horario',
          metadata: {
            crisis: { riskLevel: 'LOW' },
            context: { emotional: { mainEmotion: 'neutral', intensity: 5, topic: 'general' } },
          },
          createdAt: new Date(now - 40000),
        },
        {
          role: 'assistant',
          content: 'Tiene sentido',
          metadata: { context: { emotional: { mainEmotion: 'neutral', intensity: 3 } } },
          createdAt: new Date(now - 20000),
        },
      ]),
    );

    const insight = await buildSessionInsight({ userId, conversationId, language: 'es' });
    expect(insight.eligible).toBe(true);
    expect(insight.dominantEmotion.key).not.toBe('neutral');
    expect(insight.themes.join(' ')).toMatch(/Sueño|Salud|Vida diaria/i);
    expect(insight.themes.join(' ')).not.toMatch(/Soledad/i);
  });
});

