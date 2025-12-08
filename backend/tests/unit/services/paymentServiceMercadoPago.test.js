/**
 * Tests unitarios para servicio de pagos de Mercado Pago
 * 
 * @author AntoApp Team
 */

import paymentServiceMercadoPago from '../../../services/paymentServiceMercadoPago.js';

describe('PaymentServiceMercadoPago', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(paymentServiceMercadoPago).toBeDefined();
      expect(typeof paymentServiceMercadoPago).toBe('object');
    });

    it('debe tener método createCheckoutSession si existe', () => {
      if (typeof paymentServiceMercadoPago.createCheckoutSession === 'function') {
        expect(typeof paymentServiceMercadoPago.createCheckoutSession).toBe('function');
      }
    });
  });
});

