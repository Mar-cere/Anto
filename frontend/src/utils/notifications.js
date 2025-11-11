import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import notifications from '../data/notifications';

// Configuración de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Configurar canales de notificación para Android
const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    // Canal para hábitos
    await Notifications.setNotificationChannelAsync('anto-habits', {
      name: 'Hábitos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1ADDDB',
    });
    
    // Canal para notificaciones generales
    await Notifications.setNotificationChannelAsync('anto-notifications', {
      name: 'Notificaciones',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1ADDDB',
    });
  }
};

/**
 * Función para registrar permisos de notificaciones locales
 * 
 * Solo solicita permisos para notificaciones locales (no push remotas)
 * para evitar advertencias en Expo Go. Las notificaciones push remotas
 * requieren un development build o build de producción.
 * 
 * @returns {Promise<boolean>} true si los permisos fueron otorgados, false en caso contrario
 */
export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log('Las notificaciones requieren un dispositivo físico');
    return false;
  }

  try {
    // Configurar canales de notificación
    await setupNotificationChannels();
    
    // Solicitar permisos para notificaciones locales
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('¡Se requieren permisos para las notificaciones!');
      return false;
    }

    // Nota: No obtenemos el token push aquí para evitar advertencias en Expo Go
    // Si necesitas notificaciones push remotas, usa un development build
    // y descomenta las siguientes líneas:
    // try {
    //   const tokenData = await Notifications.getExpoPushTokenAsync();
    //   const token = tokenData.data;
    //   await AsyncStorage.setItem('pushToken', token);
    //   return token;
    // } catch (error) {
    //   console.log('Error obteniendo token push (requiere development build):', error);
    // }

    return true;
  } catch (error) {
    console.error('Error registrando notificaciones:', error);
    return false;
  }
};

// Función para programar una notificación local
export const scheduleLocalNotification = async (title, body, trigger) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
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

// Función para obtener una notificación aleatoria
const getRandomNotification = () => {
  const randomIndex = Math.floor(Math.random() * notifications.length);
  return notifications[randomIndex];
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
        color: '#1ADDDB',
      },
      ios: {
        sound: true,
      },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
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
        color: '#1ADDDB',
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
  
  // Programar notificación para mañana
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      hour: 10, // 10:00 AM
      minute: 0,
      repeats: false,
    },
  });

  // Programar la siguiente notificación para pasado mañana
  const nextNotification = getRandomNotification();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: nextNotification.title,
      body: nextNotification.body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      hour: 10, // 10:00 AM
      minute: 0,
      repeats: false,
      // Se enviará en 48 horas
      seconds: 48 * 60 * 60,
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
        hour: time.hour,
        minute: time.minute,
        repeats: true,
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
        await Notifications.scheduleNotificationAsync({
          content: {
            title: task.title,
            body: task.description || 'Tienes una tarea pendiente en Anto',
            sound: true,
            data: { taskId: task._id }
          },
          trigger: new Date(notif.time)
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
      // Si no es una fecha válida, programar para mañana a las 9 AM
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

    // Configurar canales de notificación si no están configurados
    await setupNotificationChannels();

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

    // Usar un trigger basado en segundos para mayor compatibilidad
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `¡No olvides tu hábito!`,
        body: `Recuerda: ${habit.title}`,
        sound: true,
        data: { habitId: habit._id },
        android: {
          channelId: 'anto-habits',
          smallIcon: 'notification-icon',
          color: '#1ADDDB',
        },
        ios: {
          sound: true,
        }
      },
      trigger: {
        seconds: secondsUntilTarget,
        repeats: false
      }
    });

    console.log(`Notificación programada para hábito: ${habit.title} en ${secondsUntilTarget} segundos (${Math.floor(secondsUntilTarget/60)} minutos)`);
  } catch (error) {
    console.error('Error scheduling habit notification:', error);
    // Si falla, intentar con una notificación más simple
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `¡No olvides tu hábito!`,
          body: `Recuerda: ${habit.title}`,
          sound: true,
          data: { habitId: habit._id },
        },
        trigger: {
          seconds: 60, // Notificar en 1 minuto como fallback
        }
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
