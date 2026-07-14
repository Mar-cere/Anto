/**
 * Servicio de scheduling de notificaciones locales para sesiones programadas (#15).
 * Gestiona notificaciones recurrentes con Expo Notifications API.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateScheduledSession } from './scheduledSessionsService';

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Copy terapéutico para notificaciones (ES/EN).
 * Variaciones para evitar fatiga.
 */
const NOTIFICATION_COPY = {
  es: [
    {
      title: 'Es tu momento con Anto',
      body: 'Tu espacio de hoy te espera. ¿Conectamos?',
    },
    {
      title: 'Tu espacio con Anto',
      body: 'Es un buen momento para conectar contigo.',
    },
    {
      title: '¿Conectamos?',
      body: 'Tu momento personal te espera.',
    },
  ],
  en: [
    {
      title: 'Your space with Anto is here',
      body: 'Ready to connect?',
    },
    {
      title: 'Time for yourself',
      body: 'Your session with Anto awaits.',
    },
    {
      title: 'Ready to connect?',
      body: 'Your personal space is here.',
    },
  ],
};

/**
 * Obtiene copy para notificación con variación basada en sessionId.
 * @param {string} sessionId - ID de la sesión
 * @param {string} language - Idioma ('es' o 'en')
 * @param {string|null} label - Etiqueta personalizada opcional
 * @returns {{ title: string, body: string }}
 */
function getNotificationCopy(sessionId, language = 'es', label = null) {
  // Validar inputs
  if (!sessionId || typeof sessionId !== 'string') {
    console.warn('[getNotificationCopy] Invalid sessionId:', sessionId);
    sessionId = '0';
  }
  
  const lang = language === 'en' ? 'en' : 'es';
  const variations = NOTIFICATION_COPY[lang];
  
  // Rotar variación según sessionId (hash simple)
  const hash = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = variations[hash % variations.length];
  
  // Si hay label, personalizarlo
  if (label && typeof label === 'string' && label.trim().length > 0) {
    return {
      title: lang === 'es' ? `Es tu momento: ${label}` : `Your session: ${label}`,
      body: variation.body,
    };
  }
  
  return variation;
}

/**
 * Calcula el próximo trigger para una sesión semanal.
 * @param {number} dayOfWeek - Día de la semana (0-6, domingo-sábado)
 * @param {string} time - Hora en formato HH:mm (24h)
 * @returns {Date|null} Fecha del próximo trigger o null si inválido
 */
function calculateNextTrigger(dayOfWeek, time) {
  try {
    // Validar inputs
    if (typeof dayOfWeek !== 'number' || isNaN(dayOfWeek) || !Number.isInteger(dayOfWeek)) {
      console.warn('[calculateNextTrigger] Invalid dayOfWeek:', dayOfWeek);
      return null;
    }
    
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      console.warn('[calculateNextTrigger] dayOfWeek out of range:', dayOfWeek);
      return null;
    }
    
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      console.warn('[calculateNextTrigger] Invalid time format:', time);
      return null;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    
    const now = new Date();
    const nextTrigger = new Date();
    
    // Calcular días hasta el próximo dayOfWeek
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    
    // Si es el mismo día pero ya pasó la hora, programar para la próxima semana
    if (daysUntil === 0) {
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      if (now >= targetTime) {
        daysUntil = 7;
      }
    } else if (daysUntil < 0) {
      daysUntil += 7;
    }
    
    nextTrigger.setDate(now.getDate() + daysUntil);
    nextTrigger.setHours(hours, minutes, 0, 0);
    
    return nextTrigger;
  } catch (error) {
    console.error('[calculateNextTrigger] Error calculating trigger:', error);
    return null;
  }
}

/**
 * Programa una notificación local recurrente para una sesión.
 * @param {Object} session - Sesión a programar
 * @param {string} session.id - ID de la sesión
 * @param {number} session.dayOfWeek - Día de la semana (0-6)
 * @param {string} session.time - Hora HH:mm
 * @param {string|null} session.label - Etiqueta opcional
 * @param {string} language - Idioma ('es' o 'en')
 * @returns {Promise<string|null>} notificationId o null si falla
 */
