import { describe, it, expect } from '@jest/globals';
import {
  buildWeeklySummaryEmailContext,
  buildWeeklySummarySubjectLine,
  escapeHtmlText,
  getWeeklySummarySubjectVariantCount,
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
    expect(i).toBeLessThan(getWeeklySummarySubjectVariantCount());
    const s = buildWeeklySummarySubjectLine(w, 2026, 16);
    expect(s.startsWith(w)).toBe(true);
    expect(s).toContain('Anto');
    expect(s).not.toMatch(/\d+ mensajes|\d+ tareas/i);
  });

  it('buildWeeklySummaryEmailContext en inglés usa weekLabel y asunto EN', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'alex', subscription: { status: 'trial' } },
      { isoWeekYear: 2026, isoWeek: 16, yearWeekKey: '2026-W16' },
      'en',
    );
    expect(ctx.weekLabel).toBe('Week 16 · 2026');
    expect(ctx.updatesSectionTitle).toBe('What is new in the app');
    expect(ctx.subjectLine).toMatch(/Week 16 · 2026/);
    expect(ctx.subjectLine).toMatch(/Anto/);
  });

  it('algunas rotaciones mencionan el regalo con condición (sin prometer a todos)', () => {
    const w = 'Semana 9 · 2026';
    expect(weeklyEmailSubjectIndex(2026, 9)).toBe(7);
    const s = buildWeeklySummarySubjectLine(w, 2026, 9);
    expect(s).toMatch(/califica|\+2|prueba/i);
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
        subscription: { status: 'trial' }
      },
      { isoWeekYear: 2026, isoWeek: 16, yearWeekKey: '2026-W16' }
    );
    expect(ctx.displayName).toBe('María');
    expect(ctx.weekLabel).toBe('Semana 16 · 2026');
    expect(ctx.preheaderText.length).toBeGreaterThan(10);
    expect(ctx.benefitLines).toHaveLength(2);
    expect(ctx.updatesSectionTitle).toBe('Novedades en la app');
    expect(ctx.updatesIntro.length).toBeGreaterThan(20);
    expect(ctx.benefitSectionTitle).toBe('En tu resumen');
    expect(ctx.updatesLines).toHaveLength(6);
    expect(ctx.updatesLines.join(' ')).toMatch(
      /resumen|notificaciones|tareas|hábitos|pomodoro|tema claro|chat|Ecosistema/i
    );
    expect(ctx.giftBadgeLabel).toBe('Regalo');
    expect(ctx.giftTitle).toMatch(/2 días|Premium/i);
    expect(ctx.giftPrimary).toMatch(/2 días|prueba|Premium/i);
    expect(ctx.closingLine).toMatch(/Anto|acompañarte/i);
    expect(ctx.subjectLine).not.toContain('99');
    expect(ctx.leadParagraph).toMatch(/ritmo|semana/i);
    expect(ctx.openingBenefitLine.length).toBeGreaterThan(40);
    expect(ctx.openingBenefitLine).toMatch(/actividad registrada|perspectiva/i);
  });

  it('usa username si no hay nombre', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'solo_user', stats: {}, subscription: { status: 'free' } },
      { isoWeekYear: 2026, isoWeek: 1, yearWeekKey: '2026-W01' }
    );
    expect(ctx.displayName).toBe('solo_user');
    expect(ctx.openingBenefitLine).toMatch(/poco tiempo|perspectiva/i);
  });

  it('bloque de regalo distinto para cuentas premium', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'pro', stats: {}, subscription: { status: 'premium' } },
      { isoWeekYear: 2026, isoWeek: 20, yearWeekKey: '2026-W20' }
    );
    expect(ctx.giftBadgeLabel).toBe('Tu plan');
    expect(ctx.giftTitle).toMatch(/Premium/i);
    expect(ctx.giftPrimary).toMatch(/suscripción|Premium|plan/i);
  });

  it('incluye línea de acción tras novedades (Perfil o responder)', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'ana', stats: { totalSessions: 1 }, subscription: { status: 'trial' } },
      { isoWeekYear: 2026, isoWeek: 3, yearWeekKey: '2026-W03' }
    );
    expect(ctx.postUpdatesActionLine).toMatch(/Perfil|responder/i);
    expect(ctx.postUpdatesActionLine).toMatch(/Anto/);
  });
});
