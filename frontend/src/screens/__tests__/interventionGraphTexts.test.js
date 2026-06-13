import {
  formatGraphMeta,
  formatGraphMetrics,
  formatGraphRates,
} from '../interventionGraphTexts';

const TEXTS = {
  META: 'Ventana: últimos {days} días',
  METRICS: 'mostradas {shown} · clic {clicked} · descartadas {dismissed} · hechas {completed}',
  RATES: 'CTR {ctr} · completación {completion}',
};

describe('interventionGraphTexts', () => {
  it('formatGraphMeta sustituye días', () => {
    expect(formatGraphMeta(TEXTS, 30)).toBe('Ventana: últimos 30 días');
  });

  it('formatGraphMetrics sustituye contadores', () => {
    expect(
      formatGraphMetrics(TEXTS, {
        shown: 4,
        clicked: 2,
        dismissed: 1,
        completed: 1,
      }),
    ).toBe('mostradas 4 · clic 2 · descartadas 1 · hechas 1');
  });

  it('formatGraphRates usa pctFn', () => {
    const pct = (n) => `${Math.round(n * 100)}%`;
    expect(
      formatGraphRates(TEXTS, { ctr: 0.5, completionRate: 0.25 }, pct),
    ).toBe('CTR 50% · completación 25%');
  });

  it('formatGraphMeta y métricas en inglés', () => {
    const enTexts = {
      META: 'Window: last {days} days · per-session metrics (shown/click/done)',
      METRICS: 'shown {shown} · click {clicked} · dismissed {dismissed} · done {completed}',
      RATES: 'CTR {ctr} · completion {completion}',
    };
    expect(formatGraphMeta(enTexts, 30)).toBe(
      'Window: last 30 days · per-session metrics (shown/click/done)',
    );
    expect(
      formatGraphMetrics(enTexts, { shown: 2, clicked: 1, dismissed: 0, completed: 1 }),
    ).toBe('shown 2 · click 1 · dismissed 0 · done 1');
  });
});
