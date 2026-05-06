import { describe, expect, it } from '@jest/globals';
import metricsService from '../../../services/metricsService.js';

describe('metricsService — latencyByRoute (chat_usage)', () => {
  it('agrega samples por routeKey y los expone en healthStats', async () => {
    // Reset mínimo de estructura para este test (evita interferencia entre suites).
    metricsService.inMemoryMetrics.chatUsage.latencyByRoute = {};

    await metricsService.recordMetric(
      'chat_usage',
      { action: 'streaming_first_chunk', isGuest: false, ttftMs: 123 },
      '000000000000000000000001',
      { transport: 'http', endpoint: 'chat', surface: 'registered' }
    );
    await metricsService.recordMetric(
      'chat_usage',
      { action: 'non_stream_response_ready', isGuest: false, latencyMs: 456 },
      '000000000000000000000001',
      { transport: 'http', endpoint: 'chat', surface: 'registered' }
    );

    const health = await metricsService.getHealthStats();
    const byRoute = health?.chatUsage?.latencyByRoute || {};
    expect(byRoute['http:chat:registered']).toBeDefined();
    expect(byRoute['http:chat:registered'].ttft.samples).toBeGreaterThanOrEqual(1);
    expect(byRoute['http:chat:registered'].nonStreaming.samples).toBeGreaterThanOrEqual(1);
  });

  it('aplica cap defensivo de rutas (no crece sin límite)', async () => {
    metricsService.inMemoryMetrics.chatUsage.latencyByRoute = {};

    for (let i = 0; i < 80; i += 1) {
      await metricsService.recordMetric(
        'chat_usage',
        { action: 'non_stream_response_ready', isGuest: false, latencyMs: 10 + i },
        '000000000000000000000001',
        { transport: 'http', endpoint: `chat${i}`, surface: 'registered' }
      );
    }

    const keys = Object.keys(metricsService.inMemoryMetrics.chatUsage.latencyByRoute);
    expect(keys.length).toBeLessThanOrEqual(metricsService.MAX_LATENCY_ROUTES);
  });
});

