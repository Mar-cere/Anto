import { describe, it, expect } from '@jest/globals';
import {
  matchesWeeklyTipsUtcWindow,
  resolveWeeklyTipsMailEnv,
} from '../../../services/weeklyTipsEmailScheduler.js';

describe('resolveWeeklyTipsMailEnv', () => {
  it('usa sunday_morning por defecto cuando no viene slot', () => {
    const r = resolveWeeklyTipsMailEnv({});
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WEEKDAY).toBe('0');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_HOUR).toBe('10');
  });

  it('sunday_morning usa domingo 10h UTC por defecto', () => {
    const r = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WEEKDAY).toBe('0');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_HOUR).toBe('10');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WINDOW_END_MINUTE).toBe('59');
  });

  it('monday_morning usa lunes 10h UTC y ventana hasta :59', () => {
    const r = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'monday_morning' });
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WEEKDAY).toBe('1');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_HOUR).toBe('10');
    expect(r.WEEKLY_TIPS_EMAIL_UTC_WINDOW_END_MINUTE).toBe('59');
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

  it('false fuera de hora de ventana (domingo 11h UTC, slot 10h)', () => {
    const env = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    const d = new Date('2025-01-05T11:00:00.000Z');
    expect(matchesWeeklyTipsUtcWindow(d, env)).toBe(false);
  });

  it('domingo 10:55 UTC sigue dentro de ventana sunday_morning (:59)', () => {
    const env = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    const d = new Date('2025-01-05T10:55:00.000Z');
    expect(matchesWeeklyTipsUtcWindow(d, env)).toBe(true);
  });

  it('false otro día con slot sunday_morning', () => {
    const env = resolveWeeklyTipsMailEnv({ WEEKLY_TIPS_EMAIL_SLOT: 'sunday_morning' });
    const d = new Date('2025-01-06T10:05:00.000Z');
    expect(matchesWeeklyTipsUtcWindow(d, env)).toBe(false);
  });
});
