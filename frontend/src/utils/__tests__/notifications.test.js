/**
 * Tests unitarios para utilidad de notificaciones
 * 
 * @author AntoApp Team
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  sendImmediateNotification,
  scheduleDailyNotification,
  scheduleAlternateNotifications,
  scheduleMultipleDailyNotifications,
  cancelAllNotifications,
  checkNotificationStatus,
  scheduleTaskNotification,
  cancelTaskNotifications,
  scheduleHabitNotification,
  cancelHabitNotifications
} from '../notifications';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  AndroidImportance: {
    HIGH: 'HIGH'
  },
  AndroidNotificationPriority: {
    HIGH: 'HIGH'
  }
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios'
}));

// Mock notifications data
jest.mock('../../data/notifications', () => {
  return [
    { title: 'Test Notification 1', body: 'Body 1' },
    { title: 'Test Notification 2', body: 'Body 2' }
  ];
}, { virtual: true });

describe('notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerForPushNotificationsAsync', () => {
    it('debe retornar false si no es un dispositivo físico', async () => {
      Device.isDevice = false;
      
      const result = await registerForPushNotificationsAsync();
      
      expect(result).toBe(false);
    });

    it('debe registrar permisos si ya están otorgados', async () => {
      Device.isDevice = true;
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      
      const result = await registerForPushNotificationsAsync();
      
      expect(result).toBe(true);
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('debe solicitar permisos si no están otorgados', async () => {
      Device.isDevice = true;
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      
      const result = await registerForPushNotificationsAsync();
      
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('debe retornar false si los permisos son denegados', async () => {
      Device.isDevice = true;
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      
      const result = await registerForPushNotificationsAsync();
      
      expect(result).toBe(false);
    });
  });

  describe('scheduleLocalNotification', () => {
    it('debe programar una notificación local', async () => {
      const trigger = { seconds: 60 };
      
      await scheduleLocalNotification('Test Title', 'Test Body', trigger);
      
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH
        },
        trigger
      });
    });
  });

  describe('sendImmediateNotification', () => {
    it('debe enviar una notificación inmediata', async () => {
      await sendImmediateNotification('Test Title', 'Test Body');
      
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH
        },
        trigger: null
      });
    });
  });

  describe('scheduleDailyNotification', () => {
    it('debe programar notificación diaria', async () => {
      Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
      Notifications.scheduleNotificationAsync.mockResolvedValue();
      
      await scheduleDailyNotification(10, 30);
      
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelAllNotifications', () => {
    it('debe cancelar todas las notificaciones', async () => {
      await cancelAllNotifications();
      
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('checkNotificationStatus', () => {
    it('debe retornar true si los permisos están otorgados', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      
      const result = await checkNotificationStatus();
      
      expect(result).toBe(true);
    });

    it('debe retornar false si los permisos no están otorgados', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      
      const result = await checkNotificationStatus();
      
      expect(result).toBe(false);
    });
  });

  describe('scheduleTaskNotification', () => {
    it('debe programar notificaciones para una tarea', async () => {
      Device.isDevice = true;
      const task = {
        _id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        notifications: [
          { enabled: true, time: new Date(Date.now() + 60000).toISOString() }
        ]
      };
      
      await scheduleTaskNotification(task);
      
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('debe retornar sin hacer nada si no es un dispositivo', async () => {
      Device.isDevice = false;
      
      await scheduleTaskNotification({});
      
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelTaskNotifications', () => {
    it('debe cancelar notificaciones de una tarea', async () => {
      const mockNotifications = [
        { identifier: '1', content: { data: { taskId: 'task-123' } } },
        { identifier: '2', content: { data: { taskId: 'task-456' } } }
      ];
      
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);
      
      await cancelTaskNotifications('task-123');
      
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('1');
    });
  });

  describe('scheduleHabitNotification', () => {
    it('debe programar notificación para un hábito', async () => {
      const habit = {
        _id: 'habit-123',
        title: 'Test Habit',
        reminder: {
          enabled: true,
          time: new Date(Date.now() + 60000)
        }
      };
      
      await scheduleHabitNotification(habit);
      
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('debe retornar sin hacer nada si el recordatorio está deshabilitado', async () => {
      const habit = {
        _id: 'habit-123',
        title: 'Test Habit',
        reminder: {
          enabled: false
        }
      };
      
      await scheduleHabitNotification(habit);
      
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelHabitNotifications', () => {
    it('debe cancelar notificaciones de un hábito', async () => {
      const mockNotifications = [
        { identifier: '1', content: { data: { habitId: 'habit-123' } } },
        { identifier: '2', content: { data: { habitId: 'habit-456' } } }
      ];
      
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);
      
      await cancelHabitNotifications('habit-123');
      
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('1');
    });
  });
});

