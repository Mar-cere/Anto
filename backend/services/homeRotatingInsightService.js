/**
 * Insight rotativo del home — un candidato por día desde patrones, resumen y mapa.
 */
import { getPreviousIsoWeekKey } from '../utils/weekKeys.js';
import { normalizeFocusLanguage } from '../utils/focusDashboardCopy.js';
import { getWeeklyPatternInsight } from './weeklyPatternInsightService.js';
import chatInterventionGraphService from './chatInterventionGraphService.js';
import { buildInterventionGraphPhase3Payload } from './interventionGraphPhase3Service.js';
import { getInterventionCatalogLabel, getInterventionCatalogEntry } from '../constants/interventionCatalog.js';
import cacheService from './cacheService.js';
import {
  buildHomeInsightCacheKey,
  buildSummaryActivityFingerprint,
  cacheTtlSecondsUntilUtcEndOfDay,
  HOME_INSIGHT_MAX_TEXT,
  parseHomeInsightCacheEntry,
  sanitizeHomeInsightForClient,
  serializeHomeInsightCacheEntry,
} from './homeRotatingInsightCache.js';

export {
  buildHomeInsightCacheKey,
  buildSummaryActivityFingerprint,
  invalidateHomeRotatingInsightCache,
  parseHomeInsightCacheEntry,
  sanitizeHomeInsightForClient,
  serializeHomeInsightCacheEntry,
} from './homeRotatingInsightCache.js';

export function pickStableVariantIndex(seed, count) {
  if (!count || count <= 1) return 0;
  let hash = 0;
  const s = String(seed || 'default');
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

export function homeInsightRotationSeed(dateKey = new Date().toISOString().slice(0, 10)) {
  return `home-insight:${dateKey}`;
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, HOME_INSIGHT_MAX_TEXT);
}

function formatGraphCorrelationInsight(row, language = 'es') {
  const lang = normalizeFocusLanguage(language);
  const topic = String(row?.sourceLabel || row?.sourceId || '').trim();
  const interventionId = String(row?.interventionLabel || row?.targetId || '').trim();
  const entry = getInterventionCatalogEntry(interventionId);
  const intervention =
    getInterventionCatalogLabel(entry, lang) || interventionId.replace(/_/g, ' ');

  if (row?.type === 'concept_intervention') {
    return lang === 'en'
      ? `When you talk about "${topic}", you often use ${intervention}.`
      : `Cuando hablas de «${topic}», a menudo usas ${intervention}.`;
  }
  if (row?.type === 'topic_mood_ba') {
    const delta = Math.abs(
      Number(row?.metrics?.avgMoodDeltaOnTopicDays || 0) -
        Number(row?.metrics?.avgMoodDeltaOverall || 0),
    ).toFixed(1);
    return row.direction === 'dip'
      ? lang === 'en'
        ? `On ${topic} days, mood often dips after behavioral activation (~${delta}).`
        : `En días de ${topic}, tu ánimo suele bajar tras activación conductual (~${delta}).`
      : lang === 'en'
        ? `On ${topic} days, mood often lifts after behavioral activation (~${delta}).`
        : `En días de ${topic}, tu ánimo suele mejorar tras activación conductual (~${delta}).`;
  }
  if (!topic || !intervention) return '';
  return lang === 'en'
    ? `When ${topic} comes up, ${intervention} tends to help you.`
    : `Cuando aparece ${topic}, suele ayudarte ${intervention}.`;
}

/**
 * @param {{ weeklyInsight?: object|null, summary?: object|null, graphCorrelations?: Array, language?: string }} input
 */
