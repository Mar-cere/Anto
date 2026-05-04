/**
 * Tests unitarios para servicio de programación de notificaciones
 *
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import NotificationEngagement from '../../../models/NotificationEngagement.js';
import User from '../../../models/User.js';
import notificationScheduler from '../../../services/notificationScheduler.js';
import pushNotificationService from '../../../services/pushNotificationService.js';

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
        .mockResolvedValue(3);
      const findOneSpy = jest.spyOn(NotificationEngagement, 'findOne');
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
      expect(findOneSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('permite envío cuando el usuario está bajo el tope diario', async () => {
      jest
        .spyOn(NotificationEngagement, 'countDocuments')
        .mockResolvedValue(2);
      jest.spyOn(NotificationEngagement, 'findOne').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });
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

  describe('Mensajes entre sesiones (#31)', () => {
    it('usa between_sessions_nudge para inactividad > 48h', async () => {
      jest
        .spyOn(User, 'findById')
        .mockReturnValue({
          select: jest.fn().mockResolvedValue({
            pushToken: 'ExponentPushToken[test]',
            notificationPreferences: { enabled: true, types: { betweenSessionsMessages: true } },
          }),
        });
      jest
        .spyOn(notificationScheduler, '_hasRecentNotificationOfType')
        .mockResolvedValue(false);
      const sendSpy = jest
        .spyOn(notificationScheduler, 'sendScheduledNotification')
        .mockResolvedValue(true);

      const result = await notificationScheduler.sendBehaviorBasedNotification(
        '507f1f77bcf86cd799439011',
        { inactivity: { hours: 72 } }
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe(
        pushNotificationService.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE
      );
      expect(sendSpy).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'ExponentPushToken[test]',
        pushNotificationService.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE,
        expect.any(Object)
      );
    });

    it('no envía between_sessions_nudge si ya hubo uno en la ventana de cooldown', async () => {
      jest
        .spyOn(User, 'findById')
        .mockReturnValue({
          select: jest.fn().mockResolvedValue({
            pushToken: 'ExponentPushToken[test]',
            notificationPreferences: { enabled: true, types: { betweenSessionsMessages: true } },
          }),
        });
      jest
        .spyOn(notificationScheduler, '_hasRecentNotificationOfType')
        .mockResolvedValue(true);
      const sendSpy = jest
        .spyOn(notificationScheduler, 'sendScheduledNotification')
        .mockResolvedValue(true);

      const result = await notificationScheduler.sendBehaviorBasedNotification(
        '507f1f77bcf86cd799439011',
        { inactivity: { hours: 72 } }
      );

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/\d+h/);
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });
});

