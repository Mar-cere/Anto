import { describe, it, expect } from '@jest/globals';
import {
  calendarWeekRangeFromAnchor,
  calendarMonthRange,
  isWithinWeeklyNarrativeLlmWindow,
  buildDeterministicNarrative,
  formatPeriodLabel,
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

describe('userSummaryService i18n helpers', () => {
  const sampleSummary = {
    emotions: {
      progressTopicsTop: [{ topic: 'general', count: 3 }],
      insightsEmotionsTop: [],
    },
    chat: { distinctActiveDays: 1, userMessages: 3 },
    tasks: { completedInPeriod: 0 },
    habits: { completionsInPeriod: 0 },
  };

  it('buildDeterministicNarrative: genera texto en español', () => {
    const narrative = buildDeterministicNarrative(sampleSummary, 'es');
    expect(narrative.themes).toMatch(/general/i);
    expect(narrative.microWins).toMatch(/enviaste 3 mensajes/i);
    expect(narrative.nextQuestion).toMatch(/micro-hábito/i);
  });

  it('buildDeterministicNarrative: genera texto en inglés', () => {
    const narrative = buildDeterministicNarrative(sampleSummary, 'en');
    expect(narrative.themes).toMatch(/general/i);
    expect(narrative.microWins).toMatch(/sent 3 messages/i);
    expect(narrative.nextQuestion).toMatch(/micro-habit/i);
  });

  it('formatPeriodLabel: usa locale según idioma', () => {
    const start = new Date(2026, 3, 27);
    const end = new Date(2026, 4, 3);
    const esLabel = formatPeriodLabel(start, end, 'week', 'es');
    const enLabel = formatPeriodLabel(start, end, 'week', 'en');
    expect(esLabel).toMatch(/abr/i);
    expect(enLabel).toMatch(/Apr/i);
  });
});
