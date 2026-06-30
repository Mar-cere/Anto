import { describe, expect, it } from '@jest/globals';
import metricsService from '../../../services/metricsService.js';

describe('metricsService — streaming TTFT desglosado (#59)', () => {
  it('agrega preLlmMs y modelTtftMs en healthStats', async () => {
    metricsService.inMemoryMetrics.chatUsage.preLlmMsSamples = [];
    metricsService.inMemoryMetrics.chatUsage.modelTtftMsSamples = [];
    metricsService.inMemoryMetrics.chatUsage.ttftMsSamples = [];
    metricsService.inMemoryMetrics.chatUsage.latencyByRoute = {};

    await metricsService.recordMetric(
      'chat_usage',
      {
        action: 'streaming_first_chunk',
        isGuest: false,
        ttftMs: 900,
        preLlmMs: 400,
        modelTtftMs: 500,
      },
      '000000000000000000000001',
      { transport: 'http', endpoint: 'chat', surface: 'registered' },
    );

    const health = await metricsService.getHealthStats();
    expect(health.chatUsage.streaming.ttft.preLlm.p50Ms).toBe(400);
    expect(health.chatUsage.streaming.ttft.model.p50Ms).toBe(500);
    expect(health.chatUsage.latencyByRoute['http:chat:registered'].ttft.preLlm.p50Ms).toBe(400);
    expect(health.chatUsage.latencyByRoute['http:chat:registered'].ttft.model.p50Ms).toBe(500);
  });

  it('agrega ruta socket:chat:registered en latencyByRoute', async () => {
    metricsService.inMemoryMetrics.chatUsage.latencyByRoute = {};

    await metricsService.recordMetric(
      'chat_usage',
      {
        action: 'streaming_first_chunk',
        isGuest: false,
        ttftMs: 250,
        preLlmMs: 100,
        modelTtftMs: 150,
      },
      '000000000000000000000001',
      { transport: 'socket', endpoint: 'chat', surface: 'registered' },
    );

    const health = await metricsService.getHealthStats();
    expect(health.chatUsage.latencyByRoute['socket:chat:registered']).toBeDefined();
    expect(health.chatUsage.latencyByRoute['socket:chat:registered'].ttft.p50Ms).toBe(250);
  });
});
