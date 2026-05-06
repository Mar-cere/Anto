/**
 * #67 — Monitor SLO de latencia de chat (p95) + alertas.
 * Fuente: metricsService.inMemoryMetrics.chatUsage.latencyByRoute.
 * No requiere Datadog/Grafana: alerta vía Sentry y logs.
 */

import metricsService from './metricsService.js';
import { captureMessage } from '../utils/sentry.js';
import logger from '../utils/logger.js';

const parseEnvInt = (name, fallback, min, max) => {
  const raw = process.env[name];
  if (raw === undefined || String(raw).trim() === '') return fallback;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return fallback;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
};

/**
 * @param {number[]} samples
 * @param {number} p
 * @returns {number|null}
 */
export function calcPercentile(samples, p) {
  if (!Array.isArray(samples) || samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function startChatLatencySloMonitor() {
  const enabled = process.env.ENABLE_CHAT_LATENCY_SLO_MONITOR !== 'false';
  if (!enabled) {
    logger.info('📉 Chat latency SLO monitor: desactivado (ENABLE_CHAT_LATENCY_SLO_MONITOR=false)');
    return { stop: () => {} };
  }

  const CHECK_INTERVAL_MS = parseEnvInt('CHAT_SLO_CHECK_INTERVAL_MS', 5 * 60 * 1000, 10_000, 30 * 60 * 1000);
  const MIN_SAMPLES = parseEnvInt('CHAT_SLO_MIN_SAMPLES', 20, 5, 200);
  const TTFT_P95_MS = parseEnvInt('CHAT_SLO_TTFT_P95_MS', 1500, 200, 20_000);
  const NONSTREAM_P95_MS = parseEnvInt('CHAT_SLO_NONSTREAM_P95_MS', 8000, 500, 60_000);
  const ALERT_COOLDOWN_MS = parseEnvInt('CHAT_SLO_ALERT_COOLDOWN_MS', 30 * 60 * 1000, 60_000, 6 * 60 * 60 * 1000);
  const CONSECUTIVE_BREACHES = parseEnvInt('CHAT_SLO_CONSECUTIVE_BREACHES', 2, 1, 5);

  const state = {
    byRoute: /** @type {Record<string, { breaches: number, lastAlertAt: number }>} */ ({})
  };

  const tick = () => {
    try {
      const byRoute = metricsService.inMemoryMetrics?.chatUsage?.latencyByRoute || {};
      const now = Date.now();

      for (const [routeKey, bucket] of Object.entries(byRoute)) {
        const ttftSamples = Array.isArray(bucket?.ttftMsSamples) ? bucket.ttftMsSamples : [];
        const nonSamples = Array.isArray(bucket?.nonStreamLatencyMsSamples)
          ? bucket.nonStreamLatencyMsSamples
          : [];

        const s = (state.byRoute[routeKey] ||= { breaches: 0, lastAlertAt: 0 });

        const ttftP95 = ttftSamples.length >= MIN_SAMPLES ? calcPercentile(ttftSamples, 95) : null;
        const nonP95 = nonSamples.length >= MIN_SAMPLES ? calcPercentile(nonSamples, 95) : null;

        const isBreach =
          (ttftP95 != null && ttftP95 > TTFT_P95_MS) ||
          (nonP95 != null && nonP95 > NONSTREAM_P95_MS);

        if (!isBreach) {
          s.breaches = 0;
          continue;
        }

        s.breaches += 1;
        const inCooldown = now - (s.lastAlertAt || 0) < ALERT_COOLDOWN_MS;
        const shouldAlert = s.breaches >= CONSECUTIVE_BREACHES && !inCooldown;

        if (!shouldAlert) continue;

        s.lastAlertAt = now;
        s.breaches = 0;

        const payload = {
          routeKey,
          thresholds: { ttftP95Ms: TTFT_P95_MS, nonStreamP95Ms: NONSTREAM_P95_MS, minSamples: MIN_SAMPLES },
          observed: {
            ttft: { samples: ttftSamples.length, p95Ms: ttftP95 },
            nonStreaming: { samples: nonSamples.length, p95Ms: nonP95 }
          }
        };

        logger.warn('📉 SLO latencia chat: posible regresión p95', payload);
        captureMessage('SLO latencia chat: p95 sobre umbral', 'warning', payload);
      }
    } catch (e) {
      logger.warn('Chat latency SLO monitor tick error', { error: e?.message || String(e) });
    }
  };

  const timer = setInterval(tick, CHECK_INTERVAL_MS);
  timer.unref?.();
  // Primer chequeo ligero tras iniciar
  setTimeout(tick, Math.min(30_000, CHECK_INTERVAL_MS)).unref?.();

  logger.info('📉 Chat latency SLO monitor: activo', {
    checkIntervalMs: CHECK_INTERVAL_MS,
    minSamples: MIN_SAMPLES,
    thresholds: { ttftP95Ms: TTFT_P95_MS, nonStreamP95Ms: NONSTREAM_P95_MS }
  });

  return {
    stop: () => clearInterval(timer)
  };
}

