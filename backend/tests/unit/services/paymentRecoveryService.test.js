/**
 * Tests unitarios para servicio de recuperación de pagos
 * 
 * @author AntoApp Team
 */

import paymentRecoveryService from '../../../services/paymentRecoveryService.js';

describe('PaymentRecoveryService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(paymentRecoveryService).toBeDefined();
      expect(typeof paymentRecoveryService).toBe('object');
    });
  });
});

