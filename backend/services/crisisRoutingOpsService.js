/**
 * Ops de enrutamiento crisis: agregación Mongo (multi-instancia) + merge con memoria de proceso.
 */
import mongoose from 'mongoose';
import { features } from '../config/features.js';
import metricsService from './metricsService.js';

const CRISIS_METRIC_TYPES = [
  'crisis_hard_stop',
  'crisis_llm_path',
  'crisis_llm_sanitized',
  'crisis_background_action',
];

function getMetricModel() {
  return mongoose.models.Metric || null;
}

function bumpMap(map, key, amount = 1) {
  const k = String(key || 'UNKNOWN');
  map[k] = (map[k] || 0) + amount;
}

export function createEmptyCrisisRoutingCounts() {
  return {
    hardStop: 0,
    llmPath: 0,
    sanitizedResponses: 0,
    hardStopByRiskLevel: {},
    llmPathByRiskLevel: {},
    hardStopByTransport: {},
    llmPathByTransport: {},
    sanitizeHits: {},
    sanitizedByTransport: {},
    sanitizedByRiskLevel: {},
    hardStopEligibleEvents: 0,
    hardStopEligibleLlmPath: 0,
    hardStopEligibleHighLlmPath: 0,
    explicitLexiconEvents: 0,
    backgroundActions: {
      total: 0,
      errors: 0,
      byRiskLevel: {},
      byTransport: {},
      byPhase: { sync: 0, async: 0 },
      byAction: {},
    },
  };
}

/**
 * Pliega documentos Metric (lean) en contadores de routing.
 * @param {Array<{ type: string, data?: object }>} docs
 */
export function foldCrisisMetricDocs(docs = []) {
  const counts = createEmptyCrisisRoutingCounts();

  for (const doc of docs) {
    const type = doc?.type;
    const data = doc?.data || {};
    const rl = String(data.riskLevel || 'UNKNOWN').toUpperCase();
    const transport = String(data.transport || 'unknown');
    const eligible = data.hardStopEligible === true;
    const explicit = data.explicitLexicon === true;

    if (type === 'crisis_hard_stop') {
      counts.hardStop++;
      bumpMap(counts.hardStopByRiskLevel, rl);
      bumpMap(counts.hardStopByTransport, transport);
      if (eligible) counts.hardStopEligibleEvents++;
      if (explicit) counts.explicitLexiconEvents++;
    } else if (type === 'crisis_llm_path') {
      counts.llmPath++;
      bumpMap(counts.llmPathByRiskLevel, rl);
      bumpMap(counts.llmPathByTransport, transport);
      if (eligible) {
        counts.hardStopEligibleEvents++;
        counts.hardStopEligibleLlmPath++;
        if (rl === 'HIGH') counts.hardStopEligibleHighLlmPath++;
      }
      if (explicit) counts.explicitLexiconEvents++;
    } else if (type === 'crisis_llm_sanitized') {
      counts.sanitizedResponses++;
      bumpMap(counts.sanitizedByTransport, transport);
      bumpMap(counts.sanitizedByRiskLevel, rl);
      const hits = Array.isArray(data.hits) ? data.hits : [];
      for (const hit of hits) bumpMap(counts.sanitizeHits, hit);
    } else if (type === 'crisis_background_action') {
      const bg = counts.backgroundActions;
      bg.total++;
      bumpMap(bg.byRiskLevel, rl);
      bumpMap(bg.byTransport, transport);
      const phase = data.phase === 'sync' ? 'sync' : 'async';
      bg.byPhase[phase] = (bg.byPhase[phase] || 0) + 1;
      const action = String(data.action || 'unknown');
      bumpMap(bg.byAction, action);
      if (action === 'error') bg.errors++;
    }
  }

  return counts;
}

export function computeCrisisRoutingRatios(counts) {
  const routingTotal = counts.hardStop + counts.llmPath;
  const sanitizeDenom = counts.llmPath > 0 ? counts.llmPath : 0;
  const eligibleDenom =
    counts.hardStop + counts.hardStopEligibleLlmPath > 0
      ? counts.hardStop + counts.hardStopEligibleLlmPath
      : 0;

  const pct = (num, den) =>
    den > 0 ? Number(((num / den) * 100).toFixed(2)) : null;

  return {
    hardStopSharePct: pct(counts.hardStop, routingTotal),
    llmPathSharePct: pct(counts.llmPath, routingTotal),
    sanitizeRatePct: pct(counts.sanitizedResponses, sanitizeDenom),
    hardStopCaptureAmongEligiblePct: pct(counts.hardStop, eligibleDenom),
    routingTotal,
    eligibleDenom,
  };
}

function mergeCountMaps(target, source) {
  for (const [k, v] of Object.entries(source || {})) {
    target[k] = (target[k] || 0) + (Number(v) || 0);
  }
}

