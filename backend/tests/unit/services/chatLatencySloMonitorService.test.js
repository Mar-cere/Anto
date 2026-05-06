import { describe, expect, it } from '@jest/globals';
import { calcPercentile } from '../../../services/chatLatencySloMonitorService.js';

describe('chatLatencySloMonitorService', () => {
  it('calcPercentile retorna null con lista vacía', () => {
    expect(calcPercentile([], 95)).toBe(null);
    expect(calcPercentile(null, 95)).toBe(null);
  });

  it('calcPercentile calcula p95 con índice estable', () => {
    const samples = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    // Con la fórmula usada (ceil(p*n)-1), p95 en 10 elementos -> idx=9 => 100
    expect(calcPercentile(samples, 95)).toBe(100);
    expect(calcPercentile(samples, 50)).toBe(50);
  });
});

