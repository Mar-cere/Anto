/**
 * Blindaje: auditoría mailer EN en CI.
 */
import mailer from '../../../config/mailer.js';
import { buildWeeklySummaryEmailContext } from '../../../utils/weeklySummaryEmailContext.js';
import { runEmailEnAudit } from '../../../utils/emailEnAudit.mjs';

describe('emailEnAudit', () => {
  it('mailer EN pasa auditoría estructural y de render', async () => {
    const { ok, report } = await runEmailEnAudit(mailer, buildWeeklySummaryEmailContext);
    if (!ok) {
      throw new Error(`email EN audit failed: ${JSON.stringify(report.counts)}`);
    }
    expect(ok).toBe(true);
    expect(report.counts.missingStringKeys).toBe(0);
    expect(report.counts.spanishInRender).toBe(0);
    expect(report.identicalToEs).toHaveLength(0);
  });

  it('verificationCode EN difiere de ES y no contiene español obvio', () => {
    const en = mailer.emailTemplates.verificationCode('123456', 'en');
    const es = mailer.emailTemplates.verificationCode('123456', 'es');
    expect(en.subject).not.toBe(es.subject);
    expect(en.html).toMatch(/Verification code/i);
    expect(en.html).not.toMatch(/Código de verificación/i);
  });

  it('welcomeEmail EN contiene Welcome y no Bienvenido', () => {
    const en = mailer.emailTemplates.welcomeEmail('ana', 'en');
    expect(en.html).toMatch(/Welcome/i);
    expect(en.html).not.toMatch(/Bienvenido/i);
  });
});
