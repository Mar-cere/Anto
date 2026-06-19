/**
 * Caché del insight rotativo del home (evita dependencia circular con weeklyPatternInsight).
 */
import { getPreviousIsoWeekKey } from '../utils/weekKeys.js';
import { normalizeFocusLanguage } from '../utils/focusDashboardCopy.js';
import cacheService from './cacheService.js';

export const HOME_INSIGHT_CACHE_VERSION = 1;
export const HOME_INSIGHT_MAX_TEXT = 500;

export const ALLOWED_HOME_INSIGHT_CTA_KEYS = new Set([
  'HOME_INSIGHT_CTA_PROGRESS',
  'HOME_INSIGHT_CTA_WEEKLY',
  'HOME_INSIGHT_CTA_GRAPH',
  'HOME_INSIGHT_CTA_SUMMARY',
]);

export const ALLOWED_HOME_INSIGHT_SOURCES = new Set(['weekly', 'summary', 'graph']);

export function cacheTtlSecondsUntilUtcEndOfDay() {
  const now = Date.now();
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const sec = Math.floor((end.getTime() - now) / 1000);
  return Math.max(300, Math.min(sec, 24 * 60 * 60));
}

export function buildSummaryActivityFingerprint(summary) {
  if (!summary || typeof summary !== 'object') return 'na';
  const chat = summary.chat || {};
  const habits = summary.habits || {};
  const tasks = summary.tasks || {};
  const journal = summary.journal || {};
  const period = summary.period || {};
  const weekKey = period.weekKey || String(period.start || '').slice(0, 10) || 'na';
  return [
    weekKey,
    chat.userMessages ?? 0,
    chat.distinctActiveDays ?? 0,
    habits.completionsInPeriod ?? 0,
    tasks.completedInPeriod ?? 0,
    journal.entriesCount ?? 0,
  ].join(':');
}

export function buildHomeInsightCacheKey(
  userId,
  { language = 'es', dayKey = null, weekKey = null } = {},
) {
  if (!userId) return null;
  const lang = normalizeFocusLanguage(language);
  const day = dayKey || new Date().toISOString().slice(0, 10);
  const week = weekKey || getPreviousIsoWeekKey();
  return cacheService.generateKey('home_rotating_insight_v1', {
    userId: String(userId),
    day,
    language: lang,
    weekKey: week,
  });
}

export function sanitizeHomeInsightForClient(insight) {
  if (!insight?.text) return null;
  const text = String(insight.text).replace(/\s+/g, ' ').trim().slice(0, HOME_INSIGHT_MAX_TEXT);
  if (text.length < 12) return null;

  const ctaKey = ALLOWED_HOME_INSIGHT_CTA_KEYS.has(insight.ctaKey)
    ? insight.ctaKey
    : 'HOME_INSIGHT_CTA_PROGRESS';
  const source = ALLOWED_HOME_INSIGHT_SOURCES.has(insight.source) ? insight.source : null;
  const destination = 'ActivitySummary';
  const rotationSeed =
    typeof insight.rotationSeed === 'string'
      ? insight.rotationSeed.trim().slice(0, 48)
      : undefined;

  return {
    text,
    source,
    ctaKey,
    destination,
    ...(rotationSeed ? { rotationSeed } : {}),
  };
}

export function serializeHomeInsightCacheEntry(insight, activityFp = 'na') {
  const fp = String(activityFp || 'na').slice(0, 80);
  if (!insight?.text) {
    return { v: HOME_INSIGHT_CACHE_VERSION, empty: true, activityFp: fp };
  }
  return { v: HOME_INSIGHT_CACHE_VERSION, insight, activityFp: fp };
}

export function parseHomeInsightCacheEntry(cached, expectedActivityFp = null) {
  if (!cached || typeof cached !== 'object' || cached.v !== HOME_INSIGHT_CACHE_VERSION) {
    return { hit: false, insight: null };
  }
  if (
    expectedActivityFp &&
    cached.activityFp &&
    cached.activityFp !== expectedActivityFp
  ) {
    return { hit: false, insight: null };
  }
  if (cached.empty === true) {
    return { hit: true, insight: null };
  }
  const sanitized = sanitizeHomeInsightForClient(cached.insight);
  if (sanitized) {
    return { hit: true, insight: sanitized };
  }
  return { hit: false, insight: null };
}

export async function invalidateHomeRotatingInsightCache(userId) {
  if (!userId) return;
  const languages = ['es', 'en'];
  const dayKey = new Date().toISOString().slice(0, 10);
  const weekKey = getPreviousIsoWeekKey();
  await Promise.all(
    languages.map((language) => {
      const key = buildHomeInsightCacheKey(userId, { language, dayKey, weekKey });
      return key ? cacheService.delete(key) : Promise.resolve();
    }),
  );
}
