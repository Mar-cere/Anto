import { pickStableVariantIndex } from './dashboardHomeUtils';
import { formatCorrelationInsight } from '../screens/interventionGraphTexts';

/**
 * Candidatos de insight para el home, derivados de patrones, resumen y mapa.
 * @returns {Array<{ id: string, text: string, source: 'weekly'|'summary'|'graph', ctaKey: string }>}
 */
export function buildHomeInsightCandidates({
  weeklyPayload = null,
  summaryPayload = null,
  graphPayload = null,
  graphTexts = {},
  language = 'es',
} = {}) {
  const candidates = [];
  const seen = new Set();

  const push = (entry) => {
    const text = String(entry?.text || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length < 12 || seen.has(text)) return;
    seen.add(text);
    candidates.push({ ...entry, text });
  };

  const weekly = weeklyPayload?.insight;
  if (weekly?.status === 'ready') {
    (weekly.insights || []).slice(0, 4).forEach((row, index) => {
      if (!row?.detail) return;
      push({
        id: `weekly-detail-${index}`,
        text: row.detail,
        source: 'weekly',
        ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
      });
    });
    if (weekly.headline) {
      push({
        id: 'weekly-headline',
        text: weekly.headline,
        source: 'weekly',
        ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
      });
    }
    if (weekly.body) {
      push({
        id: 'weekly-body',
        text: weekly.body,
        source: 'weekly',
        ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
      });
    }
  }

  const narrative = summaryPayload?.narrative;
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

  const correlations = graphPayload?.correlations;
  if (Array.isArray(correlations)) {
    correlations.slice(0, 4).forEach((row, index) => {
      const text = formatCorrelationInsight(graphTexts, row, language);
      if (!text) return;
      push({
        id: `graph-corr-${index}`,
        text,
        source: 'graph',
        ctaKey: 'HOME_INSIGHT_CTA_GRAPH',
      });
    });
  }

  return candidates;
}

/**
 * Elige un insight estable por día (rota si hay varios candidatos).
 */
export function pickHomeRotatingInsight(candidates, seed) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const idx = pickStableVariantIndex(seed, candidates.length);
  return candidates[idx];
}

export function homeInsightRotationSeed(dateKey = new Date().toISOString().slice(0, 10)) {
  return `home-insight:${dateKey}`;
}
