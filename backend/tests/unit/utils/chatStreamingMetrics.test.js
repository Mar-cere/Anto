import { describe, expect, it } from '@jest/globals';
import {
  buildStreamingTtftMetrics,
  streamingTtftMetricPayload,
} from '../../../utils/chatStreamingMetrics.js';

describe('chatStreamingMetrics (#59)', () => {
  it('calcula ttft total, pre-LLM y modelo', () => {
    const metrics = buildStreamingTtftMetrics({
      startTime: 1000,
      preLlmEndAt: 1400,
      firstChunkAt: 1800,
    });
    expect(metrics).toEqual({
      ttftMs: 800,
      preLlmMs: 400,
      modelTtftMs: 400,
    });
  });

  it('devuelve null si firstChunkAt es inválido', () => {
    expect(
      buildStreamingTtftMetrics({ startTime: 1000, preLlmEndAt: 1200, firstChunkAt: NaN }),
    ).toBeNull();
  });

  it('omite preLlm/model si preLlmEndAt no es válido', () => {
    const metrics = buildStreamingTtftMetrics({
      startTime: 1000,
      preLlmEndAt: null,
      firstChunkAt: 1500,
    });
    expect(metrics).toEqual({
      ttftMs: 500,
      preLlmMs: null,
      modelTtftMs: null,
    });
  });

  it('modelTtftMs no es negativo si preLlmEndAt es posterior (skew de reloj)', () => {
    const metrics = buildStreamingTtftMetrics({
      startTime: 1000,
      preLlmEndAt: 1600,
      firstChunkAt: 1500,
    });
    expect(metrics?.modelTtftMs).toBe(0);
    expect(metrics?.ttftMs).toBe(500);
  });

  it('streamingTtftMetricPayload incluye solo campos presentes', () => {
    expect(streamingTtftMetricPayload({ ttftMs: 900, preLlmMs: 300, modelTtftMs: 600 })).toEqual({
      ttftMs: 900,
      preLlmMs: 300,
      modelTtftMs: 600,
    });
    expect(streamingTtftMetricPayload(null)).toEqual({});
    expect(streamingTtftMetricPayload({ ttftMs: -1, preLlmMs: 0 })).toEqual({});
  });
});
