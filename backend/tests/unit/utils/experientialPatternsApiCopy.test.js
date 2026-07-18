import { experientialPatternsApiCopy } from '../../../utils/experientialPatternsApiCopy.js';

describe('experientialPatternsApiCopy', () => {
  it('expone las mismas claves en es y en', () => {
    const es = experientialPatternsApiCopy('es');
    const en = experientialPatternsApiCopy('en');
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it('usa español por defecto', () => {
    expect(experientialPatternsApiCopy().featureDisabled).toMatch(/memoria/i);
  });
});
