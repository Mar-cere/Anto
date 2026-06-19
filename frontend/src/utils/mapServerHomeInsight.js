/**
 * Mapea homeInsight del API /summary/focus al formato de la card del dashboard.
 */
const ALLOWED_CTA_KEYS = new Set([
  'HOME_INSIGHT_CTA_PROGRESS',
  'HOME_INSIGHT_CTA_WEEKLY',
  'HOME_INSIGHT_CTA_GRAPH',
  'HOME_INSIGHT_CTA_SUMMARY',
]);

const ALLOWED_SCREENS = new Set(['ActivitySummary', 'WeeklyInsight', 'InterventionGraph']);

const MAX_INSIGHT_TEXT = 500;

export function mapServerHomeInsight(homeInsight, texts = {}) {
  if (!homeInsight?.text) return null;

  const text = String(homeInsight.text).replace(/\s+/g, ' ').trim().slice(0, MAX_INSIGHT_TEXT);
  if (text.length < 12) return null;

  const ctaKey = ALLOWED_CTA_KEYS.has(homeInsight.ctaKey)
    ? homeInsight.ctaKey
    : 'HOME_INSIGHT_CTA_PROGRESS';

  const rawScreen = String(homeInsight.destination || 'ActivitySummary').trim();
  const screen = ALLOWED_SCREENS.has(rawScreen) ? rawScreen : 'ActivitySummary';

  const ctaLabel = String(texts[ctaKey] || texts.HOME_INSIGHT_CTA_PROGRESS || '').trim();
  if (!ctaLabel) return null;

  return {
    text,
    source: homeInsight.source || null,
    ctaLabel,
    screen,
  };
}
