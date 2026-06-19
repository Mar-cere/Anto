/**
 * Utilidades para informe observacional semanal/mensual.
 */
import { resolveInterventionScreen } from './interventionCatalogResolve';

const INTERVENTION_TO_PSYCHO_TOPIC = Object.freeze({
  psychoeducation_anxiety: 'anxiety',
  psychoeducation_depression: 'depression',
  psychoeducation_stress: 'stress',
  psychoeducation_anger: 'anger',
  psychoeducation_sleep: 'sleep',
  psychoeducation_emotion_regulation: 'emotionRegulation',
  psychoeducation_trauma: 'trauma',
  psychoeducation_grief: 'grief',
  psychoeducation_burnout: 'burnout',
});

const INSIGHT_TYPE_VISUAL = Object.freeze({
  topic_intervention: { icon: 'link-variant', tint: 'primary' },
  concept_intervention: { icon: 'lightbulb-on-outline', tint: 'warm' },
  topic_mood_ba: { icon: 'emoticon-outline', tint: 'calm' },
  typing_cognitive_load: { icon: 'keyboard-outline', tint: 'neutral' },
  typing_revision: { icon: 'pencil-outline', tint: 'neutral' },
  phenotype_sleep_prodrome: { icon: 'sleep', tint: 'calm' },
  phenotype_isolation: { icon: 'walk', tint: 'neutral' },
  phenotype_screen_social: { icon: 'cellphone', tint: 'neutral' },
  abc_macro_pattern: { icon: 'notebook-outline', tint: 'primary' },
  insight: { icon: 'chart-timeline-variant', tint: 'primary' },
});

function parseIsoWeekWindow(weekKey) {
  const match = String(weekKey || '').match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const monday = new Date(simple);
  if (dow <= 4) monday.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else monday.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  const until = new Date(monday);
  until.setUTCDate(until.getUTCDate() + 7);
  return { since: monday, until };
}

function formatShortDate(date, locale) {
  const local = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return local.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/**
 * @param {{ periodKey: string|null, period: 'week'|'month', language?: string }}
 */
export function formatInsightPeriodLabel({ periodKey, period, language = 'es' }) {
  const locale = language === 'en' ? 'en-US' : 'es-ES';
  if (!periodKey) return '';

  if (period === 'month' && /^\d{4}-\d{2}$/.test(periodKey)) {
    const [y, m] = periodKey.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }
  }

  const window = parseIsoWeekWindow(periodKey);
  if (window) {
    const end = new Date(window.until.getTime() - 86400000);
    return `${formatShortDate(window.since, locale)} – ${formatShortDate(end, locale)}`;
  }

  return periodKey;
}

export function extractInsightQuote(detail) {
  const text = String(detail || '');
  const quoted = text.match(/[«"]([^»"]+)[»"]/);
  return quoted?.[1]?.trim() || null;
}

export function getInsightTypeVisual(type) {
  return INSIGHT_TYPE_VISUAL[type] || INSIGHT_TYPE_VISUAL.insight;
}

/**
 * @param {Array<object>} insights
 * @param {Array<object>} correlations
 */
export function enrichInsightRows(insights, correlations) {
  const corrList = Array.isArray(correlations) ? correlations : [];
  return (Array.isArray(insights) ? insights : [])
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const detail = String(row.detail || '').trim();
      const corr = corrList.find((c) => {
        if (!c || c.type !== row.type) return false;
        const intervention = String(c.interventionLabel || c.targetId || '');
        const source = String(c.sourceLabel || c.sourceId || '');
        if (intervention && detail.includes(intervention)) return true;
        if (source && detail.toLowerCase().includes(source.toLowerCase())) return true;
        return false;
      });
      return {
        type: String(row.type || 'insight'),
        label: String(row.label || '').trim(),
        detail,
        strength: typeof row.strength === 'number' ? row.strength : corr?.strength,
        targetId: corr?.targetId ? String(corr.targetId) : null,
        quote: extractInsightQuote(detail),
      };
    })
    .filter((row) => row.label || row.detail);
}

/**
 * @param {string|null} interventionId
 * @returns {{ screen: string, params: object }|null}
 */
export function buildInsightRowNavigation(interventionId) {
  const id = String(interventionId || '').trim().toLowerCase();
  if (!id) return null;
  const topic = INTERVENTION_TO_PSYCHO_TOPIC[id];
  if (topic) {
    return { screen: 'PsychoeducationModule', params: { topic, graphTracked: true } };
  }
  // Resolver la técnica concreta cuando el id está en el catálogo (#127);
  // así el insight lleva a la intervención específica, no al hub genérico.
  const resolved = resolveInterventionScreen(id);
  if (resolved) return resolved;
  return { screen: 'TherapeuticTechniques', params: {} };
}

/**
 * @param {object|null} sourceSummary
 */
export function buildInsightSourceChips(sourceSummary, texts) {
  if (!sourceSummary || typeof sourceSummary !== 'object') return [];
  const chips = [];
  const chatDays = Number(sourceSummary.chatDaysActive);
  if (Number.isFinite(chatDays) && chatDays > 0) {
    chips.push({
      key: 'chat',
      icon: 'chat-outline',
      label: (texts.SOURCE_CHAT_DAYS || '{n} días en chat').replace('{n}', String(chatDays)),
    });
  }
  const typing = Number(sourceSummary.typingCount);
  if (Number.isFinite(typing) && typing > 0) {
    chips.push({
      key: 'typing',
      icon: 'keyboard-outline',
      label: (texts.SOURCE_TYPING || '{n} borradores analizados').replace('{n}', String(typing)),
    });
  }
  const phenotypeDays = Number(sourceSummary.phenotypeDaysWithData);
  if (Number.isFinite(phenotypeDays) && phenotypeDays > 0) {
    chips.push({
      key: 'phenotype',
      icon: 'heart-pulse',
      label: (texts.SOURCE_PHENOTYPE || '{n} días de señales').replace('{n}', String(phenotypeDays)),
    });
  }
  return chips.slice(0, 3);
}

export function formatInsightStrengthPct(strength) {
  if (typeof strength !== 'number' || !Number.isFinite(strength)) return null;
  return Math.max(8, Math.min(100, Math.round(strength * 100)));
}
