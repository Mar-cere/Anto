import { cosineSimilarity } from '../../../utils/vectorMath.js';

describe('vectorMath', () => {
  it('cosineSimilarity devuelve 1 para vectores idénticos', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('cosineSimilarity devuelve 0 para vectores ortogonales', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('cosineSimilarity tolera entradas inválidas', () => {
    expect(cosineSimilarity(null, [1])).toBe(0);
    expect(cosineSimilarity([1, 2], [1])).toBe(0);
  });
});
