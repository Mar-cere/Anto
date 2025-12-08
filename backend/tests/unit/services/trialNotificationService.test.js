/**
 * Tests unitarios para servicio de notificaciones de trial
 * 
 * @author AntoApp Team
 */

import trialNotificationService from '../../../services/trialNotificationService.js';

describe('TrialNotificationService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(trialNotificationService).toBeDefined();
      expect(typeof trialNotificationService).toBe('object');
    });
  });
});

