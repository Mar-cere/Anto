import {
  isValidPsychoeducationTopic,
  normalizePsychoeducationTopic,
} from '../../../constants/psychoeducationTopicNormalize.js';
import { getPsychoeducationModule } from '../../../constants/psychoeducation.js';
import { PSYCHOEDUCATION_TOPIC_ORDER } from '../../../constants/psychoeducationTopics.js';

describe('psychoeducationTopicNormalize', () => {
  it('normaliza variantes de emotionRegulation', () => {
    expect(normalizePsychoeducationTopic('Emotion-Regulation')).toBe('emotionRegulation');
    expect(normalizePsychoeducationTopic('emotionregulation')).toBe('emotionRegulation');
  });

  it('rechaza topics desconocidos', () => {
    expect(normalizePsychoeducationTopic('')).toBeNull();
    expect(normalizePsychoeducationTopic('bipolar')).toBeNull();
    expect(isValidPsychoeducationTopic('foo')).toBe(false);
  });

  it('cada topic del catálogo resuelve módulo ES', () => {
    PSYCHOEDUCATION_TOPIC_ORDER.forEach((topic) => {
      expect(getPsychoeducationModule(topic, 'es')?.topic).toBe(topic);
      expect(getPsychoeducationModule(topic.toUpperCase(), 'es')?.topic).toBe(topic);
    });
  });
});
