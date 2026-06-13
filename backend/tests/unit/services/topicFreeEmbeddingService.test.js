import { jest } from '@jest/globals';

const mockEmbeddingsCreate = jest.fn();

await jest.unstable_mockModule('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    embeddings: { create: mockEmbeddingsCreate },
  })),
}));

const {
  clearTopicFreeEmbeddingCache,
  embedTopicFreeText,
  enrichTopicFreeEventsWithEmbeddings,
  getTopicFreeEmbeddingMinSimilarity,
  isTopicFreeEmbeddingsEnabled,
  persistTopicFreeEmbeddingsForDocs,
} = await import('../../../services/topicFreeEmbeddingService.js');

describe('topicFreeEmbeddingService', () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    clearTopicFreeEmbeddingCache();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.TOPIC_FREE_EMBEDDINGS_ENABLED = 'true';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = prevEnv;
  });

  it('isTopicFreeEmbeddingsEnabled respeta opt-out y activa en prod/Render', () => {
    process.env.TOPIC_FREE_EMBEDDINGS_ENABLED = 'false';
    expect(isTopicFreeEmbeddingsEnabled()).toBe(false);

    delete process.env.TOPIC_FREE_EMBEDDINGS_ENABLED;
    process.env.NODE_ENV = 'test';
    process.env.RENDER = undefined;
    expect(isTopicFreeEmbeddingsEnabled()).toBe(false);

    process.env.NODE_ENV = 'production';
    expect(isTopicFreeEmbeddingsEnabled()).toBe(true);

    process.env.NODE_ENV = 'test';
    process.env.RENDER = 'true';
    expect(isTopicFreeEmbeddingsEnabled()).toBe(true);

    process.env.RENDER = undefined;
    process.env.TOPIC_FREE_EMBEDDINGS_ENABLED = 'true';
    expect(isTopicFreeEmbeddingsEnabled()).toBe(true);
  });

  it('getTopicFreeEmbeddingMinSimilarity usa default con valor inválido', () => {
    process.env.TOPIC_FREE_EMBEDDING_MIN_SIMILARITY = 'not-a-number';
    expect(getTopicFreeEmbeddingMinSimilarity()).toBe(0.68);
  });

  it('embedTopicFreeText llama OpenAI y cachea', async () => {
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.2, 0.8, 0.1] }],
    });

    const first = await embedTopicFreeText('No tengo ganas de levantarme por la mañana');
    const second = await embedTopicFreeText('No tengo ganas de levantarme por la mañana');

    expect(first).toEqual([0.2, 0.8, 0.1]);
    expect(second).toEqual(first);
    expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1);
  });

  it('embedTopicFreeText devuelve null sin texto', async () => {
    expect(await embedTopicFreeText('')).toBeNull();
    expect(mockEmbeddingsCreate).not.toHaveBeenCalled();
  });

  it('enrichTopicFreeEventsWithEmbeddings rellena vectores faltantes', async () => {
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.5, 0.5] }],
    });
    const events = [
      { interventionId: 'ba', topicFree: 'Sin ganas de levantarme por la mañana' },
      {
        interventionId: 'breathing',
        topicFree: 'Ya tiene vector',
        topicFreeEmbedding: [1, 0],
      },
    ];
    const enriched = await enrichTopicFreeEventsWithEmbeddings(events);
    expect(enriched[0].topicFreeEmbedding).toEqual([0.5, 0.5]);
    expect(enriched[1].topicFreeEmbedding).toEqual([1, 0]);
  });

  it('persistTopicFreeEmbeddingsForDocs actualiza por texto único', async () => {
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.3, 0.7] }],
    });
    const updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });
    await persistTopicFreeEmbeddingsForDocs(
      [
        { _id: 'a', topicFree: 'Mismo texto de prueba largo' },
        { _id: 'b', topicFree: 'Mismo texto de prueba largo' },
      ],
      { updateModel: { updateMany } },
    );
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany.mock.calls[0][1]).toEqual({
      $set: { topicFreeEmbedding: [0.3, 0.7] },
    });
  });
});
