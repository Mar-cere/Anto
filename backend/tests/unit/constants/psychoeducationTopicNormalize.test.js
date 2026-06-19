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

  it('normaliza variantes de módulos avanzados (#90–#92)', () => {
    expect(normalizePsychoeducationTopic('depression-advanced')).toBe('depressionAdvanced');
    expect(normalizePsychoeducationTopic('anxietyAdvanced')).toBe('anxietyAdvanced');
    expect(normalizePsychoeducationTopic('estres-laboral')).toBe('workStress');
    expect(normalizePsychoeducationTopic('work_stress')).toBe('workStress');
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
