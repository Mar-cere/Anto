import { describe, it, expect } from '@jest/globals';
import mailer from '../../../config/mailer.js';

const periodEnd = new Date('2026-08-15T12:00:00.000Z');

describe('subscriptionThankYouEmail plantilla', () => {
  it('sin comprobante: asunto; preheader oculto; sin bloque confirmación (snapshot mínimo)', () => {
    const t = mailer.emailTemplates.subscriptionThankYouEmail('ana', 'monthly', periodEnd, null);

    expect(t.subject).toMatchSnapshot();

    expect({
      preheaderOculto: t.html.includes('display:none') && t.html.includes('max-height:0'),
      sinTablaComprobante: !t.html.includes('Confirmación de compra'),
      incluyePlanMensual: t.html.includes('Mensual'),
      ctaAbrirApp: t.html.includes('Abrir ') && t.html.includes('</a>'),
    }).toMatchSnapshot();
  });

  it('con comprobante: asunto distinto; tabla y referencia escapada', () => {
    const t = mailer.emailTemplates.subscriptionThankYouEmail('ana', 'yearly', periodEnd, {
      purchaseDate: '2026-06-10T14:30:00.000Z',
      amount: 10000,
      currency: 'CLP',
      providerLabel: 'Mercado Pago',
      reference: 'REF-&-1',
    });

    expect(t.subject).toMatchSnapshot();

    expect({
      preheaderOculto: t.html.includes('display:none') && t.html.includes('max-height:0'),
      bloqueComprobante: t.html.includes('Confirmación de compra'),
      referenciaEscapada: t.html.includes('REF-&amp;-1'),
      incluyeAnual: t.html.includes('Anual'),
    }).toMatchSnapshot();
  });

  describe('language en', () => {
    it('sin comprobante: asunto y cuerpo en inglés', () => {
      const t = mailer.emailTemplates.subscriptionThankYouEmail(
        'ana',
        'monthly',
        periodEnd,
        null,
        'en',
      );

      expect(t.subject).toMatch(/subscription activated/i);
      expect(t.subject).toMatch(/Monthly/i);
      expect(t.subject).toMatchSnapshot();

      expect({
        sinTablaComprobante: !t.html.includes('Purchase confirmation'),
        incluyePlanMonthly: t.html.includes('Monthly'),
        ctaOpenApp: t.html.includes('Open Anto'),
        premiumActive: t.html.includes('subscription') && t.html.includes('active'),
      }).toMatchSnapshot();
    });

    it('con comprobante: bloque Purchase confirmation y referencia escapada', () => {
      const t = mailer.emailTemplates.subscriptionThankYouEmail(
        'ana',
        'yearly',
        periodEnd,
        {
          purchaseDate: '2026-06-10T14:30:00.000Z',
          amount: 10000,
          currency: 'CLP',
          providerLabel: 'Mercado Pago',
          reference: 'REF-&-1',
        },
        'en',
      );

      expect(t.subject).toMatch(/purchase confirmation/i);
      expect(t.subject).toMatchSnapshot();

      expect({
        bloqueComprobante: t.html.includes('Purchase confirmation'),
        referenciaEscapada: t.html.includes('REF-&amp;-1'),
        incluyeAnnual: t.html.includes('Annual'),
        tablaAmount: t.html.includes('Amount'),
      }).toMatchSnapshot();
    });
  });
});
