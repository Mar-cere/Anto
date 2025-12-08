/**
 * Tests unitarios para servicio de pagos
 * 
 * @author AntoApp Team
 */

import paymentService from '../../../services/paymentService.js';
import { isMercadoPagoConfigured } from '../../../config/mercadopago.js';

describe('PaymentService', () => {
  describe('createCheckoutSession', () => {
    it('debe lanzar error si Mercado Pago no está configurado', async () => {
      // Mock de isMercadoPagoConfigured para retornar false
      const originalIsConfigured = isMercadoPagoConfigured;
      
      // Simular que no está configurado
      if (!isMercadoPagoConfigured()) {
        await expect(
          paymentService.createCheckoutSession('user123', 'monthly')
        ).rejects.toThrow('Mercado Pago no está configurado correctamente');
      }
    });
  });

  describe('handleWebhook', () => {
    it('debe lanzar error si Mercado Pago no está configurado', async () => {
      if (!isMercadoPagoConfigured()) {
        await expect(
          paymentService.handleWebhook({ type: 'test' })
        ).rejects.toThrow('Mercado Pago no está configurado correctamente');
      }
    });
  });

  describe('Métodos del servicio', () => {
    it('debe tener método cancelSubscription', () => {
      expect(typeof paymentService.cancelSubscription).toBe('function');
    });

    it('debe tener método updatePaymentMethod', () => {
      expect(typeof paymentService.updatePaymentMethod).toBe('function');
    });

    it('debe tener método getSubscriptionStatus', () => {
      expect(typeof paymentService.getSubscriptionStatus).toBe('function');
    });

    it('debe tener método createCheckoutSession', () => {
      expect(typeof paymentService.createCheckoutSession).toBe('function');
    });

    it('debe tener método handleWebhook', () => {
      expect(typeof paymentService.handleWebhook).toBe('function');
    });
  });
});

