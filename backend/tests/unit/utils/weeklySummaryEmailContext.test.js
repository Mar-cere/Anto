import { describe, it, expect } from '@jest/globals';
import {
  buildWeeklySummaryEmailContext,
  escapeHtmlText,
  formatLastActiveEs,
  formatSubscriptionLabelEs,
  formatTenureEs
} from '../../../utils/weeklySummaryEmailContext.js';

describe('escapeHtmlText', () => {
  it('escapa caracteres HTML', () => {
    expect(escapeHtmlText('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtmlText('a & b')).toBe('a &amp; b');
  });
});

describe('formatLastActiveEs', () => {
  it('devuelve null si no hay fecha', () => {
    expect(formatLastActiveEs(null)).toBe(null);
  });

  it('describe hace N días', () => {
    const d = new Date(Date.now() - 3 * 86400000);
    expect(formatLastActiveEs(d)).toMatch(/hace 3 días/);
  });
});

describe('formatTenureEs', () => {
  it('describe recién registrado', () => {
    const d = new Date(Date.now() - 2 * 3600000);
    expect(formatTenureEs(d)).toMatch(/recientemente|Empezaste/);
  });
});

describe('formatSubscriptionLabelEs', () => {
  it('mapea estados', () => {
    expect(formatSubscriptionLabelEs('premium')).toBe('Plan premium');
    expect(formatSubscriptionLabelEs('unknown')).toBe(null);
  });
});

describe('buildWeeklySummaryEmailContext', () => {
  it('arma contexto con nombre y stats', () => {
    const ctx = buildWeeklySummaryEmailContext(
      {
        name: 'María',
        username: 'maria',
        stats: {
          tasksCompleted: 4,
          habitsStreak: 2,
          totalSessions: 10,
          lastActive: new Date()
        },
        createdAt: new Date(Date.now() - 20 * 86400000),
        subscription: { status: 'premium' }
      },
      { isoWeekYear: 2026, isoWeek: 16, yearWeekKey: '2026-W16' }
    );
    expect(ctx.displayName).toBe('María');
    expect(ctx.weekLabel).toBe('Semana 16 · 2026');
    expect(ctx.subjectLine).toContain('2026');
    expect(ctx.snapshotLines.some((l) => l.includes('4'))).toBe(true);
    expect(ctx.planLine).toContain('premium');
  });

  it('usa username si no hay nombre', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'solo_user', stats: {}, subscription: { status: 'free' } },
      { isoWeekYear: 2026, isoWeek: 1, yearWeekKey: '2026-W01' }
    );
    expect(ctx.displayName).toBe('solo_user');
  });
});
