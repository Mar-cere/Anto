/**
 * Tests unitarios para servicio de auditoría de pagos
 * 
 * @author AntoApp Team
 */

import paymentAuditService from '../../../services/paymentAuditService.js';

describe('PaymentAuditService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(paymentAuditService).toBeDefined();
      expect(typeof paymentAuditService).toBe('object');
    });
  });
});

