import { describe, it, expect } from '@jest/globals';
import mailer from '../../../config/mailer.js';

const periodEnd = new Date('2026-09-15T12:00:00.000Z');
const receipt = {
  purchaseDate: '2026-08-15T10:00:00.000Z',
  amount: 4990,
  currency: 'CLP',
  providerLabel: 'App Store (Apple)',
  reference: 'TXN-RENEW-1',
};

describe('subscriptionRenewalEmail plantilla', () => {
  it('asunto de renovación; comprobante y tono de otro periodo', () => {
    const t = mailer.emailTemplates.subscriptionRenewalEmail('ana', 'monthly', periodEnd, receipt);

    expect(t.subject).toMatch(/otro periodo|Anto/i);
    expect(t.subject).toMatchSnapshot();

    expect({
      preheaderOculto: t.html.includes('display:none') && t.html.includes('max-height:0'),
      bloqueCobro: t.html.includes('Detalle del cobro'),
      renovacion: t.html.includes('renovación') || t.html.includes('renovacion'),
      referencia: t.html.includes('TXN-RENEW-1'),
      planMensual: t.html.includes('Mensual'),
      ctaAbrirApp: t.html.includes('Abrir ') && t.html.includes('</a>'),
    }).toMatchSnapshot();
  });

  describe('language en', () => {
    it('asunto, comprobante y renovación en inglés', () => {
      const t = mailer.emailTemplates.subscriptionRenewalEmail(
        'ana',
        'monthly',
        periodEnd,
        receipt,
        'en',
      );

      expect(t.subject).toMatch(/another period with you/i);
      expect(t.subject).toMatch(/Monthly/i);
      expect(t.subject).toMatchSnapshot();

      expect({
        bloqueCobro: t.html.includes('Payment details'),
        renovacion: t.html.includes('renewed'),
        referencia: t.html.includes('TXN-RENEW-1'),
        planMonthly: t.html.includes('Monthly'),
        ctaOpenApp: t.html.includes('Open Anto'),
        thanksForStaying: t.html.includes('Thanks for staying'),
      }).toMatchSnapshot();
    });
  });
});
