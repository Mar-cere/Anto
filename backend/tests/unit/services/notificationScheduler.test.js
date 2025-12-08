/**
 * Tests unitarios para servicio de programación de notificaciones
 * 
 * @author AntoApp Team
 */

import notificationScheduler from '../../../services/notificationScheduler.js';

describe('NotificationScheduler Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(notificationScheduler).toBeDefined();
      expect(typeof notificationScheduler).toBe('object');
    });
  });
});

