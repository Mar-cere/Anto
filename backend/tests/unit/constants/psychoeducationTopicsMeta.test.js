import {
  PSYCHOEDUCATION_TOPIC_META,
  PSYCHOEDUCATION_TOPIC_ORDER,
  getPsychoeducationCardFields,
} from '../../../constants/psychoeducationTopics.js';

describe('psychoeducationTopics meta (#78)', () => {
  it.each(PSYCHOEDUCATION_TOPIC_ORDER)(
    'topic %s tiene 2 micro-pasos es/en',
    (topic) => {
      const meta = PSYCHOEDUCATION_TOPIC_META[topic];
      expect(meta.chatMicroStepsEs?.length).toBe(2);
      expect(meta.chatMicroStepsEn?.length).toBe(2);
      meta.chatMicroStepsEs.forEach((s) => expect(s.trim().length).toBeGreaterThan(10));
      meta.chatMicroStepsEn.forEach((s) => expect(s.trim().length).toBeGreaterThan(10));
    },
  );

  it('getPsychoeducationCardFields expone microSteps en es y en', () => {
    const es = getPsychoeducationCardFields('stress', 'es');
    const en = getPsychoeducationCardFields('stress', 'en');
    expect(es.microSteps).toHaveLength(2);
    expect(en.microSteps).toHaveLength(2);
    expect(es.microSteps[0]).not.toBe(en.microSteps[0]);
  });
});
