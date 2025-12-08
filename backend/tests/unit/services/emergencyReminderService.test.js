/**
 * Tests unitarios para servicio de recordatorios de emergencia
 * 
 * @author AntoApp Team
 */

import emergencyReminderService from '../../../services/emergencyReminderService.js';

describe('EmergencyReminderService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(emergencyReminderService).toBeDefined();
      expect(typeof emergencyReminderService).toBe('object');
    });
  });
});