export function mergeCrisisRoutingCounts(a, b) {
  const out = createEmptyCrisisRoutingCounts();
  for (const src of [a, b]) {
    if (!src) continue;
    out.hardStop += src.hardStop || 0;
    out.llmPath += src.llmPath || 0;
    out.sanitizedResponses += src.sanitizedResponses || 0;
    out.hardStopEligibleEvents += src.hardStopEligibleEvents || 0;
    out.hardStopEligibleLlmPath += src.hardStopEligibleLlmPath || 0;
    out.hardStopEligibleHighLlmPath += src.hardStopEligibleHighLlmPath || 0;
    out.explicitLexiconEvents += src.explicitLexiconEvents || 0;
    mergeCountMaps(out.hardStopByRiskLevel, src.hardStopByRiskLevel);
    mergeCountMaps(out.llmPathByRiskLevel, src.llmPathByRiskLevel);
    mergeCountMaps(out.hardStopByTransport, src.hardStopByTransport);
    mergeCountMaps(out.llmPathByTransport, src.llmPathByTransport);
    mergeCountMaps(out.sanitizeHits, src.sanitizeHits);
    mergeCountMaps(out.sanitizedByTransport, src.sanitizedByTransport);
    mergeCountMaps(out.sanitizedByRiskLevel, src.sanitizedByRiskLevel);
    const bgA = src.backgroundActions || {};
    out.backgroundActions.total += bgA.total || 0;
    out.backgroundActions.errors += bgA.errors || 0;
    mergeCountMaps(out.backgroundActions.byRiskLevel, bgA.byRiskLevel);
    mergeCountMaps(out.backgroundActions.byTransport, bgA.byTransport);
    out.backgroundActions.byPhase.sync += bgA.byPhase?.sync || 0;
    out.backgroundActions.byPhase.async += bgA.byPhase?.async || 0;
    mergeCountMaps(out.backgroundActions.byAction, bgA.byAction);
  }
  return out;
}

function processMemoryToCounts() {
  const snap = metricsService.getCrisisRoutingSnapshot();
  const ops = metricsService.getCrisisRoutingOpsSnapshot();
  const cr = snap;
  const bg = ops.backgroundActions || {};

  const counts = createEmptyCrisisRoutingCounts();
  counts.hardStop = cr.hardStop || 0;
  counts.llmPath = cr.llmPath || 0;
  counts.sanitizedResponses = cr.sanitizedResponses || 0;
  counts.hardStopByRiskLevel = { ...cr.hardStopByRiskLevel };
  counts.llmPathByRiskLevel = { ...cr.llmPathByRiskLevel };
  counts.hardStopByTransport = { ...cr.hardStopByTransport };
  counts.llmPathByTransport = { ...cr.llmPathByTransport };
  counts.sanitizeHits = { ...cr.sanitizeHits };
  counts.sanitizedByTransport = { ...cr.sanitizedByTransport };
  counts.sanitizedByRiskLevel = { ...cr.sanitizedByRiskLevel };
  counts.backgroundActions = {
    total: bg.total || 0,
    errors: bg.errors || 0,
    byRiskLevel: { ...bg.byRiskLevel },
    byTransport: { ...bg.byTransport },
    byPhase: { ...bg.byPhase },
    byAction: { ...bg.byAction },
  };
  return counts;
}

export function buildCrisisRoutingView(counts, { scope, since = null, until = null, windowHours = null } = {}) {
  const ratios = computeCrisisRoutingRatios(counts);
  return {
    scope,
    since,
    until,
    windowHours,
    counts,
    routing: {
      hardStop: counts.hardStop,
      llmPath: counts.llmPath,
      total: ratios.routingTotal,
      hardStopSharePct: ratios.hardStopSharePct,
      llmPathSharePct: ratios.llmPathSharePct,
      hardStopCaptureAmongEligiblePct: ratios.hardStopCaptureAmongEligiblePct,
      hardStopEligibleLlmPath: counts.hardStopEligibleLlmPath,
      hardStopEligibleHighLlmPath: counts.hardStopEligibleHighLlmPath,
      explicitLexiconEvents: counts.explicitLexiconEvents,
      hardStopByRiskLevel: { ...counts.hardStopByRiskLevel },
      llmPathByRiskLevel: { ...counts.llmPathByRiskLevel },
      hardStopByTransport: { ...counts.hardStopByTransport },
      llmPathByTransport: { ...counts.llmPathByTransport },
    },
    sanitization: {
      sanitizedResponses: counts.sanitizedResponses,
      sanitizeRatePct: ratios.sanitizeRatePct,
      sanitizeHits: { ...counts.sanitizeHits },
      sanitizedByTransport: { ...counts.sanitizedByTransport },
      sanitizedByRiskLevel: { ...counts.sanitizedByRiskLevel },
    },
    backgroundActions: { ...counts.backgroundActions },
  };
}

