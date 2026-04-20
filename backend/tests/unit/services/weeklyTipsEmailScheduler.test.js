import { describe, it, expect } from '@jest/globals';
import {
  matchesWeeklyTipsUtcWindow,
  resolveWeeklyTipsMailEnv,
} from '../../../services/weeklyTipsEmailScheduler.js';

describe('resolveWeeklyTipsMailEnv', () => {
  it('sunday_morning usa domingo 10h UTC por defecto', () => {
    const r = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WEEKDAY).toBe('0');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_HOUR).toBe('10');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WINDOW_END_MINUTE).toBe('45');
  });

  it('saturday_night usa sábado 23h UTC por defecto', () => {
    const r = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'saturday_night' });
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WEEKDAY).toBe('6');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_HOUR).toBe('23');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WINDOW_END_MINUTE).toBe('59');
  });

  it('permite sobrescribir la hora del slot', () => {
    const r = resolveWeeklyTipsMailEnv({
      WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning',
      WEEKLY_TIPS_EMAIL_UTC_HOUR: '12',
    });
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WEEKDAY).toBe('0');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_HOUR).toBe('12');
  });
});

describe('matchesWeeklyTipsUtcWindow', () => {
  it('domingo 10:05 UTC con slot sunday_morning', () => {
    const env = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    const d = new Date('2025-01-05T10:05:00.000Z');
    expect(matchesWeeklyTipsUtcWindow(d, env)).toBe(true);
  });

  it('sábado 23:05 UTC con slot saturday_night', () => {
    const env = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'saturday_night' });
    const d = new Date('2025-01-04T23:05:00.000Z');
    expect(matchesWeeklyTipsUtcWindow(d, env)).toBe(true);
  });

  it('false fuera de minutos de ventana (domingo)', () => {
    const env = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    const d = new Date('2025-01-05T10:50:00.000Z');
    expect(matchesWeeklyTipsUtcWindow(d, env)).toBe(false);
  });

  it('false otro día con slot sunday_morning', () => {
    const env = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    const d = new Date('2025-01-06T10:05:00.000Z');
    expect(matchesWeeklyTipsUtcWindow(d, env)).toBe(false);
  });
});
