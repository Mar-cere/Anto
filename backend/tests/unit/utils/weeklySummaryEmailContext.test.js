import { describe, it, expect } from '@jest/globals';
import {
  buildWeeklySummaryEmailContext,
  buildWeeklySummarySubjectLine,
  escapeHtmlText,
  weeklyEmailSubjectIndex
} from '../../../utils/weeklySummaryEmailContext.js';

describe('escapeHtmlText', () => {
  it('escapa caracteres HTML', () => {
    expect(escapeHtmlText('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtmlText('a & b')).toBe('a &amp; b');
  });
});

describe('weeklyEmailSubjectIndex / buildWeeklySummarySubjectLine', () => {
  it('rota asunto según semana ISO sin datos personales', () => {
    const w = 'Semana 16 · 2026';
    const i = weeklyEmailSubjectIndex(2026, 16);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(7);
    const s = buildWeeklySummarySubjectLine(w, 2026, 16);
    expect(s.startsWith(w)).toBe(true);
    expect(s).toContain('Anto');
    expect(s).not.toMatch(/\d+ mensajes|\d+ tareas/i);
  });
});

describe('buildWeeklySummaryEmailContext', () => {
  it('incluye preheader, beneficios y cierre sin filtrar stats del usuario', () => {
    const ctx = buildWeeklySummaryEmailContext(
      {
        name: 'María',
        username: 'maria',
        stats: { tasksCompleted: 99, habitsStreak: 9, totalSessions: 50, lastActive: new Date() },
        createdAt: new Date(Date.now() - 20 * 86400000),
        subscription: { status: 'premium' }
      },
      { isoWeekYear: 2026, isoWeek: 16, yearWeekKey: '2026-W16' }
    );
    expect(ctx.displayName).toBe('María');
    expect(ctx.weekLabel).toBe('Semana 16 · 2026');
    expect(ctx.preheaderText.length).toBeGreaterThan(10);
    expect(ctx.benefitLines).toHaveLength(2);
    expect(ctx.updatesSectionTitle).toBe('Novedades de la semana');
    expect(ctx.updatesIntro.length).toBeGreaterThan(20);
    expect(ctx.updatesLines).toHaveLength(6);
    expect(ctx.updatesLines.join(' ')).toMatch(
      /resumen|chat|notificaciones|tareas|hábitos|pomodoro|tema claro/i
    );
    expect(ctx.closingLine).toMatch(/Anto|acompañarte/i);
    expect(ctx.subjectLine).not.toContain('99');
    expect(ctx.leadParagraph).toMatch(/ritmo|semana/i);
  });

  it('usa username si no hay nombre', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'solo_user', stats: {}, subscription: { status: 'free' } },
      { isoWeekYear: 2026, isoWeek: 1, yearWeekKey: '2026-W01' }
    );
    expect(ctx.displayName).toBe('solo_user');
  });
});
