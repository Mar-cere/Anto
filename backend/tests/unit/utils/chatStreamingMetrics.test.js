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

  it('streamingTtftMetricPayload incluye solo campos presentes', () => {
    expect(streamingTtftMetricPayload({ ttftMs: 900, preLlmMs: 300, modelTtftMs: 600 })).toEqual({
      ttftMs: 900,
      preLlmMs: 300,
      modelTtftMs: 600,
    });
    expect(streamingTtftMetricPayload(null)).toEqual({});
  });
});
