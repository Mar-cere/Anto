import {
  formatMonthKey,
  getMonthWindowFromKey,
  getPreviousMonthKey,
  normalizeMonthKey,
} from '../../../utils/monthKeys.js';

describe('monthKeys', () => {
  it('formatMonthKey valida año y mes', () => {
    expect(formatMonthKey(2025, 6)).toBe('2025-06');
    expect(formatMonthKey(2025, 0)).toBeNull();
    expect(formatMonthKey(2025, 13)).toBeNull();
  });

  it('getMonthWindowFromKey devuelve rango calendario local', () => {
    const window = getMonthWindowFromKey('2025-06');
    expect(window.monthKey).toBe('2025-06');
    expect(window.since.getFullYear()).toBe(2025);
    expect(window.since.getMonth()).toBe(5);
    expect(window.since.getDate()).toBe(1);
    expect(window.until.getMonth()).toBe(6);
    expect(window.until.getDate()).toBe(1);
  });

  it('normalizeMonthKey rechaza valores inválidos', () => {
    expect(normalizeMonthKey('2025-06')).toBe('2025-06');
    expect(normalizeMonthKey('2025-13', '2025-01')).toBe('2025-01');
    expect(normalizeMonthKey('bad', '2025-01')).toBe('2025-01');
  });

  it('getPreviousMonthKey retrocede un mes', () => {
    expect(getPreviousMonthKey(new Date(2025, 5, 15))).toBe('2025-05');
    expect(getPreviousMonthKey(new Date(2025, 0, 10))).toBe('2024-12');
  });
});
