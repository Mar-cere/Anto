/**
 * Monitor SLO de enrutamiento crisis (camino A vs B).
 * Alertas vía logs + Sentry (sin dashboard externo).
 */
import { features } from '../config/features.js';
import { captureMessage } from '../utils/sentry.js';
import logger from '../utils/logger.js';
import {
  aggregateCrisisRoutingFromMongo,
  computeCrisisRoutingRatios,
} from './crisisRoutingOpsService.js';

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
 * Evalúa reglas SLO sobre contadores agregados (puro, testeable).
 */
export function evaluateCrisisRoutingSlo({
  counts,
  crisisHardStopEnabled = true,
  minRoutingEvents = 10,
  minEligibleEvents = 3,
  maxSanitizeRatePct = 35,
  minHardStopCaptureAmongEligiblePct = 80,
} = {}) {
  const ratios = computeCrisisRoutingRatios(counts || {});
  const breaches = [];

  if (crisisHardStopEnabled === false) {
    breaches.push({
      code: 'crisis_hard_stop_disabled',
      severity: 'warning',
      message: 'ENABLE_CRISIS_HARD_STOP está desactivado en producción',
    });
    return { breaches, ratios };
  }

  if (ratios.routingTotal < minRoutingEvents) {
    return { breaches, ratios, skipped: 'insufficient_routing_volume' };
  }

  if (
    ratios.sanitizeRatePct != null &&
    ratios.sanitizeRatePct > maxSanitizeRatePct &&
    counts.llmPath >= minRoutingEvents
  ) {
    breaches.push({
      code: 'crisis_sanitize_rate_high',
      severity: 'warning',
      message: `Tasa de sanitización post-LLM elevada (${ratios.sanitizeRatePct}%)`,
      observed: { sanitizeRatePct: ratios.sanitizeRatePct, llmPath: counts.llmPath },
      threshold: { maxSanitizeRatePct },
    });
  }

  const eligibleDenom = counts.hardStop + counts.hardStopEligibleLlmPath;
  if (
    eligibleDenom >= minEligibleEvents &&
    ratios.hardStopCaptureAmongEligiblePct != null &&
    ratios.hardStopCaptureAmongEligiblePct < minHardStopCaptureAmongEligiblePct
  ) {
    breaches.push({
      code: 'crisis_hard_stop_capture_low',
      severity: 'warning',
      message: `Captura de hard-stop entre elegibles baja (${ratios.hardStopCaptureAmongEligiblePct}%)`,
      observed: {
        hardStopCaptureAmongEligiblePct: ratios.hardStopCaptureAmongEligiblePct,
        hardStop: counts.hardStop,
        hardStopEligibleLlmPath: counts.hardStopEligibleLlmPath,
        hardStopEligibleHighLlmPath: counts.hardStopEligibleHighLlmPath,
      },
      threshold: { minHardStopCaptureAmongEligiblePct },
    });
  }

  return { breaches, ratios };
}

export function startCrisisRoutingSloMonitor() {
  const enabled = process.env.ENABLE_CRISIS_ROUTING_SLO_MONITOR !== 'false';
  if (!enabled) {
    logger.info('🛟 Crisis routing SLO monitor: desactivado (ENABLE_CRISIS_ROUTING_SLO_MONITOR=false)');
    return { stop: () => {} };
  }

  const CHECK_INTERVAL_MS = parseEnvInt(
    'CRISIS_ROUTING_SLO_CHECK_INTERVAL_MS',
    15 * 60 * 1000,
    60_000,
    60 * 60 * 1000,
  );
  const WINDOW_HOURS = parseEnvInt('CRISIS_ROUTING_SLO_WINDOW_HOURS', 24, 1, 168);
  const ALERT_COOLDOWN_MS = parseEnvInt(
    'CRISIS_ROUTING_SLO_ALERT_COOLDOWN_MS',
    30 * 60 * 1000,
    60_000,
    6 * 60 * 60 * 1000,
  );
  const MIN_ROUTING_EVENTS = parseEnvInt('CRISIS_ROUTING_SLO_MIN_ROUTING_EVENTS', 10, 3, 500);
  const MIN_ELIGIBLE_EVENTS = parseEnvInt('CRISIS_ROUTING_SLO_MIN_ELIGIBLE_EVENTS', 3, 1, 100);
  const MAX_SANITIZE_RATE_PCT = parseEnvInt('CRISIS_ROUTING_SLO_MAX_SANITIZE_RATE_PCT', 35, 5, 100);
  const MIN_HARD_STOP_CAPTURE_PCT = parseEnvInt(
    'CRISIS_ROUTING_SLO_MIN_HARD_STOP_CAPTURE_PCT',
    80,
    10,
    100,
  );

  const state = { lastAlertAtByCode: {} };

  const tick = async () => {
    try {
      const agg = await aggregateCrisisRoutingFromMongo({ windowHours: WINDOW_HOURS });
      if (!agg.available) return;

      const { breaches } = evaluateCrisisRoutingSlo({
        counts: agg.counts,
        crisisHardStopEnabled: features.crisisHardStop === true,
        minRoutingEvents: MIN_ROUTING_EVENTS,
        minEligibleEvents: MIN_ELIGIBLE_EVENTS,
        maxSanitizeRatePct: MAX_SANITIZE_RATE_PCT,
        minHardStopCaptureAmongEligiblePct: MIN_HARD_STOP_CAPTURE_PCT,
      });

      if (!breaches.length) return;

      const now = Date.now();
      for (const breach of breaches) {
        const last = state.lastAlertAtByCode[breach.code] || 0;
        if (now - last < ALERT_COOLDOWN_MS) continue;
        state.lastAlertAtByCode[breach.code] = now;

        const payload = {
          ...breach,
          windowHours: WINDOW_HOURS,
          since: agg.since,
          until: agg.until,
          eventCount: agg.eventCount,
        };

        logger.warn('🛟 SLO crisis routing: posible regresión', payload);
        captureMessage(`SLO crisis routing: ${breach.code}`, 'warning', payload);
      }
    } catch (error) {
      logger.warn('Crisis routing SLO monitor tick error', { error: error?.message || String(error) });
    }
  };

  const timer = setInterval(() => {
    tick().catch(() => {});
  }, CHECK_INTERVAL_MS);
  timer.unref?.();
  setTimeout(() => tick().catch(() => {}), Math.min(45_000, CHECK_INTERVAL_MS)).unref?.();

  logger.info('🛟 Crisis routing SLO monitor: activo', {
    checkIntervalMs: CHECK_INTERVAL_MS,
    windowHours: WINDOW_HOURS,
    thresholds: {
      minRoutingEvents: MIN_ROUTING_EVENTS,
      minEligibleEvents: MIN_ELIGIBLE_EVENTS,
      maxSanitizeRatePct: MAX_SANITIZE_RATE_PCT,
      minHardStopCapturePct: MIN_HARD_STOP_CAPTURE_PCT,
    },
  });

  return { stop: () => clearInterval(timer) };
}

export default { startCrisisRoutingSloMonitor, evaluateCrisisRoutingSlo };
