/**
 * Tests unitarios para servicio de notificaciones push
 * 
 * @author AntoApp Team
 */

import pushNotificationService from '../../../services/pushNotificationService.js';

describe('PushNotificationService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(pushNotificationService).toBeDefined();
      expect(typeof pushNotificationService).toBe('object');
    });
  });
});

