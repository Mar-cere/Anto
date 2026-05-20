import { describe, it, expect } from '@jest/globals';
import mailer from '../../../config/mailer.js';
import { buildWeeklySummaryEmailContext } from '../../../utils/weeklySummaryEmailContext.js';

const isoParts = { isoWeekYear: 2026, isoWeek: 16, yearWeekKey: '2026-W16' };

describe('weeklySummaryEmail plantilla', () => {
  it('español: encabezado y CTA de resumen semanal', () => {
    const context = buildWeeklySummaryEmailContext(
      { username: 'ana', subscription: { status: 'trial' } },
      isoParts,
      'es',
    );
    const t = mailer.emailTemplates.weeklySummaryEmail(context, 'es');

    expect(t.subject).toBe(context.subjectLine);
    expect(t.html).toMatch(/Resumen semanal|resumen/i);
    expect(t.html).toContain('Abrir mi resumen');
    expect(t.html).toContain(context.updatesSectionTitle);
  });

  describe('language en', () => {
    it('inglés: weekLabel, sección novedades y CTA EN', () => {
      const context = buildWeeklySummaryEmailContext(
        { username: 'alex', subscription: { status: 'trial' } },
        isoParts,
        'en',
      );
      const t = mailer.emailTemplates.weeklySummaryEmail(context, 'en');

      expect(t.subject).toMatch(/Week 16 · 2026/);
      expect(t.html).toContain('Week 16 · 2026');
      expect(t.html).toContain('Weekly summary');
      expect(t.html).toContain('What is new in the app');
      expect(t.html).toContain('Open my summary in the app');
      expect(t.html).toContain('Download on the App Store');
      expect(t.html).not.toContain('Resumen semanal');
    });
  });
});
