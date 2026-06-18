import { dailyMoodApiCopy } from '../../../utils/dailyMoodApiCopy.js';
import { hasSpanishVoseo } from '../../../utils/copyToneGuards.mjs';

describe('dailyMoodApiCopy', () => {
  const KEYS = ['rateLimit', 'todayError', 'saveError', 'invalidMood'];

  it('expone las mismas claves en es y en', () => {
    const es = dailyMoodApiCopy('es');
    const en = dailyMoodApiCopy('en');
    expect(Object.keys(es).sort()).toEqual(KEYS.sort());
    expect(Object.keys(en).sort()).toEqual(KEYS.sort());
  });

  it('es: sin voseo ni cadenas vacías', () => {
    const es = dailyMoodApiCopy('es');
    for (const key of KEYS) {
      expect(es[key].trim().length).toBeGreaterThan(0);
      expect(hasSpanishVoseo(es[key])).toBe(false);
    }
  });

  it('en: mensajes en inglés', () => {
    const en = dailyMoodApiCopy('en');
    expect(en.saveError).toMatch(/could not save/i);
    expect(en.todayError).toMatch(/could not load/i);
  });
});
