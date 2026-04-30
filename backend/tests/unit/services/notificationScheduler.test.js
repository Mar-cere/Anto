/**
 * Tests unitarios para servicio de programación de notificaciones
 *
 * @author AntoApp Team
 */

import notificationScheduler from '../../../services/notificationScheduler.js';
import NotificationEngagement from '../../../models/NotificationEngagement.js';
import pushNotificationService from '../../../services/pushNotificationService.js';
import { jest } from '@jest/globals';

describe('NotificationScheduler Service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(notificationScheduler).toBeDefined();
      expect(typeof notificationScheduler).toBe('object');
    });
  });

  describe('Límite diario por usuario', () => {
    it('bloquea envío cuando el usuario ya alcanzó el tope diario', async () => {
      const countSpy = jest
        .spyOn(NotificationEngagement, 'countDocuments')
        .mockResolvedValue(5);
      const sendSpy = jest
        .spyOn(pushNotificationService, 'sendDailyCheckIn')
        .mockResolvedValue({ success: true });
      const createSpy = jest
        .spyOn(NotificationEngagement, 'create')
        .mockResolvedValue({});

      const result = await notificationScheduler.sendScheduledNotification(
        '507f1f77bcf86cd799439011',
        'ExponentPushToken[test]',
        pushNotificationService.NOTIFICATION_TYPES.DAILY_CHECKIN,
        { timeOfDay: 'morning' }
      );

      expect(result).toBe(false);
      expect(countSpy).toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('permite envío cuando el usuario está bajo el tope diario', async () => {
      jest
        .spyOn(NotificationEngagement, 'countDocuments')
        .mockResolvedValue(3);
      const sendSpy = jest
        .spyOn(pushNotificationService, 'sendDailyCheckIn')
        .mockResolvedValue({ success: true, title: 't', body: 'b' });
      const createSpy = jest
        .spyOn(NotificationEngagement, 'create')
        .mockResolvedValue({});

      const result = await notificationScheduler.sendScheduledNotification(
        '507f1f77bcf86cd799439011',
        'ExponentPushToken[test]',
        pushNotificationService.NOTIFICATION_TYPES.DAILY_CHECKIN,
        { timeOfDay: 'morning' }
      );

      expect(result).toBe(true);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });
});

