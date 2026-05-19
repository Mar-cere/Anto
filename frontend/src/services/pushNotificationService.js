/**
 * Servicio de Notificaciones Push
 * 
 * Maneja el registro de tokens push, envío al backend,
 * y recepción de notificaciones push remotas.
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api, ENDPOINTS, getAppLanguage } from '../config/api';
import { lightColors } from '../styles/themePalettes';

const ANDROID_CHANNEL_LABELS = {
  es: {
    crisis: 'Alertas de Crisis',
    followup: 'Seguimientos',
    reminders: 'Recordatorios',
    general: 'Notificaciones Generales',
    trial: 'Trial y Suscripciones',
  },
  en: {
    crisis: 'Crisis Alerts',
    followup: 'Follow-ups',
    reminders: 'Reminders',
    general: 'General Notifications',
    trial: 'Trial and Subscriptions',
  },
};

// Constantes
const STORAGE_KEYS = {
  PUSH_TOKEN: 'expoPushToken',
  PUSH_TOKEN_SENT: 'pushTokenSentToBackend',
};

let notificationsInitialized = false;

/**
 * Configura canales de notificación para Android
 */
const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    const language = await getAppLanguage();
    const labels = ANDROID_CHANNEL_LABELS[language === 'en' ? 'en' : 'es'];
    // Canal para crisis (máxima prioridad)
    await Notifications.setNotificationChannelAsync('anto-crisis', {
      name: labels.crisis,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: lightColors.error,
      sound: 'default',
      enableVibrate: true,
    });

    // Canal para seguimientos
    await Notifications.setNotificationChannelAsync('anto-followup', {
      name: labels.followup,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: lightColors.success,
      sound: 'default',
    });

    // Canal para recordatorios y progreso
    await Notifications.setNotificationChannelAsync('anto-reminders', {
      name: labels.reminders,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: lightColors.primary,
      sound: 'default',
    });

    // Canal general para notificaciones
    await Notifications.setNotificationChannelAsync('anto-notifications', {
      name: labels.general,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: lightColors.primary,
      sound: 'default',
    });

    // Canal para notificaciones de trial y suscripciones
    await Notifications.setNotificationChannelAsync('anto-trial', {
      name: labels.trial,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: lightColors.warning,
      sound: 'default',
      enableVibrate: true,
    });
  }
};

/**
 * Inicializa notificaciones globales una sola vez.
 * Configura handler y canales para evitar redefiniciones en distintos módulos.
 */
export const initializeNotifications = async () => {
  if (notificationsInitialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { data } = notification.request.content;

      // Configuración diferente según tipo de notificación
      const isCrisis = data?.type === 'crisis' || data?.type === 'crisis_warning';
      const isFollowUp = data?.type === 'crisis_followup';

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: isCrisis || isFollowUp
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.HIGH,
      };
    },
  });

  await setupNotificationChannels();
  notificationsInitialized = true;
};

/**
 * Registra el dispositivo para recibir notificaciones push
 * @returns {Promise<string|null>} Token push o null si no se pudo obtener
 */
