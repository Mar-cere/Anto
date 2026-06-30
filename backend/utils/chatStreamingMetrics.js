/**
 * Métricas TTFT para streaming de chat (#59).
 * Separa latencia pre-LLM (análisis, contexto) de tiempo hasta primer token del modelo.
 */

/**
 * @param {{ startTime: number, preLlmEndAt?: number|null, firstChunkAt: number }} params
 * @returns {{ ttftMs: number, preLlmMs: number|null, modelTtftMs: number|null }|null}
 */
export function buildStreamingTtftMetrics({ startTime, preLlmEndAt, firstChunkAt }) {
  const start = Number(startTime);
  const first = Number(firstChunkAt);
  if (!Number.isFinite(start) || !Number.isFinite(first) || first < start) {
    return null;
  }

  const ttftMs = first - start;
  const preLlmEnd =
    preLlmEndAt != null && preLlmEndAt !== '' ? Number(preLlmEndAt) : NaN;
  const preLlmMs =
    Number.isFinite(preLlmEnd) && preLlmEnd >= start ? preLlmEnd - start : null;
  const modelTtftMs =
    Number.isFinite(preLlmEnd) && preLlmEnd >= start
      ? Math.max(0, first - preLlmEnd)
      : null;

  return { ttftMs, preLlmMs, modelTtftMs };
}

/**
 * @param {object|null} metrics
 * @returns {object}
 */
export function streamingTtftMetricPayload(metrics) {
  if (!metrics) return {};
  const payload = { ttftMs: metrics.ttftMs };
  if (metrics.preLlmMs != null) payload.preLlmMs = metrics.preLlmMs;
  if (metrics.modelTtftMs != null) payload.modelTtftMs = metrics.modelTtftMs;
  return payload;
}
