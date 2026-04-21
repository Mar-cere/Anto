import { describe, it, expect } from '@jest/globals';
import {
  calendarWeekRangeFromAnchor,
  calendarMonthRange
} from '../../../services/userSummaryService.js';

describe('userSummaryService period helpers', () => {
  it('calendarWeekRangeFromAnchor: semana lunes–domingo que contiene un martes', () => {
    const anchor = new Date(2026, 3, 21);
    const { start, end } = calendarWeekRangeFromAnchor(anchor);
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(20);
    expect(start.getMonth()).toBe(3);
    expect(end.getDay()).toBe(0);
    expect(end.getDate()).toBe(26);
  });

  it('calendarMonthRange: abril 2026', () => {
    const { start, end } = calendarMonthRange(2026, 4);
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(30);
  });
});
