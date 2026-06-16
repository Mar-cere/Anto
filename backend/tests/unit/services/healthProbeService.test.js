/**
 * Tests unitarios para healthProbeService (#25 / Bloque C).
 */
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockGetHealthStatus = jest.fn(() => ({
  configured: false,
  connected: null,
  mode: 'memory_only',
}));

await jest.unstable_mockModule('../../../services/cacheService.js', () => ({
  __esModule: true,
  default: { getHealthStatus: mockGetHealthStatus },
}));

await jest.unstable_mockModule('../../../services/topicFreeEmbeddingService.js', () => ({
  __esModule: true,
  isTopicFreeEmbeddingsEnabled: () => true,
}));

await jest.unstable_mockModule('../../../services/topicFreeVectorSearchService.js', () => ({
  __esModule: true,
  isAtlasVectorSearchEnabled: () => true,
  getVectorSearchMode: () => 'atlas',
  getAtlasVectorIndexName: () => 'topic_free_embedding_index',
}));

const {
  buildPublicHealthSnapshot,
  buildDetailedHealthSnapshot,
  getHealthHttpStatus,
} = await import('../../../services/healthProbeService.js');

describe('healthProbeService', () => {
  const savedOpenAi = process.env.OPENAI_API_KEY;
  let readyStateDescriptor;

  beforeEach(() => {
    readyStateDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true,
    });
  });

  afterEach(() => {
    if (readyStateDescriptor) {
      Object.defineProperty(mongoose.connection, 'readyState', readyStateDescriptor);
    }
    if (savedOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = savedOpenAi;
  });

  it('marca degraded si falta OpenAI con Mongo conectado', () => {
    delete process.env.OPENAI_API_KEY;
    const snap = buildPublicHealthSnapshot({ version: '1.4.6' });
    expect(snap.version).toBe('1.4.6');
    expect(snap.dependencies.openai.configured).toBe(false);
    expect(snap.status).toBe('degraded');
    expect(getHealthHttpStatus(snap)).toBe(200);
  });

  it('incluye atlas y workers sin secretos', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const snap = buildPublicHealthSnapshot();
    expect(snap.dependencies.atlas.vectorSearchEnabled).toBe(true);
    expect(snap.workers.weeklyPatternInsight).toBeDefined();
    expect(snap).not.toHaveProperty('OPENAI_API_KEY');
  });

  it('detailed agrega memoria y services', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const snap = buildDetailedHealthSnapshot();
    expect(snap.memory).toHaveProperty('used');
    expect(snap.services.openai).toBe(true);
  });
});
