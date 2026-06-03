import {
  hydrateInterventionSuggestion,
  isSafeHttpsUrl,
  normalizePsychoeducationTopic,
  parsePsychoeducationBrowseResponse,
  topicFromInterventionId,
} from '../psychoeducationTopic';
import { INTERVENTION_LABELS_EN } from '../../constants/interventionCatalogLabels.en';

describe('psychoeducationTopic', () => {
  it('normaliza topics con distintas capitalizaciones', () => {
    expect(normalizePsychoeducationTopic('Anxiety')).toBe('anxiety');
    expect(normalizePsychoeducationTopic('emotion-regulation')).toBe('emotionRegulation');
    expect(normalizePsychoeducationTopic('invalid')).toBeNull();
  });

  it('mapea interventionId a topic', () => {
    expect(topicFromInterventionId('psychoeducation_anger')).toBe('anger');
  });

  it('hidrata sugerencias sin cardVariant', () => {
    const out = hydrateInterventionSuggestion(
      { id: 'psychoeducation_anxiety', interventionType: 'psychoeducation' },
      'es',
    );
    expect(out.cardVariant).toBe('psychoeducation_native');
    expect(out.previewSummary).toMatch(/Qué es|apoyo/i);
    expect(out.params.topic).toBe('anxiety');
    expect(out.label).toBe('Ansiedad');
  });

  it('hidrata en inglés', () => {
    const out = hydrateInterventionSuggestion(
      { id: 'psychoeducation_anger', interventionType: 'psychoeducation' },
      'en',
    );
    expect(out.label).toMatch(/Anger/i);
  });

  it('hidrata tarjeta compacta en inglés con microSteps del servidor', () => {
    const out = hydrateInterventionSuggestion(
      {
        id: 'psychoeducation_anxiety',
        interventionType: 'psychoeducation',
        cardDisplayMode: 'compact',
        microSteps: [],
        previewTitle: 'Anxiety',
        params: { topic: 'anxiety' },
      },
      'en',
    );
    expect(out.cardDisplayMode).toBe('compact');
    expect(out.previewTitle).toMatch(/Anxiety/i);
  });

  it('traduce chips de técnicas en inglés (histórico)', () => {
    const out = hydrateInterventionSuggestion(
      { id: 'breathing_exercise', label: 'Ejercicio de Respiración' },
      'en',
    );
    expect(out.label).toBe(INTERVENTION_LABELS_EN.breathing_exercise);
  });

  it('solo acepta URLs https para fuentes', () => {
    expect(isSafeHttpsUrl('https://www.who.int')).toBe(true);
    expect(isSafeHttpsUrl('javascript:alert(1)')).toBe(false);
  });

  it('parsePsychoeducationBrowseResponse lee res.data (no res.data.data)', () => {
    const list = parsePsychoeducationBrowseResponse({
      success: true,
      data: [
        { topic: 'anxiety', title: 'Ansiedad', summary: 'Resumen' },
        { topic: 'invalid_topic' },
        'sleep',
      ],
    });
    expect(list).toHaveLength(2);
    expect(list[0].topic).toBe('anxiety');
    expect(list[1].topic).toBe('sleep');
  });

  it('parsePsychoeducationBrowseResponse devuelve [] si success false', () => {
    expect(parsePsychoeducationBrowseResponse({ success: false, error: 'x' })).toEqual([]);
  });

  it('conserva microSteps del servidor al hidratar', () => {
    const out = hydrateInterventionSuggestion(
      {
        id: 'psychoeducation_stress',
        interventionType: 'psychoeducation',
        microSteps: ['Paso A del servidor.', 'Paso B del servidor.'],
        params: { topic: 'stress' },
      },
      'es',
    );
    expect(out.microSteps).toEqual(['Paso A del servidor.', 'Paso B del servidor.']);
  });

  it('hidrata los 7 topics de psicoeducación', () => {
    const ids = [
      'psychoeducation_anxiety',
      'psychoeducation_depression',
      'psychoeducation_stress',
      'psychoeducation_anger',
      'psychoeducation_sleep',
      'psychoeducation_emotion_regulation',
      'psychoeducation_trauma',
    ];
    ids.forEach((id) => {
      const out = hydrateInterventionSuggestion({ id, interventionType: 'psychoeducation' }, 'es');
      expect(out.cardVariant).toBe('psychoeducation_native');
      expect(out.params.topic).toBeTruthy();
      expect(out.previewTitle).toBeTruthy();
    });
  });
});
