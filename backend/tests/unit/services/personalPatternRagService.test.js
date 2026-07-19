import { jest } from '@jest/globals';

const mockEmbed = jest.fn();
const mockFindSimilar = jest.fn();
const mockCreate = jest.fn();
const mockCount = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockHasConsent = jest.fn(async () => true);

await jest.unstable_mockModule('../../../config/features.js', () => ({
  features: { personalPatternRag: true },
}));

await jest.unstable_mockModule('../../../services/topicFreeEmbeddingService.js', () => ({
  embedTopicFreeText: mockEmbed,
  isTopicFreeEmbeddingsEnabled: jest.fn(() => true),
  getTopicFreeEmbeddingMinSimilarity: jest.fn(() => 0.72),
}));

await jest.unstable_mockModule('../../../services/topicFreeVectorSearchService.js', () => ({
  findSimilarMemoryIndexEvents: mockFindSimilar,
}));

await jest.unstable_mockModule('../../../services/experientialPatternService.js', () => ({
  hasExperientialPatternsConsent: mockHasConsent,
}));

await jest.unstable_mockModule('../../../models/ChatInterventionEvent.js', () => ({
  default: {
    create: mockCreate,
    countDocuments: mockCount,
    findOne: mockFindOne,
    find: mockFind,
    deleteMany: jest.fn(),
  },
}));

const {
  isPersonalPatternRagEnabled,
  indexPersonalPatternFromUserMessage,
  buildPersonalPatternRagSnippet,
} = await import('../../../services/personalPatternRagService.js');

describe('personalPatternRagService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasConsent.mockResolvedValue(true);
    mockEmbed.mockResolvedValue([0.1, 0.2, 0.3]);
    mockFindOne.mockReturnValue({
      select: () => ({
        lean: async () => null,
      }),
    });
    mockCreate.mockResolvedValue({ _id: 'evt1' });
    mockCount.mockResolvedValue(10);
    mockFind.mockReturnValue({
      sort: () => ({
        select: () => ({
          limit: () => ({ lean: async () => [] }),
        }),
      }),
    });
  });

  it('isPersonalPatternRagEnabled respeta flag + embeddings', () => {
    expect(isPersonalPatternRagEnabled()).toBe(true);
  });

  it('indexa mensaje válido en LOW', async () => {
    const out = await indexPersonalPatternFromUserMessage({
      userId: '507f1f77bcf86cd799439011',
      conversationId: '507f1f77bcf86cd799439012',
      content: 'hoy la reunión con mi jefe me dejó agotado',
      riskLevel: 'LOW',
    });
    expect(out.indexed).toBe(true);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('no indexa sin consent de Memoria del proceso', async () => {
    mockHasConsent.mockResolvedValue(false);
    const out = await indexPersonalPatternFromUserMessage({
      userId: '507f1f77bcf86cd799439011',
      conversationId: '507f1f77bcf86cd799439012',
      content: 'hoy la reunión con mi jefe me dejó agotado',
      riskLevel: 'LOW',
    });
    expect(out.indexed).toBe(false);
    expect(out.reason).toBe('no_consent');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('no indexa en riesgo bloqueado', async () => {
    const out = await indexPersonalPatternFromUserMessage({
      userId: '507f1f77bcf86cd799439011',
      conversationId: '507f1f77bcf86cd799439012',
      content: 'hoy la reunión con mi jefe me dejó agotado',
      riskLevel: 'HIGH',
    });
    expect(out.indexed).toBe(false);
    expect(out.reason).toBe('risk_blocked');
  });

  it('no indexa contenido sensible aunque el riesgo sea LOW', async () => {
    const out = await indexPersonalPatternFromUserMessage({
      userId: '507f1f77bcf86cd799439011',
      conversationId: '507f1f77bcf86cd799439012',
      content: 'quiero morir y no aguanto más con todo esto',
      riskLevel: 'LOW',
    });
    expect(out.indexed).toBe(false);
    expect(out.reason).toBe('sensitive_content');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('buildPersonalPatternRagSnippet devuelve continuidad si hay hits', async () => {
    mockFindSimilar.mockResolvedValue([
      {
        topicFree: 'reunión difícil con el jefe',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        conversationId: '507f1f77bcf86cd799439099',
        score: 0.9,
      },
    ]);
    const out = await buildPersonalPatternRagSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'otra vez tuve una reunión tensa en el trabajo',
      conversationId: '507f1f77bcf86cd799439012',
      language: 'es',
      riskLevel: 'LOW',
    });
    expect(out).toContain('patrones personales');
    expect(out).not.toContain('#203');
    expect(out).toContain('reunión');
  });

  it('no devuelve snippet en HIGH', async () => {
    mockFindSimilar.mockResolvedValue([
      {
        topicFree: 'reunión difícil',
        createdAt: new Date(),
        conversationId: 'x',
        score: 0.95,
      },
    ]);
    const out = await buildPersonalPatternRagSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'mensaje largo sobre trabajo y ansiedad',
      riskLevel: 'HIGH',
    });
    expect(out).toBeNull();
  });

  it('no devuelve snippet sin consent', async () => {
    mockHasConsent.mockResolvedValue(false);
    mockFindSimilar.mockResolvedValue([
      {
        topicFree: 'reunión difícil con el jefe',
        createdAt: new Date(),
        conversationId: '507f1f77bcf86cd799439099',
        score: 0.9,
      },
    ]);
    const out = await buildPersonalPatternRagSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'otra vez tuve una reunión tensa en el trabajo',
      conversationId: '507f1f77bcf86cd799439012',
      language: 'es',
      riskLevel: 'LOW',
    });
    expect(out).toBeNull();
    expect(mockFindSimilar).not.toHaveBeenCalled();
  });
});
