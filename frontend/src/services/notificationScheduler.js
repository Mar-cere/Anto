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
  
  // Validar y normalizar language
  if (typeof language !== 'string') {
    language = 'es';
  }
  const lang = language === 'en' ? 'en' : 'es';
  const variations = NOTIFICATION_COPY[lang];
  
  // Rotar variación según sessionId (hash simple)
  const hash = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variationIndex = Math.abs(hash) % variations.length; // Usar Math.abs por si hash es negativo
  const variation = variations[variationIndex];
  
  // Si hay label, personalizarlo con límite y sanitización
  if (label && typeof label === 'string') {
    const sanitizedLabel = label.trim().slice(0, 50); // Límite 50 chars
    if (sanitizedLabel.length > 0) {
      return {
        title: lang === 'es' ? `Es tu momento: ${sanitizedLabel}` : `Your session: ${sanitizedLabel}`,
        body: variation.body,
      };
    }
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
    
    const timeParts = time.split(':');
    if (timeParts.length !== 2) {
      console.warn('[calculateNextTrigger] Invalid time split:', time);
      return null;
    }
    
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    
    // Validar que hours y minutes sean válidos después del parsing
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('[calculateNextTrigger] Invalid hours/minutes:', { hours, minutes });
      return null;
    }
    
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
    
    // Validar que la fecha resultante sea válida
    if (isNaN(nextTrigger.getTime())) {
      console.warn('[calculateNextTrigger] Invalid resulting date');
      return null;
    }
    
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
    
    if (!session.id || typeof session.id !== 'string' || session.id.trim().length === 0) {
      throw new Error('Invalid session.id');
    }
    
    if (session.dayOfWeek === undefined || session.dayOfWeek === null) {
      throw new Error('session.dayOfWeek is required');
    }
    
    if (!session.time || typeof session.time !== 'string') {
      throw new Error('session.time is required');
    }
    
    // Validar y normalizar language
    if (typeof language !== 'string') {
      language = 'es';
    }
    
    // Solicitar permisos si es necesario
    const permissionsResult = await Notifications.getPermissionsAsync();
    if (!permissionsResult || typeof permissionsResult !== 'object') {
      console.warn('[scheduleSessionNotification] Invalid permissions result');
      return null;
    }
    
    let finalStatus = permissionsResult.status;
    
    if (finalStatus !== 'granted') {
      const requestResult = await Notifications.requestPermissionsAsync();
      if (!requestResult || typeof requestResult !== 'object') {
        console.warn('[scheduleSessionNotification] Invalid request result');
        return null;
      }
      finalStatus = requestResult.status;
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
    const copy = getNotificationCopy(session.id, language, session.label);
    if (!copy || !copy.title || !copy.body) {
      console.warn('[scheduleSessionNotification] Invalid notification copy');
      throw new Error('Failed to generate notification copy');
    }
    
    // Validar trigger values antes de programar
    const timeParts = session.time.split(':');
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    
    if (isNaN(hour) || isNaN(minute)) {
      throw new Error('Invalid hour/minute values');
    }
    
    // Validar weekday para Expo (1-7)
    const weekday = session.dayOfWeek + 1;
    if (weekday < 1 || weekday > 7) {
      throw new Error('Invalid weekday value for Expo');
    }
    
    // Programar notificación recurrente (semanal)
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: {
          sessionId: session.id.trim(),
          type: 'scheduled_session',
          timestamp: trigger.toISOString(),
        },
        sound: true,
      },
      trigger: {
        weekday,
        hour,
        minute,
        repeats: true,
      },
    });
    
    // Validar que se recibió un notificationId válido
    if (!notificationId || typeof notificationId !== 'string' || notificationId.trim().length === 0) {
      console.warn('[scheduleSessionNotification] Invalid notificationId returned:', notificationId);
      return null;
    }
    
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
    
    // Validar y normalizar language
    if (typeof language !== 'string') {
      language = 'es';
    }
    
    // Límite de sesiones para evitar loops infinitos
    const MAX_SESSIONS = 50;
    if (sessions.length > MAX_SESSIONS) {
      console.warn(`[rescheduleAllSessions] Too many sessions (${sessions.length}), limiting to ${MAX_SESSIONS}`);
      sessions = sessions.slice(0, MAX_SESSIONS);
    }
    
    const results = [];
    
    for (const session of sessions) {
      // Validar que session es un objeto
      if (!session || typeof session !== 'object' || Array.isArray(session)) {
        console.warn('[rescheduleAllSessions] Skipping invalid session (not object):', session);
        results.push({ sessionId: 'unknown', success: false, error: 'Invalid session type' });
        continue;
      }
      
      // Validar sesión tiene campos requeridos
      if (!session.id || session.dayOfWeek === undefined || !session.time) {
        console.warn('[rescheduleAllSessions] Skipping invalid session:', session);
        results.push({ sessionId: session.id || 'unknown', success: false, error: 'Missing required fields' });
        continue;
      }
      
      // Validar tipos
      if (typeof session.id !== 'string') {
        console.warn('[rescheduleAllSessions] Skipping session with invalid id type:', session);
        results.push({ sessionId: 'invalid-id', success: false, error: 'Invalid id type' });
        continue;
      }
      
      // Solo re-programar si está activa
      if (session.isActive !== true) {
        console.log('[rescheduleAllSessions] Skipping inactive session:', session.id);
        results.push({ sessionId: session.id, success: true, skipped: true });
        continue;
      }
      
      // Cancelar notificación previa si existe
      if (session.notificationId && typeof session.notificationId === 'string') {
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
    
    // Límite de sesiones para evitar loops infinitos
    const MAX_SESSIONS = 50;
    if (sessions.length > MAX_SESSIONS) {
      console.warn(`[cancelAllSessionNotifications] Too many sessions (${sessions.length}), limiting to ${MAX_SESSIONS}`);
      sessions = sessions.slice(0, MAX_SESSIONS);
    }
    
    let cancelledCount = 0;
    
    for (const session of sessions) {
      // Validar que session es un objeto válido
      if (!session || typeof session !== 'object' || Array.isArray(session)) {
        continue;
      }
      
      // Validar que notificationId es válido
      if (session.notificationId && typeof session.notificationId === 'string' && session.notificationId.trim().length > 0) {
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
