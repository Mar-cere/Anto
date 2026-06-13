import {
  formatMonthKey,
  getPreviousMonthKey,
  normalizeMonthKey,
  resolveMonthlyInsightKey,
} from '../monthKeys';

describe('monthKeys', () => {
  it('formatMonthKey valida año y mes', () => {
    expect(formatMonthKey(2025, 6)).toBe('2025-06');
    expect(formatMonthKey(2025, 0)).toBeNull();
  });

  it('normalizeMonthKey acepta mes sin cero inicial', () => {
    expect(normalizeMonthKey('2026-6')).toBe('2026-06');
    expect(normalizeMonthKey('invalid', null)).toBeNull();
  });

  it('resolveMonthlyInsightKey prioriza param, luego year/month y fallback', () => {
    expect(resolveMonthlyInsightKey('2026-6')).toBe('2026-06');
    expect(resolveMonthlyInsightKey(null, { year: 2026, month: 5 })).toBe('2026-05');
    expect(resolveMonthlyInsightKey('bad', { year: 2026, month: 5 })).toBe('2026-05');
    expect(resolveMonthlyInsightKey(null, {})).toBe(getPreviousMonthKey());
  });
});
