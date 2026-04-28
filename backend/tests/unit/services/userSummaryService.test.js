import { describe, it, expect } from '@jest/globals';
import {
  calendarWeekRangeFromAnchor,
  calendarMonthRange,
  isWithinWeeklyNarrativeLlmWindow
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

  it('isWithinWeeklyNarrativeLlmWindow: true dentro de 36h por defecto', () => {
    const now = new Date('2026-04-28T12:00:00.000Z');
    const sentAt = new Date('2026-04-27T06:30:00.000Z');
    expect(isWithinWeeklyNarrativeLlmWindow(sentAt, now)).toBe(true);
  });

  it('isWithinWeeklyNarrativeLlmWindow: false fuera de ventana', () => {
    const now = new Date('2026-04-28T12:00:00.000Z');
    const sentAt = new Date('2026-04-26T23:00:00.000Z');
    expect(isWithinWeeklyNarrativeLlmWindow(sentAt, now)).toBe(false);
  });
});