export function buildHomeInsightCandidates({
  weeklyInsight = null,
  summary = null,
  graphCorrelations = [],
  language = 'es',
} = {}) {
  const candidates = [];
  const seen = new Set();

  const push = (entry) => {
    const text = normalizeText(entry?.text);
    if (!text || text.length < 12 || seen.has(text)) return;
    seen.add(text);
    candidates.push({
      id: entry.id,
      text,
      source: entry.source,
      ctaKey: entry.ctaKey,
    });
  };

  if (weeklyInsight?.status === 'ready') {
    (weeklyInsight.insights || []).slice(0, 4).forEach((row, index) => {
      if (!row?.detail) return;
      push({
        id: `weekly-detail-${index}`,
        text: row.detail,
        source: 'weekly',
        ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
      });
    });
    if (weeklyInsight.headline) {
      push({
        id: 'weekly-headline',
        text: weeklyInsight.headline,
        source: 'weekly',
        ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
      });
    }
  }

  const narrative = summary?.narrative;
  if (narrative?.microWins) {
    push({
      id: 'summary-micro-wins',
      text: narrative.microWins,
      source: 'summary',
      ctaKey: 'HOME_INSIGHT_CTA_SUMMARY',
    });
  }
  if (narrative?.themes) {
    push({
      id: 'summary-themes',
      text: narrative.themes,
      source: 'summary',
      ctaKey: 'HOME_INSIGHT_CTA_SUMMARY',
    });
  }

  (graphCorrelations || []).slice(0, 4).forEach((row, index) => {
    const text = formatGraphCorrelationInsight(row, language);
    if (!text) return;
    push({
      id: `graph-corr-${index}`,
      text,
      source: 'graph',
      ctaKey: 'HOME_INSIGHT_CTA_GRAPH',
    });
  });

  return candidates;
}

export function pickHomeRotatingInsight(candidates, seed) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const idx = pickStableVariantIndex(seed, candidates.length);
  return candidates[idx];
}

async function loadGraphCorrelations(userId, language) {
  if (!userId) return [];
  const days = 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const edges = await chatInterventionGraphService.aggregateInterventionGraph({
    userId,
    since,
    limit: 40,
  });
  if (!edges?.length) return [];

  const mappedEdges = edges.map((e) => {
    const interventionId = String(e?._id?.interventionId || '').slice(0, 80);
    const entry = getInterventionCatalogEntry(interventionId);
    return {
      topicTag: String(e?._id?.topicTag || 'general').slice(0, 64),
      interventionId,
      interventionLabel: getInterventionCatalogLabel(entry, language) || interventionId,
      shown: e.shown || 0,
      clicked: e.clicked || 0,
      dismissed: e.dismissed || 0,
      completed: e.completed || 0,
    };
  });

  const phase3 = await buildInterventionGraphPhase3Payload({
    userId,
    since,
    topicTagEdges: mappedEdges,
    topicFreeEdges: [],
    language,
  });
  return Array.isArray(phase3?.correlations) ? phase3.correlations : [];
}

async function computeHomeRotatingInsightUncached(userId, opts = {}) {
  if (!userId) return null;
  const language = normalizeFocusLanguage(opts.language);
  const weekKey = getPreviousIsoWeekKey();

  const [weeklyDoc, graphCorrelations] = await Promise.all([
    getWeeklyPatternInsight({ userId, weekKey, language }).catch(() => null),
    loadGraphCorrelations(userId, language).catch(() => []),
  ]);

  const candidates = buildHomeInsightCandidates({
    weeklyInsight: weeklyDoc,
    summary: opts.summary,
    graphCorrelations,
    language,
  });

  const picked = pickHomeRotatingInsight(candidates, homeInsightRotationSeed());
  if (!picked) return null;

  return sanitizeHomeInsightForClient({
    text: picked.text,
    source: picked.source,
    ctaKey: picked.ctaKey,
    destination: 'ActivitySummary',
    rotationSeed: homeInsightRotationSeed(),
  });
}

/**
 * @param {string} userId
 * @param {{ language?: string, summary?: object|null, timezone?: string|null }} [opts]
 */
export async function buildHomeRotatingInsightForUser(userId, opts = {}) {
  if (!userId) return null;

  const language = normalizeFocusLanguage(opts.language);
  const dayKey = new Date().toISOString().slice(0, 10);
  const weekKey = getPreviousIsoWeekKey();
  const activityFp = buildSummaryActivityFingerprint(opts.summary);
  const cacheKey = buildHomeInsightCacheKey(userId, { language, dayKey, weekKey });
  if (!cacheKey) return null;

  try {
    const envelope = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const result = await computeHomeRotatingInsightUncached(userId, opts);
        return serializeHomeInsightCacheEntry(result, activityFp);
      },
      cacheTtlSecondsUntilUtcEndOfDay(),
    );
    const parsed = parseHomeInsightCacheEntry(envelope, activityFp);
    if (parsed.hit) {
      return parsed.insight;
    }
  } catch {
    /* fallback sin caché */
  }

  return computeHomeRotatingInsightUncached(userId, opts);
}