/**
 * @param {{ windowHours?: number }} [opts]
 */
export async function aggregateCrisisRoutingFromMongo({ windowHours = 24 } = {}) {
  const hours = Math.min(Math.max(Number(windowHours) || 24, 1), 168);
  const until = new Date();
  const since = new Date(until.getTime() - hours * 60 * 60 * 1000);

  if (mongoose.connection.readyState !== 1) {
    return {
      available: false,
      reason: 'mongo_disconnected',
      since: since.toISOString(),
      until: until.toISOString(),
      windowHours: hours,
      counts: createEmptyCrisisRoutingCounts(),
    };
  }

  const Metric = getMetricModel();
  if (!Metric) {
    return {
      available: false,
      reason: 'metric_model_unavailable',
      since: since.toISOString(),
      until: until.toISOString(),
      windowHours: hours,
      counts: createEmptyCrisisRoutingCounts(),
    };
  }

  try {
    const docs = await Metric.find({
      type: { $in: CRISIS_METRIC_TYPES },
      timestamp: { $gte: since, $lte: until },
    })
      .select('type data timestamp')
      .lean()
      .maxTimeMS(15_000);

    return {
      available: true,
      since: since.toISOString(),
      until: until.toISOString(),
      windowHours: hours,
      eventCount: docs.length,
      counts: foldCrisisMetricDocs(docs),
    };
  } catch (error) {
    return {
      available: false,
      reason: error.message || 'aggregate_failed',
      since: since.toISOString(),
      until: until.toISOString(),
      windowHours: hours,
      counts: createEmptyCrisisRoutingCounts(),
    };
  }
}

export function parseCrisisRoutingSource(raw) {
  const s = String(raw || 'merged').toLowerCase();
  if (s === 'memory' || s === 'process') return 'memory';
  if (s === 'mongo' || s === 'db') return 'mongo';
  return 'merged';
}

export function parseCrisisRoutingWindowHours(raw) {
  const n = parseInt(String(raw ?? '24'), 10);
  if (!Number.isFinite(n)) return 24;
  return Math.min(Math.max(n, 1), 168);
}

/**
 * Snapshot ops completo para dashboard / health.
 * @param {{ windowHours?: number, source?: 'memory'|'mongo'|'merged' }} [opts]
 */
export async function getCrisisRoutingOpsSnapshot({
  windowHours = 24,
  source = 'merged',
} = {}) {
  const hours = parseCrisisRoutingWindowHours(windowHours);
  const src = parseCrisisRoutingSource(source);

  const memoryView = buildCrisisRoutingView(processMemoryToCounts(), {
    scope: 'process_memory',
    windowHours: null,
  });

  if (src === 'memory') {
    return {
      success: true,
      source: 'memory',
      crisisHardStopEnabled: features.crisisHardStop === true,
      capturedAt: new Date().toISOString(),
      process: memoryView,
    };
  }

  const mongoAgg = await aggregateCrisisRoutingFromMongo({ windowHours: hours });
  const mongoView = buildCrisisRoutingView(mongoAgg.counts, {
    scope: 'mongo_window',
    since: mongoAgg.since,
    until: mongoAgg.until,
    windowHours: mongoAgg.windowHours,
  });

  if (src === 'mongo') {
    return {
      success: true,
      source: 'mongo',
      crisisHardStopEnabled: features.crisisHardStop === true,
      capturedAt: new Date().toISOString(),
      mongo: {
        ...mongoView,
        available: mongoAgg.available,
        reason: mongoAgg.reason || null,
        eventCount: mongoAgg.eventCount ?? 0,
      },
    };
  }

  const mergedCounts = mergeCrisisRoutingCounts(mongoAgg.counts, processMemoryToCounts());
  const mergedView = buildCrisisRoutingView(mergedCounts, {
    scope: 'merged',
    since: mongoAgg.since,
    until: mongoAgg.until,
    windowHours: hours,
  });

  return {
    success: true,
    source: 'merged',
    crisisHardStopEnabled: features.crisisHardStop === true,
    capturedAt: new Date().toISOString(),
    process: memoryView,
    window: {
      ...mongoView,
      available: mongoAgg.available,
      reason: mongoAgg.reason || null,
      eventCount: mongoAgg.eventCount ?? 0,
    },
    merged: mergedView,
  };
}

export default {
  aggregateCrisisRoutingFromMongo,
  getCrisisRoutingOpsSnapshot,
  foldCrisisMetricDocs,
  computeCrisisRoutingRatios,
  mergeCrisisRoutingCounts,
};
