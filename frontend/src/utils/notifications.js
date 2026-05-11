import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import notifications from '../data/notifications';
import { lightColors } from '../styles/themePalettes';

/** Color de acento en Android (canal); alineado con marca / primary de paleta clara. */
const ANDROID_NOTIFICATION_ACCENT = lightColors.primary;

const TriggerType = Notifications.SchedulableTriggerInputTypes;

/**
 * Convierte triggers legados ({ seconds }) o Date al formato exigido por expo-notifications.
 * @see https://docs.expo.dev/versions/latest/sdk/notifications/#notificationtriggerinput
 */
function normalizeSchedulableTrigger(trigger) {
  if (trigger == null) return trigger;
  if (typeof trigger === 'number' || trigger instanceof Date) {
    return trigger;
  }
  if (typeof trigger !== 'object') return trigger;
  if (trigger.type) return trigger;
  if (typeof trigger.seconds === 'number') {
    return {
      type: TriggerType.TIME_INTERVAL,
      seconds: Math.max(1, Math.floor(trigger.seconds)),
      repeats: Boolean(trigger.repeats),
    };
  }
  if (
    typeof trigger.hour === 'number' &&
    typeof trigger.minute === 'number' &&
    trigger.repeats === true
  ) {
    return {
      type: TriggerType.DAILY,
      hour: trigger.hour,
      minute: trigger.minute,
    };
  }
  return trigger;
}

// Función para programar una notificación local
export const scheduleLocalNotification = async (title, body, trigger) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: normalizeSchedulableTrigger(trigger),
  });
};

// Función para enviar una notificación inmediata
export const sendImmediateNotification = async (title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
};

// Aplana mañana / tarde / noche / genéricas para mayor batería de textos sin repetir siempre el mismo pool
const getAllLocalNotificationVariants = () => {
  if (Array.isArray(notifications)) return notifications;
  const n = notifications || {};
  return [
    ...(n.morning || []),
    ...(n.afternoon || []),
    ...(n.evening || []),
    ...(n.any || []),
  ];
};

const getRandomNotification = () => {
  const pool = getAllLocalNotificationVariants();
  if (!pool.length) return { title: 'Anto', body: 'Tienes un recordatorio.' };
  return pool[Math.floor(Math.random() * pool.length)];
};

// Función para programar notificaciones diarias
export const scheduleDailyNotification = async (hour, minute) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const notification = getRandomNotification();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: { type: 'daily' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      android: {
        channelId: 'anto-notifications',
        smallIcon: 'notification-icon',
        color: ANDROID_NOTIFICATION_ACCENT,
      },
      ios: {
        sound: true,
      },
    },
    trigger: {
      type: TriggerType.DAILY,
      hour,
      minute,
    },
  });
  // Programar una notificación inmediata para que el usuario reciba una notificación al activar
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: { type: 'daily' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      android: {
        channelId: 'anto-notifications',
        smallIcon: 'notification-icon',
        color: ANDROID_NOTIFICATION_ACCENT,
      },
      ios: {
        sound: true,
      },
    },
    trigger: null,
  });
};

// Función para programar notificaciones alternadas
export const scheduleAlternateNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const notification = getRandomNotification();

  const tomorrowAt10 = new Date();
  tomorrowAt10.setDate(tomorrowAt10.getDate() + 1);
  tomorrowAt10.setHours(10, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: TriggerType.DATE,
      date: tomorrowAt10,
    },
  });

  const nextNotification = getRandomNotification();
  const dayAfterAt10 = new Date();
  dayAfterAt10.setDate(dayAfterAt10.getDate() + 2);
  dayAfterAt10.setHours(10, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: nextNotification.title,
      body: nextNotification.body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: TriggerType.DATE,
      date: dayAfterAt10,
    },
  });
};

// Función para programar múltiples notificaciones al día
export const scheduleMultipleDailyNotifications = async (times) => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const time of times) {
    const notification = getRandomNotification();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: TriggerType.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
  }
};

// Función para cancelar todas las notificaciones
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Función para verificar el estado de las notificaciones
export const checkNotificationStatus = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

// Programar una notificación local para una tarea
export const scheduleTaskNotification = async (task) => {
  if (!Device.isDevice) return;

  if (Array.isArray(task.notifications)) {
    for (const notif of task.notifications) {
      if (notif.enabled && notif.time) {
        const when = new Date(notif.time);
        if (Number.isNaN(when.getTime())) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: task.title,
            body: task.description || 'Tienes una tarea pendiente en Anto',
            sound: true,
            data: { taskId: task._id },
          },
          trigger: {
            type: TriggerType.DATE,
            date: when,
          },
        });
      }
    }
  }
};

// Cancelar todas las notificaciones de una tarea (por id)
export const cancelTaskNotifications = async (taskId) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data && notif.content.data.taskId === taskId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
};

// Programar notificación para un hábito
export const scheduleHabitNotification = async (habit) => {
  try {
    if (!habit.reminder || !habit.reminder.enabled) return;

    const reminderTime = habit.reminder.time || habit.reminder;
    if (!reminderTime) return;

    // Crear una fecha válida para la notificación
    let triggerDate;
    if (reminderTime instanceof Date) {
      triggerDate = reminderTime;
    } else if (typeof reminderTime === 'string') {
      triggerDate = new Date(reminderTime);
    } else {
      triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 1);
      triggerDate.setHours(9, 0, 0, 0);
    }

    // Verificar que la fecha sea válida y en el futuro
    if (isNaN(triggerDate.getTime()) || triggerDate <= new Date()) {
      triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 1);
      triggerDate.setHours(9, 0, 0, 0);
    }

    // Calcular segundos hasta la hora objetivo
    const now = new Date();
    const targetTime = new Date(triggerDate);
    let secondsUntilTarget = Math.max(1, Math.floor((targetTime - now) / 1000));

    // Si la hora ya pasó, programar para mañana
    if (secondsUntilTarget <= 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      secondsUntilTarget = Math.max(1, Math.floor((tomorrow - now) / 1000));
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `¡No olvides tu hábito!`,
        body: `Recuerda: ${habit.title}`,
        sound: true,
        data: { habitId: habit._id },
        android: {
          channelId: 'anto-habits',
          smallIcon: 'notification-icon',
          color: ANDROID_NOTIFICATION_ACCENT,
        },
        ios: {
          sound: true,
        },
      },
      trigger: {
        type: TriggerType.TIME_INTERVAL,
        seconds: secondsUntilTarget,
        repeats: false,
      },
    });

    console.log(`Notificación programada para hábito: ${habit.title} en ${secondsUntilTarget} segundos (${Math.floor(secondsUntilTarget / 60)} minutos)`);
  } catch (error) {
    console.error('Error scheduling habit notification:', error);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `¡No olvides tu hábito!`,
          body: `Recuerda: ${habit.title}`,
          sound: true,
          data: { habitId: habit._id },
        },
        trigger: {
          type: TriggerType.TIME_INTERVAL,
          seconds: 60,
          repeats: false,
        },
      });
      console.log(`Notificación de fallback programada para hábito: ${habit.title}`);
    } catch (fallbackError) {
      console.error('Error con notificación de fallback:', fallbackError);
    }
  }
};

// Cancelar notificaciones de un hábito por id
export const cancelHabitNotifications = async (habitId) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data && notif.content.data.habitId === habitId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling habit notifications:', error);
  }
};
