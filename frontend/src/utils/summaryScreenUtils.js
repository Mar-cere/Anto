/**
 * Utilidades para la pantalla de resumen semanal/mensual.
 */

export function countSummaryActivity(payload) {
  if (!payload) return 0;
  return (
    (payload.chat?.userMessages ?? 0) +
    (payload.chat?.distinctActiveDays ?? 0) +
    (payload.techniques?.totalUses ?? 0) +
    (payload.tasks?.completedInPeriod ?? 0) +
    (payload.habits?.completionsInPeriod ?? 0) +
    (payload.journal?.entriesCount ?? 0)
  );
}

export function isSummaryEmpty(payload) {
  return countSummaryActivity(payload) === 0;
}

/**
 * @param {object} payload
 * @param {{ TIMES_SINGULAR: string, TIMES_PLURAL: string }} texts
 */
export function formatSummaryPulseLine(payload, texts) {
  const top = payload?.emotions?.insightsEmotionsTop?.[0];
  if (!top?.emotion) return null;
  const n = top.count;
  const name = top.emotion;
  const unit = n === 1 ? texts.TIMES_SINGULAR : texts.TIMES_PLURAL;
  return `${name} · ${n} ${unit}`;
}

/**
 * @param {{ payload: object|null, granularity: 'week'|'month', texts: Record<string, string> }}
 */
export function buildSummaryHeroCopy({ payload, granularity, texts }) {
  const activeDays = payload?.chat?.distinctActiveDays ?? 0;
  const messages = payload?.chat?.userMessages ?? 0;

  if (granularity === 'month') {
    if (activeDays >= 2 || messages >= 5) {
      return (texts.HERO_ACTIVE_MONTH || '')
        .replace('{days}', String(activeDays))
        .replace('{messages}', String(messages));
    }
    return texts.HERO_QUIET_MONTH || texts.HERO_QUIET_WEEK || '';
  }

  if (activeDays >= 2 || messages >= 3) {
    return (texts.HERO_ACTIVE_WEEK || '')
      .replace('{days}', String(activeDays))
      .replace('{messages}', String(messages));
  }
  return texts.HERO_QUIET_WEEK || '';
}

export const SUMMARY_METRIC_DEFS = [
  {
    key: 'chat',
    icon: 'message-text-outline',
    labelKey: 'TILE_CHAT',
    getValue: (p) => p?.chat?.userMessages ?? 0,
    tintKey: 'primary',
  },
  {
    key: 'days',
    icon: 'calendar-blank-outline',
    labelKey: 'TILE_DAYS',
    getValue: (p) => p?.chat?.distinctActiveDays ?? 0,
    tintKey: 'accent',
  },
  {
    key: 'techniques',
    icon: 'head-heart-outline',
    labelKey: 'TILE_TECHNIQUES',
    getValue: (p) => p?.techniques?.totalUses ?? 0,
    tintKey: 'warm',
  },
  {
    key: 'tasks',
    icon: 'checkbox-marked-circle-outline',
    labelKey: 'TILE_TASKS',
    getValue: (p) => p?.tasks?.completedInPeriod ?? 0,
    tintKey: 'success',
  },
  {
    key: 'habits',
    icon: 'repeat',
    labelKey: 'TILE_HABITS',
    getValue: (p) => p?.habits?.completionsInPeriod ?? 0,
    tintKey: 'calm',
  },
  {
    key: 'journal',
    icon: 'notebook-outline',
    labelKey: 'TILE_JOURNAL',
    getValue: (p) => p?.journal?.entriesCount ?? 0,
    tintKey: 'journal',
  },
];
