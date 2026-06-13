/**
 * Fenotipado digital: sync y agregación (#216).
 */
import DigitalPhenotypeDailySnapshot from '../models/DigitalPhenotypeDailySnapshot.js';

function dayKeyFromDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function sanitizeDigitalPhenotypePayload(payload = {}) {
  const dayKey = String(payload.dayKey || dayKeyFromDate() || '').slice(0, 10);
  const clamp = (value, min, max) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.max(min, Math.min(max, n));
  };
  const source = ['healthkit', 'health_connect', 'google_fit', 'manual', 'stub'].includes(
    payload.source,
  )
    ? payload.source
    : 'stub';

  return {
    dayKey,
    steps: clamp(payload.steps, 0, 100000),
    sleepHours: clamp(payload.sleepHours, 0, 24),
    screenTimeMinutes: clamp(payload.screenTimeMinutes, 0, 1440),
    socialScreenRatio: clamp(payload.socialScreenRatio, 0, 1),
    inactivityHours: clamp(payload.inactivityHours, 0, 24),
    source,
  };
}

export async function upsertDigitalPhenotypeSnapshot({ userId, payload = {} }) {
  if (!userId) return null;
  const sanitized = sanitizeDigitalPhenotypePayload(payload);
  if (!sanitized.dayKey) return null;

  const hasSignal =
    sanitized.steps != null ||
    sanitized.sleepHours != null ||
    sanitized.screenTimeMinutes != null ||
    sanitized.inactivityHours != null;
  if (!hasSignal) return null;

  return DigitalPhenotypeDailySnapshot.findOneAndUpdate(
    { userId, dayKey: sanitized.dayKey },
    {
      $set: {
        ...sanitized,
        syncedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );
}

export async function fetchDigitalPhenotypeSeries({ userId, since, until = null, limit = 14 }) {
  if (!userId || !(since instanceof Date)) return [];
  const query = { userId, dayKey: { $gte: since.toISOString().slice(0, 10) } };
  if (until instanceof Date) {
    query.dayKey.$lt = until.toISOString().slice(0, 10);
  }
  return DigitalPhenotypeDailySnapshot.find(query)
    .sort({ dayKey: -1 })
    .limit(Math.max(1, Math.min(limit, 31)))
    .lean();
}

export function analyzePhenotypeTrends(series = []) {
  const rows = [...(series || [])].sort((a, b) => String(a.dayKey).localeCompare(String(b.dayKey)));
  if (rows.length < 3) {
    return { sleepTrend: null, stepsTrend: null, screenTrend: null, prodromeSleepDelay: false };
  }

  const sleep = rows.map((r) => Number(r.sleepHours)).filter(Number.isFinite);
  const steps = rows.map((r) => Number(r.steps)).filter(Number.isFinite);
  const screen = rows.map((r) => Number(r.screenTimeMinutes)).filter(Number.isFinite);

  const trend = (values) => {
    if (values.length < 3) return null;
    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.ceil(values.length / 2));
    const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
    return avg(second) - avg(first);
  };

  const sleepTrend = trend(sleep);
  const stepsTrend = trend(steps);
  const screenTrend = trend(screen);

  let prodromeSleepDelay = false;
  if (sleep.length >= 3) {
    const last3 = sleep.slice(-3);
    prodromeSleepDelay = last3.every((v, i) => i === 0 || v < last3[i - 1] - 0.25);
  }

  return { sleepTrend, stepsTrend, screenTrend, prodromeSleepDelay };
}

export default {
  sanitizeDigitalPhenotypePayload,
  upsertDigitalPhenotypeSnapshot,
  fetchDigitalPhenotypeSeries,
  analyzePhenotypeTrends,
};
