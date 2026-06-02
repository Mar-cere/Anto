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
    expect(docs[0].meta.tags).toEqual(['ansiedad']);
  });
});
