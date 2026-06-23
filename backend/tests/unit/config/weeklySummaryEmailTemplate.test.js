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
    expect(t.html).toMatch(/Te escribimos|escribimos desde|Anto/i);
    expect(t.html).toContain('Abrir Anto');
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

      expect(t.subject).toMatch(/Anto/i);
      expect(t.html).toContain('Week 16 · 2026');
      expect(t.html).toContain('Week 16 · 2026');
      expect(t.html).toContain('A note from Anto');
      expect(t.html).toContain('What we improved');
      expect(t.html).toContain('Open Anto');
      expect(t.html).toContain('Download on the App Store');
      expect(t.html).not.toContain('Resumen semanal');
    });
  });
});
