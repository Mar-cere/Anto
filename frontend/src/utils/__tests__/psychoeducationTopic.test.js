import {
  hydratePsychoeducationSuggestion,
  isSafeHttpsUrl,
  normalizePsychoeducationTopic,
  topicFromInterventionId,
} from '../psychoeducationTopic';

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
    const out = hydratePsychoeducationSuggestion(
      { id: 'psychoeducation_anxiety', interventionType: 'psychoeducation' },
      'es',
    );
    expect(out.cardVariant).toBe('psychoeducation_native');
    expect(out.previewSummary).toMatch(/Qué es|apoyo/i);
    expect(out.params.topic).toBe('anxiety');
  });

  it('solo acepta URLs https para fuentes', () => {
    expect(isSafeHttpsUrl('https://www.who.int')).toBe(true);
    expect(isSafeHttpsUrl('javascript:alert(1)')).toBe(false);
  });
});
