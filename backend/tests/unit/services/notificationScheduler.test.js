/**
 * Tests unitarios para servicio de programación de notificaciones
 *
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Habit from '../../../models/Habit.js';
import NotificationEngagement from '../../../models/NotificationEngagement.js';
import User from '../../../models/User.js';
import notificationScheduler, {
    computeNextRoutinePushSlot,
} from '../../../services/notificationScheduler.js';
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
        { timeOfDay: 'morning', language: 'es' }
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
        { timeOfDay: 'morning', language: 'es' }
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

  describe('Helpers de preferencias y zona horaria', () => {
    it('_getUserTimezone usa UTC si falta o es inválida', () => {
      expect(notificationScheduler._getUserTimezone({})).toBe('UTC');
      expect(notificationScheduler._getUserTimezone({ preferences: {} })).toBe('UTC');
      expect(notificationScheduler._getUserTimezone({ preferences: { timezone: 'InvalidTZ' } })).toBe(
        'UTC'
      );
      expect(
        notificationScheduler._getUserTimezone({ preferences: { timezone: 'America/Santiago' } })
      ).toBe('America/Santiago');
    });

    it('_wellnessTypesEnabled respeta motivationalMessages false', () => {
      expect(notificationScheduler._wellnessTypesEnabled({ notificationPreferences: {} })).toBe(true);
      expect(
        notificationScheduler._wellnessTypesEnabled({
          notificationPreferences: { types: { motivationalMessages: false } },
        })
      ).toBe(false);
    });

    it('_habitRemindersEnabled respeta habitReminders false', () => {
      expect(notificationScheduler._habitRemindersEnabled({ notificationPreferences: {} })).toBe(true);
      expect(
        notificationScheduler._habitRemindersEnabled({
          notificationPreferences: { types: { habitReminders: false } },
        })
      ).toBe(false);
    });
  });

  describe('computeNextRoutinePushSlot', () => {
    it('devuelve null si las notificaciones están desactivadas', () => {
      expect(computeNextRoutinePushSlot({ enabled: false, morning: { enabled: true } })).toBeNull();
    });

    it('devuelve el siguiente slot de mañana si está habilitado', () => {
      const now = new Date('2026-05-07T12:00:00.000Z');
      const slot = computeNextRoutinePushSlot(
        {
          enabled: true,
          morning: { enabled: true, hour: 8, minute: 0 },
        },
        now
      );
      expect(slot).not.toBeNull();
      expect(slot.kind).toBe('morning');
      expect(slot.at instanceof Date).toBe(true);
      expect(slot.at.getTime()).toBeGreaterThan(now.getTime());
      expect(slot.label).toMatch(/mañana/i);
    });
  });

  describe('processScheduledNotifications', () => {
    it('no envía mañana si motivationalMessages está desactivado', async () => {
      const uid = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: uid,
        pushToken: 'ExponentPushToken[x]',
        preferences: { timezone: 'UTC' },
        notificationPreferences: {
          enabled: true,
          morning: { enabled: true, hour: 8, minute: 0 },
          types: { motivationalMessages: false },
        },
      };

      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser]),
      });
      jest.spyOn(notificationScheduler, '_getLocalHourMinute').mockReturnValue({ hh: 8, mm: 0 });
      jest.spyOn(notificationScheduler, 'notifyHabitsForCurrentMinute').mockResolvedValue({
        checked: 0,
        sent: 0,
      });
      const sendSpy = jest.spyOn(notificationScheduler, 'sendScheduledNotification').mockResolvedValue(true);

      const result = await notificationScheduler.processScheduledNotifications();

      expect(result.checked).toBe(1);
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('envía mañana cuando hora coincide y bienestar está permitido', async () => {
      const uid = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: uid,
        pushToken: 'ExponentPushToken[x]',
        preferences: { timezone: 'UTC' },
        notificationPreferences: {
          enabled: true,
          morning: { enabled: true, hour: 8, minute: 0 },
          types: { motivationalMessages: true },
        },
      };

      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser]),
      });
      jest.spyOn(notificationScheduler, '_getLocalHourMinute').mockReturnValue({ hh: 8, mm: 0 });
      jest.spyOn(notificationScheduler, 'notifyHabitsForCurrentMinute').mockResolvedValue({
        checked: 0,
        sent: 0,
      });
      const sendSpy = jest.spyOn(notificationScheduler, 'sendScheduledNotification').mockResolvedValue(true);

      await notificationScheduler.processScheduledNotifications();

      expect(sendSpy).toHaveBeenCalledWith(
        uid,
        mockUser.pushToken,
        pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION,
        { timeOfDay: 'morning', language: 'es' }
      );
    });
  });

  describe('notifyHabitsForCurrentMinute', () => {
    it('omite usuarios con habitReminders explícitamente false', async () => {
      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: new mongoose.Types.ObjectId(),
              pushToken: 't',
              notificationPreferences: {
                enabled: true,
                types: { habitReminders: false },
              },
              preferences: { timezone: 'UTC' },
            },
          ]),
        }),
      });
      const aggSpy = jest.spyOn(Habit, 'aggregate').mockResolvedValue([]);

      const result = await notificationScheduler.notifyHabitsForCurrentMinute(new Date());

      expect(result.checked).toBe(0);
      expect(result.sent).toBe(0);
      expect(aggSpy).not.toHaveBeenCalled();
    });

    it('consulta hábitos y marca lastNotified cuando el envío tiene éxito', async () => {
      const uid = new mongoose.Types.ObjectId();
      const habitId = new mongoose.Types.ObjectId();
      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: uid,
              pushToken: 'ExponentPushToken[h]',
              notificationPreferences: { enabled: true, types: { habitReminders: true } },
              preferences: { timezone: 'UTC' },
            },
          ]),
        }),
      });
      jest.spyOn(notificationScheduler, '_getLocalHourMinute').mockReturnValue({ hh: 9, mm: 30 });
      jest.spyOn(notificationScheduler, '_getStartOfDayInTzUtc').mockReturnValue(new Date('2026-05-06T00:00:00.000Z'));

      jest.spyOn(Habit, 'aggregate').mockResolvedValue([
        { _id: habitId, userId: uid, title: 'Agua' },
      ]);
      jest.spyOn(notificationScheduler, 'sendScheduledNotification').mockResolvedValue(true);
      const updateManySpy = jest.spyOn(Habit, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

      const now = new Date('2026-05-07T10:00:00.000Z');
      const result = await notificationScheduler.notifyHabitsForCurrentMinute(now);

      expect(result.checked).toBe(1);
      expect(result.sent).toBe(1);
      expect(updateManySpy).toHaveBeenCalledWith(
        { _id: { $in: [habitId] } },
        { $set: { 'reminder.lastNotified': now } }
      );
    });
  });
});

