/**
 * Tests unitarios — grafo tema–intervención (#127)
 */
import { jest } from '@jest/globals';

const mockFindOne = jest.fn();
const mockInsertMany = jest.fn().mockResolvedValue([]);
const mockCreate = jest.fn().mockResolvedValue({});

await jest.unstable_mockModule('../../../models/ChatInterventionEvent.js', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
    insertMany: mockInsertMany,
    create: mockCreate,
  },
}));

const { default: chatInterventionGraphService } = await import(
  '../../../services/chatInterventionGraphService.js'
);

function chainFindOne(result) {
  return {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
}

describe('buildSessionAggregatedGraphPipeline', () => {
  it('agrupa primero por sesión y luego por tema–intervención', () => {
    const pipeline = chatInterventionGraphService.buildSessionAggregatedGraphPipeline({
      userId: 'user-1',
      since: new Date('2026-01-01'),
      limit: 10,
    });
    expect(pipeline).toHaveLength(6);
    expect(pipeline[1].$group._id).toMatchObject({
      sessionId: '$sessionId',
      topicTag: '$topicTag',
      interventionId: '$interventionId',
    });
    expect(pipeline[1].$group.shown).toEqual({ $max: expect.any(Object) });
    expect(pipeline[2].$group._id).toMatchObject({
      topicTag: '$_id.topicTag',
      interventionId: '$_id.interventionId',
    });
    expect(pipeline[2].$group.shown).toEqual({ $sum: '$shown' });
  });
});

describe('chatInterventionGraphService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recordInterventionEvent hereda sessionId y topicTag del último shown', async () => {
    mockFindOne
      .mockReturnValueOnce(
        chainFindOne({
          sessionId: 'sess-inherited',
          topicTag: 'trabajo',
          topicFree: 'Me siento ansioso por la reunión con mi jefe',
          topicFreeEmbedding: [0.1, 0.9, 0.2],
          riskLevel: 'low',
          assistantMessageId: 'msg-1',
        }),
      )
      .mockReturnValueOnce(chainFindOne(null));

    await chatInterventionGraphService.recordInterventionEvent({
      userId: 'user-1',
      conversationId: 'conv-1',
      interventionId: 'breathing_exercise',
      eventType: 'completed',
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const doc = mockCreate.mock.calls[0][0];
    expect(doc.sessionId).toBe('sess-inherited');
    expect(doc.topicTag).toBe('trabajo');
    expect(doc.topicFree).toBe('Me siento ansioso por la reunión con mi jefe');
    expect(doc.topicFreeEmbedding).toEqual([0.1, 0.9, 0.2]);
    expect(doc.assistantMessageId).toBe('msg-1');
    expect(doc.riskLevel).toBe('low');
  });

  it('recordInterventionEvent no crea duplicado en ventana de dedupe', async () => {
    mockFindOne
      .mockReturnValueOnce(
        chainFindOne({
          sessionId: 'sess-1',
          topicTag: 'general',
          riskLevel: null,
          assistantMessageId: null,
        }),
      )
      .mockReturnValueOnce(chainFindOne({ _id: 'existing-dup' }));

    await chatInterventionGraphService.recordInterventionEvent({
      userId: 'user-1',
      conversationId: 'conv-1',
      interventionId: 'breathing_exercise',
      eventType: 'clicked',
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('recordInterventionEvent ignora interventionId inválido', async () => {
    await chatInterventionGraphService.recordInterventionEvent({
      userId: 'user-1',
      conversationId: 'conv-1',
      interventionId: 'INVALID ID!',
      eventType: 'completed',
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('recordInterventionEvent ignora si falta userId o conversationId', async () => {
    await chatInterventionGraphService.recordInterventionEvent({
      userId: null,
      conversationId: 'conv-1',
      interventionId: 'breathing_exercise',
      eventType: 'clicked',
    });
    await chatInterventionGraphService.recordInterventionEvent({
      userId: 'user-1',
      conversationId: null,
      interventionId: 'breathing_exercise',
      eventType: 'clicked',
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('recordSuggestionEventsShown omite sugerencias con id inválido', async () => {
    mockFindOne.mockReturnValueOnce(
      chainFindOne({ sessionId: 'sess-old', createdAt: new Date() }),
    );
    await chatInterventionGraphService.recordSuggestionEventsShown({
      userId: 'user-1',
      conversationId: 'conv-1',
      suggestions: [{ id: 'not valid!', label: 'X' }],
      emotionalAnalysis: { topic: 'general' },
    });
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  it('hasShownSuggestionsInActiveSession detecta shown reciente en la conversación', async () => {
    mockFindOne.mockReturnValueOnce(chainFindOne({ _id: 'evt-1' }));

    const shown = await chatInterventionGraphService.hasShownSuggestionsInActiveSession({
      userId: 'user-1',
      conversationId: 'conv-1',
    });

    expect(shown).toBe(true);
    const query = mockFindOne.mock.calls[0][0];
    expect(query.eventType).toBe('shown');
    expect(query.createdAt?.$gte).toBeInstanceOf(Date);
  });

  it('recordSuggestionEventsShown inserta eventos shown con tags del catálogo', async () => {
    mockFindOne.mockReturnValueOnce(
      chainFindOne({ sessionId: 'sess-old', createdAt: new Date() }),
    );

    await chatInterventionGraphService.recordSuggestionEventsShown({
      userId: 'user-1',
      conversationId: 'conv-1',
      suggestions: [
        {
          id: 'psychoeducation_anxiety',
          label: 'Ansiedad',
          interventionType: 'psychoeducation',
          tags: ['ansiedad'],
          screen: 'PsychoeducationModule',
        },
      ],
      emotionalAnalysis: { topic: 'trabajo' },
    });

    expect(mockInsertMany).toHaveBeenCalledTimes(1);
    const docs = mockInsertMany.mock.calls[0][0];
    expect(docs).toHaveLength(1);
    expect(docs[0].eventType).toBe('shown');
    expect(docs[0].topicTag).toBe('trabajo');
    expect(docs[0].topicFree).toBeNull();
    expect(docs[0].meta.tags).toEqual(['ansiedad']);
  });

  it('recordSuggestionEventsShown guarda topicFree desde userContent', async () => {
    mockFindOne.mockReturnValueOnce(
      chainFindOne({ sessionId: 'sess-old', createdAt: new Date() }),
    );

    const userContent =
      'Estoy muy ansioso porque mañana tengo una reunión importante con mi jefe';

    await chatInterventionGraphService.recordSuggestionEventsShown({
      userId: 'user-1',
      conversationId: 'conv-1',
      suggestions: [{ id: 'behavioral_activation', label: 'Activación', interventionType: 'exercise' }],
      emotionalAnalysis: { topic: 'trabajo' },
      userContent,
    });

    const docs = mockInsertMany.mock.calls[0][0];
    expect(docs[0].topicFree).toBe(userContent);
  });

  it('bucle shown → clicked → completed hereda topicFree en cada paso', async () => {
    const topicFree = 'No tengo ganas de nada y me cuesta levantarme cada mañana';

    mockFindOne
      .mockReturnValueOnce(chainFindOne({ sessionId: 'sess-loop', createdAt: new Date() }))
      .mockReturnValueOnce(
        chainFindOne({
          sessionId: 'sess-loop',
          topicTag: 'trabajo',
          topicFree,
          riskLevel: null,
          assistantMessageId: 'msg-loop',
        }),
      )
      .mockReturnValueOnce(chainFindOne(null))
      .mockReturnValueOnce(
        chainFindOne({
          sessionId: 'sess-loop',
          topicTag: 'trabajo',
          topicFree,
          riskLevel: null,
          assistantMessageId: 'msg-loop',
        }),
      )
      .mockReturnValueOnce(chainFindOne(null));

    await chatInterventionGraphService.recordSuggestionEventsShown({
      userId: 'user-1',
      conversationId: 'conv-1',
      assistantMessageId: 'msg-loop',
      suggestions: [{ id: 'behavioral_activation', label: 'BA' }],
      emotionalAnalysis: { topic: 'trabajo' },
      userContent: topicFree,
    });

    await chatInterventionGraphService.recordInterventionEvent({
      userId: 'user-1',
      conversationId: 'conv-1',
      interventionId: 'behavioral_activation',
      eventType: 'clicked',
    });

    await chatInterventionGraphService.recordInterventionEvent({
      userId: 'user-1',
      conversationId: 'conv-1',
      interventionId: 'behavioral_activation',
      eventType: 'completed',
    });

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][0].topicFree).toBe(topicFree);
    expect(mockCreate.mock.calls[0][0].eventType).toBe('clicked');
    expect(mockCreate.mock.calls[1][0].topicFree).toBe(topicFree);
    expect(mockCreate.mock.calls[1][0].eventType).toBe('completed');
  });
});
