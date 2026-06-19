import {
  buildSummaryHeroCopy,
  countSummaryActivity,
  formatSummaryPulseLine,
  isSummaryEmpty,
  SUMMARY_METRIC_DEFS,
} from '../summaryScreenUtils';

describe('summaryScreenUtils', () => {
  const texts = {
    TIMES_SINGULAR: 'vez',
    TIMES_PLURAL: 'veces',
    HERO_ACTIVE_WEEK: 'Activo {days} días · {messages} mensajes',
    HERO_QUIET_WEEK: 'Semana tranquila',
    HERO_ACTIVE_MONTH: 'Mes con {days} días activos',
    HERO_QUIET_MONTH: 'Mes tranquilo',
  };

  it('isSummaryEmpty detecta período sin actividad', () => {
    expect(isSummaryEmpty(null)).toBe(true);
    expect(isSummaryEmpty({ chat: { userMessages: 0, distinctActiveDays: 0 } })).toBe(true);
    expect(isSummaryEmpty({ chat: { userMessages: 1, distinctActiveDays: 0 } })).toBe(false);
  });

  it('formatSummaryPulseLine formatea emoción principal', () => {
    const line = formatSummaryPulseLine(
      { emotions: { insightsEmotionsTop: [{ emotion: 'Calma', count: 2 }] } },
      texts,
    );
    expect(line).toBe('Calma · 2 veces');
  });

  it('buildSummaryHeroCopy elige copy activo o tranquilo', () => {
    expect(
      buildSummaryHeroCopy({
        payload: { chat: { distinctActiveDays: 3, userMessages: 10 } },
        granularity: 'week',
        texts,
      }),
    ).toBe('Activo 3 días · 10 mensajes');
    expect(
      buildSummaryHeroCopy({
        payload: { chat: { distinctActiveDays: 0, userMessages: 0 } },
        granularity: 'week',
        texts,
      }),
    ).toBe('Semana tranquila');
  });

  it('countSummaryActivity suma todas las fuentes', () => {
    expect(
      countSummaryActivity({
        chat: { userMessages: 2, distinctActiveDays: 1 },
        techniques: { totalUses: 1 },
        tasks: { completedInPeriod: 0 },
        habits: { completionsInPeriod: 0 },
        journal: { entriesCount: 0 },
      }),
    ).toBe(4);
  });

  it('SUMMARY_METRIC_DEFS cubre las seis métricas del grid', () => {
    expect(SUMMARY_METRIC_DEFS).toHaveLength(6);
    expect(SUMMARY_METRIC_DEFS.map((m) => m.key)).toEqual([
      'chat',
      'days',
      'techniques',
      'tasks',
      'habits',
      'journal',
    ]);
  });

  it('buildSummaryHeroCopy usa rama mensual', () => {
    expect(
      buildSummaryHeroCopy({
        payload: { chat: { distinctActiveDays: 5, userMessages: 20 } },
        granularity: 'month',
        texts: {
          HERO_ACTIVE_MONTH: 'Mes {days}/{messages}',
          HERO_QUIET_MONTH: 'Mes quieto',
          HERO_QUIET_WEEK: 'Semana tranquila',
        },
      }),
    ).toBe('Mes 5/20');
  });
});
