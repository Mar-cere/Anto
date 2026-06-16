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
  resolveOverallStatus,
} = await import('../../../services/healthProbeService.js');

describe('healthProbeService', () => {
  const savedOpenAi = process.env.OPENAI_API_KEY;
  const savedSentry = process.env.SENTRY_DSN;
  let readyStateDescriptor;

  beforeEach(() => {
    readyStateDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true,
    });
    mockGetHealthStatus.mockReturnValue({
      configured: false,
      connected: null,
      mode: 'memory_only',
    });
  });

  afterEach(() => {
    if (readyStateDescriptor) {
      Object.defineProperty(mongoose.connection, 'readyState', readyStateDescriptor);
    }
    if (savedOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = savedOpenAi;
    if (savedSentry === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = savedSentry;
  });

  it('marca degraded si falta OpenAI con Mongo conectado', () => {
    delete process.env.OPENAI_API_KEY;
    const snap = buildPublicHealthSnapshot({ version: '1.4.6' });
    expect(snap.version).toBe('1.4.6');
    expect(snap.dependencies.openai.configured).toBe(false);
    expect(snap.status).toBe('degraded');
    expect(getHealthHttpStatus(snap)).toBe(200);
  });

  it('marca unavailable si Mongo no está conectado', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });
    const snap = buildPublicHealthSnapshot();
    expect(snap.status).toBe('unavailable');
    expect(getHealthHttpStatus(snap)).toBe(503);
  });

  it('health público no expone workers ni indexName', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const snap = buildPublicHealthSnapshot();
    expect(snap).not.toHaveProperty('workers');
    expect(snap.dependencies.atlas).not.toHaveProperty('indexName');
    expect(snap.observability).toHaveProperty('sentryConfigured');
  });

  it('health detallado incluye workers e indexName', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const snap = buildDetailedHealthSnapshot();
    expect(snap.workers.weeklyPatternInsight).toBeDefined();
    expect(snap.dependencies.atlas.indexName).toBe('topic_free_embedding_index');
    expect(snap.memory).toHaveProperty('used');
  });

  it('degraded si Redis configurado pero no conectado', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockGetHealthStatus.mockReturnValue({
      configured: true,
      connected: false,
      mode: 'memory_fallback',
    });
    const status = resolveOverallStatus({
      database: 'connected',
      openai: { configured: true },
      redis: { configured: true, connected: false },
    });
    expect(status).toBe('degraded');
  });

  it('no filtra secretos en JSON serializado', () => {
    process.env.OPENAI_API_KEY = 'sk-super-secret-key';
    process.env.SENTRY_DSN = 'https://abc@o123.ingest.sentry.io/1';
    const json = JSON.stringify(buildPublicHealthSnapshot());
    expect(json).not.toContain('sk-super-secret');
    expect(json).not.toContain('ingest.sentry.io');
    expect(json).toContain('"sentryConfigured":true');
  });
});
