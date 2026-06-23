import { describe, it, expect } from '@jest/globals';
import mailer from '../../../config/mailer.js';
import { wrapEmailHtmlDocument } from '../../../utils/emailHtmlDocument.js';

describe('emailVerificationReminderEmail plantilla', () => {
  it('español: sin código; valor, novedades y CTA finalizar registro', () => {
    const t = mailer.emailTemplates.emailVerificationReminderEmail('ana', 'es');
    expect(t.subject).toMatch(/importante|buscabas|Anto/i);
    expect(t.html).not.toContain('letter-spacing:10px');
    expect(t.html).not.toContain('Tu código');
    expect(t.html).toContain('Te escribimos desde Anto');
    expect(t.html).toContain('👋');
    expect(t.html).toContain('email-outer');
    expect(t.html).toContain('email-gift-panel');
    expect(t.html).toContain('llegaste hasta aquí');
    expect(t.html).toContain('Qué puedes hacer aquí');
    expect(t.html).toContain('Lo que hemos mejorado');
    expect(t.html).toContain('Finalizar mi registro');
    expect(t.html).toContain('App Store');
  });

  it('envoltorio de envío incluye protección modo oscuro', () => {
    const t = mailer.emailTemplates.emailVerificationReminderEmail('ana', 'es');
    const wrapped = wrapEmailHtmlDocument(t.html);
    expect(wrapped).toMatch(/color-scheme" content="light only"/);
    expect(wrapped).toContain('email-card');
  });

  describe('language en', () => {
    it('inglés: sin código; features y CTA EN', () => {
      const t = mailer.emailTemplates.emailVerificationReminderEmail('alex', 'en');
      expect(t.subject).toMatch(/needed|Anto/i);
      expect(t.html).not.toContain('Your code');
      expect(t.html).toContain('Only you know');
      expect(t.html).toContain('What you can do here');
      expect(t.html).toContain('Finish my signup');
      expect(t.html).not.toContain('Verifica tu email');
    });
  });
});
