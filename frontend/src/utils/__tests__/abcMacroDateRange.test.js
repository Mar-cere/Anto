import { getDefaultAbcMacroDateRange } from '../abcMacroDateRange';

describe('getDefaultAbcMacroDateRange (#212)', () => {
  it('devuelve ventana de 90 días', () => {
    const ref = new Date('2026-06-15T12:00:00.000Z');
    const { startDate, endDate } = getDefaultAbcMacroDateRange(ref);
    expect(endDate).toBe('2026-06-15');
    expect(startDate).toBe('2026-03-17');
  });
});
