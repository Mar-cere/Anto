import { jest } from '@jest/globals';

const mockAggregate = jest.fn();
const mockFind = jest.fn();

jest.unstable_mockModule('../../../models/ChatInterventionEvent.js', () => ({
  default: {
    aggregate: mockAggregate,
    find: mockFind,
  },
}));

jest.unstable_mockModule('../../../services/topicFreeEmbeddingService.js', () => ({
  isTopicFreeEmbeddingsEnabled: jest.fn(() => true),
}));

const {
  buildAtlasVectorSearchPipeline,
  getAtlasTopicFreeVectorIndexDefinition,
  getVectorSearchMode,
  isAtlasVectorSearchEnabled,
  findSimilarTopicFreeEvents,
} = await import('../../../services/topicFreeVectorSearchService.js');

describe('topicFreeVectorSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ATLAS_VECTOR_SEARCH_ENABLED;
    delete process.env.TOPIC_FREE_EMBEDDINGS_ENABLED;
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('isAtlasVectorSearchEnabled requiere flag explícito', () => {
    expect(isAtlasVectorSearchEnabled()).toBe(false);
    process.env.ATLAS_VECTOR_SEARCH_ENABLED = 'true';
    expect(isAtlasVectorSearchEnabled()).toBe(true);
  });

  it('getVectorSearchMode devuelve scan sin Atlas', () => {
    expect(getVectorSearchMode()).toBe('scan');
    process.env.ATLAS_VECTOR_SEARCH_ENABLED = 'true';
    expect(getVectorSearchMode()).toBe('atlas');
  });

  it('buildAtlasVectorSearchPipeline incluye filter userId', () => {
    const userId = '507f1f77bcf86cd799439011';
    const pipeline = buildAtlasVectorSearchPipeline({
      userId,
      queryVector: [0.1, 0.2],
      since: new Date('2025-01-01'),
      limit: 10,
    });
    expect(pipeline[0].$vectorSearch.path).toBe('topicFreeEmbedding');
    expect(pipeline[0].$vectorSearch.filter.userId).toBeDefined();
    expect(pipeline[0].$vectorSearch.filter.createdAt.$gte).toBeInstanceOf(Date);
  });

  it('getAtlasTopicFreeVectorIndexDefinition incluye campos vector y filter', () => {
    const def = getAtlasTopicFreeVectorIndexDefinition();
    expect(def.type).toBe('vectorSearch');
    expect(def.definition.fields.some((f) => f.path === 'topicFreeEmbedding')).toBe(true);
  });

  it('findSimilarTopicFreeEvents usa scan cuando Atlas desactivado', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          interventionId: 'breathing_exercise',
          topicFree: 'Me siento ansioso',
          eventType: 'completed',
          topicFreeEmbedding: [1, 0],
        },
      ]),
    };
    mockFind.mockReturnValue(chain);

    const hits = await findSimilarTopicFreeEvents({
      userId: '507f1f77bcf86cd799439011',
      queryVector: [0.99, 0.01],
      since: new Date('2025-01-01'),
      limit: 5,
    });

    expect(mockFind).toHaveBeenCalled();
    expect(hits).toHaveLength(1);
    expect(hits[0].interventionId).toBe('breathing_exercise');
  });

  it('findSimilarTopicFreeEvents usa Atlas cuando está activo', async () => {
    process.env.ATLAS_VECTOR_SEARCH_ENABLED = 'true';
    mockAggregate.mockResolvedValue([
      {
        interventionId: 'grounding',
        topicFree: 'No puedo concentrarme',
        eventType: 'clicked',
        score: 0.9,
      },
    ]);

    const hits = await findSimilarTopicFreeEvents({
      userId: '507f1f77bcf86cd799439011',
      queryVector: [0.5, 0.5],
      limit: 5,
    });

    expect(mockAggregate).toHaveBeenCalled();
    expect(hits[0].interventionId).toBe('grounding');
  });
});
