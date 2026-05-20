/**
 * Plantillas de auth/onboarding en inglés.
 */
import mailer from '../../../config/mailer.js';

describe('plantillas email auth language en', () => {
  it('emailVerificationCode: asunto y cuerpo en inglés', () => {
    const t = mailer.emailTemplates.emailVerificationCode('654321', 'alex', 'en');
    expect(t.subject).toMatch(/Verify your Email/i);
    expect(t.html).toContain('Verify your email');
    expect(t.html).toContain('654321');
    expect(t.html).not.toMatch(/Verifica tu/i);
  });

  it('resetPassword: enlace y copy en inglés', () => {
    const t = mailer.emailTemplates.resetPassword('token-xyz', 'en');
    expect(t.subject).toMatch(/Reset Password/i);
    expect(t.html).toMatch(/Reset password/i);
    expect(t.html).toMatch(/password reset/i);
    expect(t.html).not.toMatch(/Restablecer contraseña/i);
  });

  it('weeklyTipsEmail: tip en inglés', () => {
    const t = mailer.emailTemplates.weeklyTipsEmail('ana', 2, 'en');
    expect(t.subject).toMatch(/Anto/i);
    expect(t.html).not.toMatch(/Consejo de la semana/i);
    expect(t.html).toMatch(/Open the app|open the app/i);
  });
});
