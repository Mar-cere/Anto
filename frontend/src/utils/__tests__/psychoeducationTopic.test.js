import {
  hydrateInterventionSuggestion,
  isSafeHttpsUrl,
  normalizePsychoeducationTopic,
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
});
