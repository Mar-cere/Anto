/**
 * Tests unitarios para servicio de alertas de emergencia
 * 
 * @author AntoApp Team
 */

import emergencyAlertService from '../../../services/emergencyAlertService.js';

describe('EmergencyAlertService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(emergencyAlertService).toBeDefined();
      expect(typeof emergencyAlertService).toBe('object');
    });
  });
});
