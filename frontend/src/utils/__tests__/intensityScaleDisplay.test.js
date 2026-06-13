import {
  formatScaleDelta,
  getDeltaTone,
  scaleFillPercent,
} from '../intensityScaleDisplay';

describe('intensityScaleDisplay', () => {
  it('calcula porcentaje de escala 1–10', () => {
    expect(scaleFillPercent(1, 1, 10)).toBe(0);
    expect(scaleFillPercent(10, 1, 10)).toBe(100);
    expect(scaleFillPercent(5.5, 1, 10)).toBe(50);
  });

  it('formatea delta con signo', () => {
    expect(formatScaleDelta(2)).toBe('+2');
    expect(formatScaleDelta(-1)).toBe('-1');
    expect(formatScaleDelta(0)).toBe('0');
  });

  it('interpreta tono según modo', () => {
    expect(getDeltaTone(1, 'higher-is-better')).toBe('positive');
    expect(getDeltaTone(-1, 'higher-is-better')).toBe('negative');
    expect(getDeltaTone(-2, 'lower-is-better')).toBe('positive');
    expect(getDeltaTone(0)).toBe('neutral');
  });
});
