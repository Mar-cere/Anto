import {
  resolveTopicFreeDisplayLabel,
  summarizeGraphSourceLabel,
} from '../graphSourceLabel';

describe('graphSourceLabel (frontend)', () => {
  it('resume snippet sin contexto en español', () => {
    expect(summarizeGraphSourceLabel('No se solo me siento muy abrumado')).toBe(
      'Me siento muy abrumado',
    );
  });

  it('usa displayLabel del API cuando existe', () => {
    const label = resolveTopicFreeDisplayLabel('raw text', [
      { topicFree: 'raw text', displayLabel: 'Sensación de agobio' },
    ]);
    expect(label).toBe('Sensación de agobio');
  });
});
