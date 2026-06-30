import {
  formatGraphHumanStatus,
  formatGraphMeta,
  formatGraphMetrics,
  formatGraphRates,
  formatGraphRowContext,
  formatGraphListInterventionTitle,
  resolveGraphEdgeTopicLabel,
  formatCorrelationInsight,
  stripTechnicalInterventionSuffix,
} from '../interventionGraphTexts';

const TEXTS = {
  META: 'Basado en tu actividad de los últimos {days} días',
  METRICS: 'mostradas {shown} · clic {clicked} · descartadas {dismissed} · hechas {completed}',
  RATES: 'CTR {ctr} · completación {completion}',
  ROW_CONTEXT: 'Cuando hablas de {topic}',
  STATUS_COMPLETED: 'Ya lo probaste y lo completaste',
  STATUS_COMPLETED_REPEAT: 'Lo completaste {n} veces',
  STATUS_EXPLORED: 'Lo abriste para explorarlo',
  STATUS_DISMISSED: 'Lo descartaste en su momento',
  STATUS_SUGGESTED: 'Te lo sugerimos en el chat',
  STATUS_NOT_YET: 'Aún no la has probado — puedes abrirla cuando quieras',
};

describe('interventionGraphTexts', () => {
  it('formatGraphMeta sustituye días', () => {
    expect(formatGraphMeta(TEXTS, 30)).toBe('Basado en tu actividad de los últimos 30 días');
  });

  it('formatGraphMetrics sustituye contadores (interno)', () => {
    expect(
      formatGraphMetrics(TEXTS, {
        shown: 4,
        clicked: 2,
        dismissed: 1,
        completed: 1,
      }),
    ).toBe('mostradas 4 · clic 2 · descartadas 1 · hechas 1');
  });

  it('formatGraphRates usa pctFn (interno)', () => {
    const pct = (n) => `${Math.round(n * 100)}%`;
    expect(
      formatGraphRates(TEXTS, { ctr: 0.5, completionRate: 0.25 }, pct),
    ).toBe('CTR 50% · completación 25%');
  });

  it('formatGraphRowContext humaniza el tema', () => {
    expect(formatGraphRowContext(TEXTS, 'ansiedad persistente')).toBe(
      'Cuando hablas de ansiedad persistente',
    );
  });

  it('formatGraphHumanStatus prioriza completado', () => {
    expect(
      formatGraphHumanStatus(TEXTS, { shown: 2, clicked: 2, dismissed: 0, completed: 1 }),
    ).toBe('Ya lo probaste y lo completaste');
    expect(
      formatGraphHumanStatus(TEXTS, { shown: 3, clicked: 3, dismissed: 0, completed: 3 }),
    ).toBe('Lo completaste 3 veces');
    expect(formatGraphHumanStatus(TEXTS, { shown: 1, clicked: 1, completed: 0 })).toBe(
      'Lo abriste para explorarlo',
    );
    expect(formatGraphHumanStatus(TEXTS, { shown: 1, clicked: 0, dismissed: 1 })).toBe(
      'Lo descartaste en su momento',
    );
    expect(formatGraphHumanStatus(TEXTS, { shown: 0, clicked: 0, dismissed: 0 })).toBe(
      TEXTS.STATUS_NOT_YET,
    );
  });

  it('resolveGraphEdgeTopicLabel prioriza displayLabel', () => {
    expect(
      resolveGraphEdgeTopicLabel(
        { topicFree: 'raw', displayLabel: 'Lucha interna y falta de motivación' },
        'es',
      ),
    ).toBe('Lucha interna y falta de motivación');
  });

  it('formatGraphListInterventionTitle quita sufijos técnicos', () => {
    expect(
      formatGraphListInterventionTitle('Enojo e ira (psicoeducación)', 'psychoeducation_anger'),
    ).toMatch(/Enojo e ira/);
    expect(formatGraphListInterventionTitle('Enojo e ira (psicoeducación)', 'psychoeducation_anger')).not.toMatch(
      /psicoeducación/i,
    );
  });

  it('stripTechnicalInterventionSuffix quita etiquetas internas', () => {
    expect(stripTechnicalInterventionSuffix('Entender la Depresión (psicoeducación)')).toBe(
      'Entender la Depresión',
    );
  });

  it('formatCorrelationInsight ignora personal-pattern', () => {
    expect(
      formatCorrelationInsight(
        { INSIGHT_CONCEPT_INTERVENTION: '{concept} → {intervention}' },
        {
          type: 'concept_intervention',
          sourceLabel: 'Calma',
          targetId: 'personal-pattern',
          interventionLabel: 'personal-pattern',
        },
      ),
    ).toBe('');
  });
});
