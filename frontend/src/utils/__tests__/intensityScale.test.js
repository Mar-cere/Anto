import { buildScaleValues } from '../../utils/intensityScale';

describe('buildScaleValues', () => {
  it('genera 1–10 por defecto', () => {
    expect(buildScaleValues({ min: 1, max: 10, step: 1 })).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('respeta valores explícitos (SUDS)', () => {
    expect(buildScaleValues({ values: [0, 50, 100] })).toEqual([0, 50, 100]);
  });
});