export const registerForPushNotifications = async () => {
  try {
    await initializeNotifications();

    // Verificar que sea un dispositivo físico
    if (!Device.isDevice) {
      console.log('[PushNotifications] ⚠️ Las notificaciones push requieren un dispositivo físico');
      return null;
    }

    // Verificar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotifications] ❌ Permisos de notificaciones no otorgados');
      return null;
    }

    // Obtener token push
    // Nota: En Expo Go, esto puede no funcionar. Requiere un development build o build de producción
    let tokenData;
    try {
      // Intentar obtener Project ID de Constants (si está configurado en app.json)
      const Constants = require('expo-constants').default;
      const projectId = 
        process.env.EXPO_PUBLIC_PROJECT_ID || 
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.manifest?.extra?.eas?.projectId ||
        undefined;
      
      if (!projectId || projectId === 'YOUR_PROJECT_ID_HERE') {
        console.log('[PushNotifications] ⚠️ Project ID no configurado.');
        console.log('[PushNotifications] 💡 Las notificaciones push remotas NO funcionarán sin Project ID.');
        console.log('[PushNotifications] 💡 Para configurar:');
        console.log('[PushNotifications]    1. Ejecuta: npx eas-cli init');
        console.log('[PushNotifications]    2. O ve a: https://expo.dev/accounts/[TU_USUARIO]/projects');
        console.log('[PushNotifications]    3. Crea o abre el proyecto "anto"');
        console.log('[PushNotifications]    4. El Project ID se agregará automáticamente a app.json');
        console.log('[PushNotifications] 💡 Mientras tanto, puedes probar con notificaciones locales desde Settings.');
        return null;
      }
      
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
    } catch (error) {
      console.log('[PushNotifications] ⚠️ No se pudo obtener token push:', error.message);
      if (error.message.includes('projectId')) {
        console.log('[PushNotifications] 💡 Asegúrate de configurar el Project ID en app.json o como variable de entorno');
      }
      return null;
    }
    
    const token = tokenData.data;
    
    // Guardar token localmente
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
    
    console.log('[PushNotifications] ✅ Token push obtenido:', token.substring(0, 20) + '...');
    
    // Enviar token al backend
    await sendTokenToBackend(token);
    
    return token;
  } catch (error) {
    console.error('[PushNotifications] ❌ Error registrando notificaciones push:', error);
    return null;
  }
};

/**
 * Envía el token push al backend para almacenarlo
 * @param {string} token - Token push de Expo
 */
export const sendTokenToBackend = async (token) => {
  try {
    // Verificar si ya se envió este token
    const tokenSent = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN_SENT);
    if (tokenSent === token) {
      console.log('[PushNotifications] ℹ️ Token ya enviado al backend');
      return;
    }

    // Enviar token al backend
    await api.post(ENDPOINTS.PUSH_TOKEN, { pushToken: token });
    
    // Marcar como enviado
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN_SENT, token);
    
    console.log('[PushNotifications] ✅ Token enviado al backend exitosamente');
  } catch (error) {
    console.error('[PushNotifications] ❌ Error enviando token al backend:', error);
    // No lanzar error, solo loguear - el token se puede enviar más tarde
  }
};

/**
 * Obtiene el token push almacenado localmente
 * @returns {Promise<string|null>} Token push o null
 */
export const getStoredPushToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
  } catch (error) {
    console.error('[PushNotifications] ❌ Error obteniendo token almacenado:', error);
    return null;
  }
};

/**
 * Elimina el token push (útil para logout)
 */
export const removePushToken = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN_SENT);
    
    // Notificar al backend que se eliminó el token
    try {
      await api.delete(ENDPOINTS.PUSH_TOKEN);
    } catch (error) {
      console.error('[PushNotifications] ❌ Error eliminando token del backend:', error);
    }
    
    console.log('[PushNotifications] ✅ Token push eliminado');
  } catch (error) {
    console.error('[PushNotifications] ❌ Error eliminando token:', error);
  }
};

/**
 * Configura listeners para notificaciones recibidas
 * @param {Function} onNotificationReceived - Callback cuando se recibe una notificación
 * @param {Function} onNotificationTapped - Callback cuando se toca una notificación
 * @returns {Array} Array de suscripciones (para cleanup)
 */
export const setupNotificationListeners = (onNotificationReceived, onNotificationTapped) => {
  // Listener para notificaciones recibidas mientras la app está en foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[PushNotifications] 📬 Notificación recibida:', notification.request.content.title);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener para cuando el usuario toca una notificación
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[PushNotifications] 👆 Notificación tocada:', response.notification.request.content.title);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return [receivedSubscription, responseSubscription];
};

/**
 * Limpia los listeners de notificaciones
 * @param {Array} subscriptions - Array de suscripciones
 */
export const removeNotificationListeners = (subscriptions) => {
  if (subscriptions && Array.isArray(subscriptions)) {
    subscriptions.forEach(sub => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    });
  }
};

/**
 * Verifica si las notificaciones están habilitadas
 * @returns {Promise<boolean>}
 */
export const areNotificationsEnabled = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[PushNotifications] ❌ Error verificando permisos:', error);
    return false;
  }
};

/**
 * Solicita permisos de notificaciones si no están otorgados
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermissions = async () => {
  try {
    await initializeNotifications();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[PushNotifications] ❌ Error solicitando permisos:', error);
    return false;
  }
};

