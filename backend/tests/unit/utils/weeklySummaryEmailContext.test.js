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
  it('rota asunto humano sin datos personales ni semana al inicio', () => {
    const w = 'Semana 16 · 2026';
    const i = weeklyEmailSubjectIndex(2026, 16);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(getWeeklySummarySubjectVariantCount());
    const s = buildWeeklySummarySubjectLine(w, 2026, 16);
    expect(s).toContain('Anto');
    expect(s).not.toMatch(/\d+ mensajes|\d+ tareas/i);
    expect(s).not.toMatch(/^Semana \d+/);
  });

  it('buildWeeklySummaryEmailContext en inglés usa weekLabel y asunto EN', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'alex', subscription: { status: 'trial' } },
      { isoWeekYear: 2026, isoWeek: 16, yearWeekKey: '2026-W16' },
      'en',
    );
    expect(ctx.weekLabel).toBe('Week 16 · 2026');
    expect(ctx.updatesSectionTitle).toBe('Three changes that matter');
    expect(ctx.subjectLine).toMatch(/Anto/i);
    expect(ctx.subjectLine).not.toMatch(/^Week \d+/);
  });

  it('algunas rotaciones mencionan el regalo con condición (sin prometer a todos)', () => {
    expect(weeklyEmailSubjectIndex(2026, 9)).toBe(7);
    const s = buildWeeklySummarySubjectLine('Semana 9 · 2026', 2026, 9);
    expect(s).toMatch(/aplica|\+1|prueba|posible|requisitos|qualify/i);
    expect(s).not.toMatch(/\+2 d[ií]a/i);
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
    expect(ctx.updatesSectionTitle).toBe('Tres cambios que importan');
    expect(ctx.updatesIntro.length).toBeGreaterThan(20);
    expect(ctx.benefitSectionTitle).toBe('Si quieres mirar atrás más adelante');
    expect(ctx.warmBridgeLine.length).toBeGreaterThan(10);
    expect(ctx.inviteLine).toMatch(/Anto|quieras|clic/i);
    expect(ctx.updatesLines).toHaveLength(3);
    expect(ctx.updatesLines.join(' ')).toMatch(/foco|retomar|memoria/i);
    expect(ctx.giftPrimary).toMatch(/enviarte este correo|califica|automática|aplica solo/i);
    expect(ctx.giftBadgeLabel).toBe('Regalo');
    expect(ctx.giftTitle).toMatch(/1 día|Premium/i);
    expect(ctx.closingLine).toMatch(/Anto|abrazo|ritmo/i);
    expect(ctx.subjectLine).not.toContain('99');
    expect(ctx.leadParagraph).toMatch(/Anto|cero|foco|calma|1\.5\.6|continuidad/i);
  });

  it('usa username si no hay nombre', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'solo_user', stats: {}, subscription: { status: 'free' } },
      { isoWeekYear: 2026, isoWeek: 1, yearWeekKey: '2026-W01' }
    );
    expect(ctx.displayName).toBe('solo_user');
    expect(ctx.warmBridgeLine.length).toBeGreaterThan(5);
  });

  it('bloque de regalo distinto para cuentas premium', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'pro', stats: {}, subscription: { status: 'premium' } },
      { isoWeekYear: 2026, isoWeek: 20, yearWeekKey: '2026-W20' }
    );
    expect(ctx.giftBadgeLabel).toBe('Tu plan');
    expect(ctx.giftTitle).toMatch(/Premium/i);
    expect(ctx.giftPrimary).toMatch(/suscripción|Premium|plan/i);
    expect(ctx.postUpdatesActionLine).toBe('');
  });

  it('incluye línea de acción tras regalo (Perfil o responder)', () => {
    const ctx = buildWeeklySummaryEmailContext(
      { username: 'ana', stats: { totalSessions: 1 }, subscription: { status: 'trial' } },
      { isoWeekYear: 2026, isoWeek: 3, yearWeekKey: '2026-W03' }
    );
    expect(ctx.postUpdatesActionLine).toMatch(/Perfil|responder/i);
    expect(ctx.postUpdatesActionLine).toMatch(/Anto/);
  });
});
