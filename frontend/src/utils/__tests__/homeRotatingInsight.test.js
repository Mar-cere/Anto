import {
  buildHomeInsightCandidates,
  homeInsightRotationSeed,
  pickHomeRotatingInsight,
} from '../homeRotatingInsight';

describe('homeRotatingInsight', () => {
  it('arma candidatos desde patrones, resumen y mapa', () => {
    const candidates = buildHomeInsightCandidates({
      weeklyPayload: {
        insight: {
          status: 'ready',
          headline: 'Más calma los jueves',
          insights: [{ detail: 'Notaste más calma los jueves después del chat.' }],
        },
      },
      summaryPayload: {
        narrative: {
          microWins: 'Solés sentirte mejor después de hablar de tu día.',
          themes: 'Temas recurrentes alrededor del trabajo.',
        },
      },
      graphPayload: {
        correlations: [
          {
            type: 'topic_intervention',
            sourceKind: 'topicTag',
            sourceId: 'ansiedad',
            interventionLabel: 'Respiración',
          },
        ],
      },
      graphTexts: {
        INSIGHT_TOPIC_INTERVENTION: 'Cuando aparece {topic}, suele ayudarte {intervention}',
      },
      language: 'es',
    });

    expect(candidates.length).toBeGreaterThanOrEqual(3);
    expect(candidates.some((c) => c.source === 'weekly')).toBe(true);
    expect(candidates.some((c) => c.source === 'summary')).toBe(true);
    expect(candidates.some((c) => c.source === 'graph')).toBe(true);
  });

  it('rota de forma estable con la misma semilla', () => {
    const candidates = [
      { id: 'a', text: 'Insight A', source: 'weekly', ctaKey: 'HOME_INSIGHT_CTA_WEEKLY' },
      { id: 'b', text: 'Insight B', source: 'summary', ctaKey: 'HOME_INSIGHT_CTA_SUMMARY' },
    ];
    const seed = homeInsightRotationSeed('2026-06-19');
    const first = pickHomeRotatingInsight(candidates, seed);
    const second = pickHomeRotatingInsight(candidates, seed);
    expect(first).toEqual(second);
  });

  it('no devuelve candidatos vacíos', () => {
    expect(buildHomeInsightCandidates({})).toEqual([]);
    expect(pickHomeRotatingInsight([], 'seed')).toBeNull();
  });
});