export async function scheduleSessionNotification(session, language = 'es') {
  try {
    // Validar session
    if (!session || typeof session !== 'object' || Array.isArray(session)) {
      throw new Error('Invalid session object');
    }
    
    if (!session.id || typeof session.id !== 'string') {
      throw new Error('Invalid session.id');
    }
    
    if (session.dayOfWeek === undefined || session.dayOfWeek === null) {
      throw new Error('session.dayOfWeek is required');
    }
    
    if (!session.time || typeof session.time !== 'string') {
      throw new Error('session.time is required');
    }
    
    // Solicitar permisos si es necesario
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('[scheduleSessionNotification] Notification permissions not granted');
      return null;
    }
    
    // Calcular próximo trigger
    const trigger = calculateNextTrigger(session.dayOfWeek, session.time);
    if (!trigger) {
      throw new Error('Failed to calculate next trigger');
    }
    
    // Obtener copy
    const { title, body } = getNotificationCopy(session.id, language, session.label);
    
    // Programar notificación recurrente (semanal)
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          sessionId: session.id,
          type: 'scheduled_session',
          timestamp: trigger.toISOString(),
        },
        sound: true,
      },
      trigger: {
        weekday: session.dayOfWeek + 1, // Expo usa 1-7 (domingo=1)
        hour: parseInt(session.time.split(':')[0], 10),
        minute: parseInt(session.time.split(':')[1], 10),
        repeats: true,
      },
    });
    
    console.log('[scheduleSessionNotification] Scheduled:', { sessionId: session.id, notificationId });
    
    return notificationId;
  } catch (error) {
    console.error('[scheduleSessionNotification] Error:', error);
    return null;
  }
}

/**
 * Cancela una notificación programada.
 * @param {string} notificationId - ID de la notificación a cancelar
 * @returns {Promise<boolean>} true si se canceló, false si falló
 */
export async function cancelSessionNotification(notificationId) {
  try {
    if (!notificationId || typeof notificationId !== 'string' || notificationId.trim().length === 0) {
      console.warn('[cancelSessionNotification] Invalid notificationId:', notificationId);
      return false;
    }
    
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[cancelSessionNotification] Cancelled:', notificationId);
    return true;
  } catch (error) {
    console.error('[cancelSessionNotification] Error:', error);
    return false;
  }
}

/**
 * Re-programa todas las sesiones activas del usuario.
 * Útil después de cambios en configuración o zona horaria.
 * @param {Array} sessions - Lista de sesiones
 * @param {string} language - Idioma
 * @returns {Promise<Array>} Lista de { sessionId, notificationId, success }
 */
export async function rescheduleAllSessions(sessions, language = 'es') {
  try {
    if (!Array.isArray(sessions)) {
      console.warn('[rescheduleAllSessions] Invalid sessions:', sessions);
      return [];
    }
    
    const results = [];
    
    for (const session of sessions) {
      // Validar sesión
      if (!session || !session.id || session.dayOfWeek === undefined || !session.time) {
        console.warn('[rescheduleAllSessions] Skipping invalid session:', session);
        results.push({ sessionId: session?.id || 'unknown', success: false, error: 'Invalid session' });
        continue;
      }
      
      // Solo re-programar si está activa
      if (session.isActive !== true) {
        console.log('[rescheduleAllSessions] Skipping inactive session:', session.id);
        results.push({ sessionId: session.id, success: true, skipped: true });
        continue;
      }
      
      // Cancelar notificación previa si existe
      if (session.notificationId) {
        await cancelSessionNotification(session.notificationId);
      }
      
      // Programar nueva notificación
      const notificationId = await scheduleSessionNotification(session, language);
      
      if (notificationId) {
        // Actualizar notificationId en el backend
        try {
          await updateScheduledSession(session.id, { notificationId });
          results.push({ sessionId: session.id, notificationId, success: true });
        } catch (error) {
          console.error('[rescheduleAllSessions] Failed to update backend:', error);
          results.push({ sessionId: session.id, notificationId, success: false, error: 'Backend update failed' });
        }
      } else {
        results.push({ sessionId: session.id, success: false, error: 'Scheduling failed' });
      }
    }
    
    console.log('[rescheduleAllSessions] Results:', results);
    return results;
  } catch (error) {
    console.error('[rescheduleAllSessions] Error:', error);
    return [];
  }
}

/**
 * Cancela todas las notificaciones programadas.
 * Útil para pausar sesiones globalmente.
 * @param {Array} sessions - Lista de sesiones
 * @returns {Promise<number>} Cantidad de notificaciones canceladas
 */
export async function cancelAllSessionNotifications(sessions) {
  try {
    if (!Array.isArray(sessions)) {
      console.warn('[cancelAllSessionNotifications] Invalid sessions:', sessions);
      return 0;
    }
    
    let cancelledCount = 0;
    
    for (const session of sessions) {
      if (session && session.notificationId) {
        const success = await cancelSessionNotification(session.notificationId);
        if (success) {
          cancelledCount++;
        }
      }
    }
    
    console.log('[cancelAllSessionNotifications] Cancelled:', cancelledCount);
    return cancelledCount;
  } catch (error) {
    console.error('[cancelAllSessionNotifications] Error:', error);
    return 0;
  }
}

/**
 * Obtiene todas las notificaciones programadas actualmente en el dispositivo.
 * Útil para debugging.
 * @returns {Promise<Array>} Lista de notificaciones programadas
 */
export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[getAllScheduledNotifications] Total:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('[getAllScheduledNotifications] Error:', error);
    return [];
  }
}
