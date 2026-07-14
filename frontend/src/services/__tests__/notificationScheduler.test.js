/**
 * Tests unitarios para notificationScheduler.js (#15).
 */
import * as Notifications from 'expo-notifications';
import {
  scheduleSessionNotification,
  cancelSessionNotification,
  rescheduleAllSessions,
  cancelAllSessionNotifications,
} from '../notificationScheduler';
import { updateScheduledSession } from '../scheduledSessionsService';

// Mock de Expo Notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
}));

// Mock de scheduledSessionsService
jest.mock('../scheduledSessionsService', () => ({
  updateScheduledSession: jest.fn(),
}));

describe('notificationScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleSessionNotification', () => {
    const mockSession = {
      id: 'session-1',
      dayOfWeek: 1, // Lunes
      time: '10:00',
      label: 'Sesión mañana',
      isActive: true,
    };

    it('debe programar notificación exitosamente', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');

      const notificationId = await scheduleSessionNotification(mockSession, 'es');

      expect(notificationId).toBe('notification-id-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Es tu momento: Sesión mañana',
          body: expect.any(String),
          data: {
            sessionId: 'session-1',
            type: 'scheduled_session',
            timestamp: expect.any(String),
          },
          sound: true,
        },
        trigger: {
          weekday: 2, // Expo usa 1-7 (domingo=1), así que lunes=2
          hour: 10,
          minute: 0,
          repeats: true,
        },
      });
    });

    it('debe solicitar permisos si no están otorgados', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');

      const notificationId = await scheduleSessionNotification(mockSession, 'es');

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(notificationId).toBe('notification-id-123');
    });

    it('debe retornar null si permisos denegados', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const notificationId = await scheduleSessionNotification(mockSession, 'es');

      expect(notificationId).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('debe usar copy en inglés si language=en', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');

      await scheduleSessionNotification(mockSession, 'en');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Your session: Sesión mañana',
          }),
        })
      );
    });

    it('debe retornar null con session inválido', async () => {
      const result1 = await scheduleSessionNotification(null, 'es');
      const result2 = await scheduleSessionNotification([], 'es');
      const result3 = await scheduleSessionNotification({}, 'es');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('debe retornar null con dayOfWeek faltante', async () => {
      const invalidSession = { id: 'session-1', time: '10:00' };
      const result = await scheduleSessionNotification(invalidSession, 'es');

      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('debe retornar null con time faltante', async () => {
      const invalidSession = { id: 'session-1', dayOfWeek: 1 };
      const result = await scheduleSessionNotification(invalidSession, 'es');

      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('debe retornar null si falla calculateNextTrigger', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const invalidSession = {
        id: 'session-1',
        dayOfWeek: 'invalid', // Inválido
        time: '10:00',
      };

      const notificationId = await scheduleSessionNotification(invalidSession, 'es');

      expect(notificationId).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelSessionNotification', () => {
    it('debe cancelar notificación exitosamente', async () => {
      Notifications.cancelScheduledNotificationAsync.mockResolvedValue();

      const success = await cancelSessionNotification('notification-id-123');

      expect(success).toBe(true);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-id-123');
    });

    it('debe retornar false con notificationId inválido', async () => {
      const success1 = await cancelSessionNotification(null);
      const success2 = await cancelSessionNotification('');
      const success3 = await cancelSessionNotification('   ');

      expect(success1).toBe(false);
      expect(success2).toBe(false);
      expect(success3).toBe(false);
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it('debe retornar false si falla la cancelación', async () => {
      Notifications.cancelScheduledNotificationAsync.mockRejectedValue(new Error('Cancel failed'));

      const success = await cancelSessionNotification('notification-id-123');

      expect(success).toBe(false);
    });
  });

  describe('rescheduleAllSessions', () => {
    const mockSessions = [
      {
        id: 'session-1',
        dayOfWeek: 1,
        time: '10:00',
        isActive: true,
        notificationId: 'old-notif-1',
      },
      {
        id: 'session-2',
        dayOfWeek: 3,
        time: '15:00',
        isActive: false, // Inactiva, debe saltearse
        notificationId: 'old-notif-2',
      },
      {
        id: 'session-3',
        dayOfWeek: 5,
        time: '18:00',
        isActive: true,
        notificationId: null, // Sin notificationId previo
      },
    ];

    it('debe re-programar solo sesiones activas', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.cancelScheduledNotificationAsync.mockResolvedValue();
      Notifications.scheduleNotificationAsync.mockResolvedValue('new-notif-id');
      updateScheduledSession.mockResolvedValue({});

      const results = await rescheduleAllSessions(mockSessions, 'es');

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].skipped).toBe(true); // Inactiva
      expect(results[2].success).toBe(true);
      
      // Verificar cancelaciones
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-notif-1');
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('old-notif-2'); // Inactiva
      
      // Verificar programaciones
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2); // Solo activas
      
      // Verificar actualizaciones backend
      expect(updateScheduledSession).toHaveBeenCalledWith('session-1', { notificationId: 'new-notif-id' });
      expect(updateScheduledSession).toHaveBeenCalledWith('session-3', { notificationId: 'new-notif-id' });
      expect(updateScheduledSession).not.toHaveBeenCalledWith('session-2', expect.anything());
    });

    it('debe manejar sesiones inválidas', async () => {
      const invalidSessions = [
        { id: 'session-1', dayOfWeek: 1, time: '10:00', isActive: true },
        { id: null, dayOfWeek: 2, time: '11:00', isActive: true }, // Sin id
        { dayOfWeek: 3, time: '12:00', isActive: true }, // Sin id
        'invalid', // No es objeto
      ];

      const results = await rescheduleAllSessions(invalidSessions, 'es');

      expect(results).toHaveLength(4);
      expect(results[0].success).toBe(true); // Válida
      expect(results[1].success).toBe(false); // Invalid session
      expect(results[2].success).toBe(false); // Invalid session
      expect(results[3].success).toBe(false); // Invalid session
    });

    it('debe retornar array vacío con input no-array', async () => {
      const results1 = await rescheduleAllSessions(null, 'es');
      const results2 = await rescheduleAllSessions('not-array', 'es');
      const results3 = await rescheduleAllSessions({}, 'es');

      expect(results1).toEqual([]);
      expect(results2).toEqual([]);
      expect(results3).toEqual([]);
    });
  });

  describe('cancelAllSessionNotifications', () => {
    it('debe cancelar todas las notificaciones', async () => {
      Notifications.cancelScheduledNotificationAsync.mockResolvedValue();

      const sessions = [
        { id: 'session-1', notificationId: 'notif-1' },
        { id: 'session-2', notificationId: 'notif-2' },
        { id: 'session-3', notificationId: null }, // Sin notificationId
      ];

      const count = await cancelAllSessionNotifications(sessions);

      expect(count).toBe(2);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-2');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    });

    it('debe retornar 0 con input inválido', async () => {
      const count1 = await cancelAllSessionNotifications(null);
      const count2 = await cancelAllSessionNotifications('not-array');
      const count3 = await cancelAllSessionNotifications([]);

      expect(count1).toBe(0);
      expect(count2).toBe(0);
      expect(count3).toBe(0);
    });
  });
});
