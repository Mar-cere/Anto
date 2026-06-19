import {
  safeNonNegativeInt,
  safeHistoryLength,
  countPatternPeriodAlerts,
} from '../emergencyAlertsHistoryUtils';

describe('emergencyAlertsHistoryUtils', () => {
  describe('safeNonNegativeInt', () => {
    it('acepta números y strings numéricos', () => {
      expect(safeNonNegativeInt(5)).toBe(5);
      expect(safeNonNegativeInt('3')).toBe(3);
      expect(safeNonNegativeInt(1.9)).toBe(1);
    });

    it('devuelve fallback ante NaN, infinito o negativos', () => {
      expect(safeNonNegativeInt(NaN, 7)).toBe(7);
      expect(safeNonNegativeInt(Infinity)).toBe(0);
      expect(safeNonNegativeInt(-1, 2)).toBe(2);
    });
  });

  describe('safeHistoryLength', () => {
    it('solo cuenta arrays', () => {
      expect(safeHistoryLength([1, 2])).toBe(2);
      expect(safeHistoryLength(null)).toBe(0);
      expect(safeHistoryLength({ length: 3 })).toBe(0);
    });
  });

  describe('countPatternPeriodAlerts', () => {
    it('suma fin de semana y laborables', () => {
      expect(
        countPatternPeriodAlerts({
          timePatterns: { weekendVsWeekday: { weekend: 2, weekday: 1 } },
        })
      ).toBe(3);
    });

    it('toler entrada inválida', () => {
      expect(countPatternPeriodAlerts(null)).toBe(0);
      expect(countPatternPeriodAlerts([])).toBe(0);
      expect(countPatternPeriodAlerts({ timePatterns: {} })).toBe(0);
    });
  });
});
