import {
  buildInsightRowNavigation,
  buildInsightSourceChips,
  enrichInsightRows,
  extractInsightQuote,
  formatInsightPeriodLabel,
  formatInsightStrengthPct,
} from '../weeklyInsightUtils';

describe('weeklyInsightUtils', () => {
  it('formatInsightPeriodLabel humaniza semana ISO', () => {
    const label = formatInsightPeriodLabel({
      periodKey: '2026-W24',
      period: 'week',
      language: 'es',
    });
    expect(label).toMatch(/\d/);
    expect(label).toMatch(/–/);
    expect(label).not.toMatch(/W24/);
  });

  it('extractInsightQuote obtiene cita del detalle', () => {
    expect(extractInsightQuote('Cuando hablas de «Estuve muy nervioso», algo')).toBe(
      'Estuve muy nervioso',
    );
  });

  it('enrichInsightRows adjunta targetId desde correlaciones', () => {
    const rows = enrichInsightRows(
      [
        {
          type: 'topic_intervention',
          label: 'Tema e intervención',
          detail: 'En temas como soledad, Entender la Depresión suele encajar.',
        },
      ],
      [
        {
          type: 'topic_intervention',
          targetId: 'psychoeducation_depression',
          interventionLabel: 'Entender la Depresión',
          sourceLabel: 'soledad',
        },
      ],
    );
    expect(rows[0].targetId).toBe('psychoeducation_depression');
    expect(rows[0].quote).toBeNull();
  });

  it('buildInsightRowNavigation abre psicoeducación', () => {
    expect(buildInsightRowNavigation('psychoeducation_anxiety')).toEqual({
      screen: 'PsychoeducationModule',
      params: { topic: 'anxiety', graphTracked: true },
    });
  });

  it('formatInsightPeriodLabel humaniza mes calendario', () => {
    const label = formatInsightPeriodLabel({
      periodKey: '2026-06',
      period: 'month',
      language: 'es',
    });
    expect(label.toLowerCase()).toMatch(/junio/);
    expect(label).toMatch(/2026/);
  });

  it('enrichInsightRows extrae quote en concept_intervention', () => {
    const rows = enrichInsightRows(
      [
        {
          type: 'concept_intervention',
          label: 'Idea recurrente',
          detail: 'Cuando hablas de «Me siento abrumado», módulo X aparece.',
        },
      ],
      [],
    );
    expect(rows[0].quote).toBe('Me siento abrumado');
  });

  it('buildInsightSourceChips resume señales del período', () => {
    const chips = buildInsightSourceChips(
      { chatDaysActive: 4, typingCount: 12, phenotypeDaysWithData: 3 },
      {
        SOURCE_CHAT_DAYS: '{n} días en chat',
        SOURCE_TYPING: '{n} borradores',
        SOURCE_PHENOTYPE: '{n} señales',
      },
    );
    expect(chips).toHaveLength(3);
    expect(chips[0].label).toContain('4');
  });

  it('buildInsightRowNavigation abre la técnica concreta del catálogo', () => {
    expect(buildInsightRowNavigation('breathing_exercise')).toEqual({
      screen: 'BreathingExercise',
      params: { graphTracked: true },
    });
  });

  it('buildInsightRowNavigation cae al hub solo si el id es desconocido', () => {
    expect(buildInsightRowNavigation('unknown_intervention_xyz')).toEqual({
      screen: 'TherapeuticTechniques',
      params: {},
    });
  });

  it('buildInsightRowNavigation cubre ansiedad y depresión', () => {
    expect(buildInsightRowNavigation('psychoeducation_depression')?.params.topic).toBe('depression');
    expect(buildInsightRowNavigation('psychoeducation_anxiety')?.params.topic).toBe('anxiety');
    expect(buildInsightRowNavigation('psychoeducation_emotion_regulation')?.params.topic).toBe(
      'emotionRegulation',
    );
  });

  it('formatInsightStrengthPct acota porcentaje', () => {
    expect(formatInsightStrengthPct(0.42)).toBe(42);
    expect(formatInsightStrengthPct(undefined)).toBeNull();
  });
});
