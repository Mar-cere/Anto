/**
 * Servicio de Programación de Notificaciones
 * 
 * Gestiona la programación automática de notificaciones recurrentes
 * basadas en preferencias del usuario y comportamiento
 */

import User from '../models/User.js';
import pushNotificationService from './pushNotificationService.js';
import NotificationEngagement from '../models/NotificationEngagement.js';

class NotificationScheduler {
  constructor() {
    // Intervalo para verificar notificaciones programadas (cada minuto)
    this.CHECK_INTERVAL_MS = 60 * 1000;
    
    // Intervalo para verificar usuarios inactivos (cada hora)
    this.INACTIVITY_CHECK_INTERVAL_MS = 60 * 60 * 1000;
    
    this.isRunning = false;
  }

  /**
   * Programa notificaciones recurrentes para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la programación
   */
  async scheduleUserNotifications(userId) {
    try {
      const user = await User.findById(userId).select('notificationPreferences pushToken');
      
      if (!user || !user.pushToken) {
        return { success: false, reason: 'Usuario no encontrado o sin token push' };
      }

      if (!user.notificationPreferences?.enabled) {
        return { success: false, reason: 'Notificaciones deshabilitadas' };
      }

      const scheduled = [];

      // Programar notificación matutina si está habilitada
      if (user.notificationPreferences.morning?.enabled) {
        const morningHour = user.notificationPreferences.morning.hour || 8;
        const morningMinute = user.notificationPreferences.morning.minute || 0;
        
        // Verificar si es hora de enviar
        const now = new Date();
        const morningTime = new Date();
        morningTime.setHours(morningHour, morningMinute, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (morningTime <= now) {
          morningTime.setDate(morningTime.getDate() + 1);
        }

        scheduled.push({
          type: 'morning',
          scheduledAt: morningTime,
          notificationType: pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION
        });
      }

      // Programar notificación vespertina si está habilitada
      if (user.notificationPreferences.evening?.enabled) {
        const eveningHour = user.notificationPreferences.evening.hour || 19;
        const eveningMinute = user.notificationPreferences.evening.minute || 0;
        
        const now = new Date();
        const eveningTime = new Date();
        eveningTime.setHours(eveningHour, eveningMinute, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (eveningTime <= now) {
          eveningTime.setDate(eveningTime.getDate() + 1);
        }

        scheduled.push({
          type: 'evening',
          scheduledAt: eveningTime,
          notificationType: pushNotificationService.NOTIFICATION_TYPES.EVENING_REFLECTION
        });
      }

      return {
        success: true,
        scheduled: scheduled.length,
        notifications: scheduled
      };
    } catch (error) {
      console.error('[NotificationScheduler] Error programando notificaciones:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Verifica y envía notificaciones programadas
   * @returns {Promise<Object>} Resumen de notificaciones enviadas
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const users = await User.find({
        'notificationPreferences.enabled': true,
        pushToken: { $exists: true, $ne: null }
      }).select('notificationPreferences pushToken _id');

      const results = {
        checked: users.length,
        sent: 0,
        skipped: 0,
        errors: 0
      };

      for (const user of users) {
        try {
          // Verificar notificación matutina
          if (user.notificationPreferences?.morning?.enabled) {
            const morningHour = user.notificationPreferences.morning.hour || 8;
            const morningMinute = user.notificationPreferences.morning.minute || 0;
            
            if (now.getHours() === morningHour && now.getMinutes() === morningMinute) {
              await this.sendScheduledNotification(
                user._id,
                user.pushToken,
                pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION,
                { timeOfDay: 'morning' }
              );
              results.sent++;
            }
          }

          // Verificar notificación vespertina
          if (user.notificationPreferences?.evening?.enabled) {
            const eveningHour = user.notificationPreferences.evening.hour || 19;
            const eveningMinute = user.notificationPreferences.evening.minute || 0;
            
            if (now.getHours() === eveningHour && now.getMinutes() === eveningMinute) {
              await this.sendScheduledNotification(
                user._id,
                user.pushToken,
                pushNotificationService.NOTIFICATION_TYPES.EVENING_REFLECTION,
                { timeOfDay: 'evening' }
              );
              results.sent++;
            }
          }

          results.skipped++;
        } catch (error) {
          console.error(`[NotificationScheduler] Error procesando usuario ${user._id}:`, error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('[NotificationScheduler] Error procesando notificaciones programadas:', error);
      return { checked: 0, sent: 0, skipped: 0, errors: 1 };
    }
  }

  /**
   * Envía una notificación programada y registra el engagement
   * @param {string} userId - ID del usuario
   * @param {string} pushToken - Token push
   * @param {string} notificationType - Tipo de notificación
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<boolean>} True si se envió exitosamente
   */
  async sendScheduledNotification(userId, pushToken, notificationType, options = {}) {
    try {
      let result;
      
      // Enviar según el tipo
      switch (notificationType) {
        case pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION:
          result = await pushNotificationService.sendMotivationalMessage(pushToken, {
            timeOfDay: 'morning',
            ...options
          });
          break;
        case pushNotificationService.NOTIFICATION_TYPES.EVENING_REFLECTION:
          result = await pushNotificationService.sendMotivationalMessage(pushToken, {
            timeOfDay: 'evening',
            ...options
          });
          break;
        case pushNotificationService.NOTIFICATION_TYPES.DAILY_CHECKIN:
          result = await pushNotificationService.sendDailyCheckIn(pushToken, options);
          break;
        default:
          result = { success: false, error: 'Tipo de notificación no soportado' };
      }

      // Registrar engagement
      await NotificationEngagement.create({
        userId,
        notificationType,
        pushToken,
        status: result.success ? 'sent' : 'error',
        notificationData: {
          title: result.title || '',
          body: result.body || '',
          data: options
        },
        error: result.error || null,
        metadata: {
          timeOfDay: options.timeOfDay || 'unknown'
        }
      });

      return result.success;
    } catch (error) {
      console.error('[NotificationScheduler] Error enviando notificación programada:', error);
      return false;
    }
  }

  /**
   * Envía notificaciones basadas en comportamiento del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} behaviorData - Datos de comportamiento
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendBehaviorBasedNotification(userId, behaviorData) {
    try {
      const user = await User.findById(userId).select('pushToken notificationPreferences');
      
      if (!user || !user.pushToken) {
        return { success: false, reason: 'Usuario no encontrado o sin token push' };
      }

      if (!user.notificationPreferences?.enabled) {
        return { success: false, reason: 'Notificaciones deshabilitadas' };
      }

      const { inactivity, emotionalState, progress, lastInteraction } = behaviorData;
      let notificationType = null;
      let options = {};

      // Notificación por inactividad
      if (inactivity && inactivity.hours > 48) {
        notificationType = pushNotificationService.NOTIFICATION_TYPES.DAILY_CHECKIN;
        options = {
          message: 'Hace tiempo que no hablamos. ¿Cómo has estado?'
        };
      }
      // Notificación por progreso positivo
      else if (progress && progress.improvement) {
        notificationType = pushNotificationService.NOTIFICATION_TYPES.PROGRESS_POSITIVE;
        options = {
          achievement: 'Progreso positivo',
          message: 'Has estado mejorando. ¡Sigue así!'
        };
      }
      // Notificación por estado emocional negativo persistente
      else if (emotionalState && emotionalState.negativeStreak > 3) {
        notificationType = pushNotificationService.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN;
        options = {
          message: 'Noto que has estado pasando por momentos difíciles. ¿Quieres hablar?'
        };
      }

      if (!notificationType) {
        return { success: false, reason: 'No se requiere notificación basada en comportamiento' };
      }

      // Verificar preferencias de tipo
      const typeKey = this.getPreferenceKey(notificationType);
      if (user.notificationPreferences.types && 
          user.notificationPreferences.types[typeKey] === false) {
        return { success: false, reason: 'Tipo de notificación deshabilitado por el usuario' };
      }

      const result = await this.sendScheduledNotification(
        userId,
        user.pushToken,
        notificationType,
        options
      );

      return {
        success: result,
        notificationType,
        reason: this.getBehaviorReason(behaviorData)
      };
    } catch (error) {
      console.error('[NotificationScheduler] Error enviando notificación basada en comportamiento:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Obtiene la clave de preferencia para un tipo de notificación
   * @param {string} notificationType - Tipo de notificación
   * @returns {string} Clave de preferencia
   */
  getPreferenceKey(notificationType) {
    const mapping = {
      [pushNotificationService.NOTIFICATION_TYPES.DAILY_CHECKIN]: 'dailyReminders',
      [pushNotificationService.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN]: 'dailyReminders',
      [pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION]: 'motivationalMessages',
      [pushNotificationService.NOTIFICATION_TYPES.EVENING_REFLECTION]: 'motivationalMessages',
      [pushNotificationService.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'motivationalMessages'
    };
    return mapping[notificationType] || 'dailyReminders';
  }

  /**
   * Obtiene la razón del comportamiento detectado
   * @param {Object} behaviorData - Datos de comportamiento
   * @returns {string} Razón
   */
  getBehaviorReason(behaviorData) {
    if (behaviorData.inactivity && behaviorData.inactivity.hours > 48) {
      return 'inactivity';
    }
    if (behaviorData.progress && behaviorData.progress.improvement) {
      return 'progress';
    }
    if (behaviorData.emotionalState && behaviorData.emotionalState.negativeStreak > 3) {
      return 'emotional_state';
    }
    return 'unknown';
  }

  /**
   * Verifica usuarios inactivos y envía notificaciones si es apropiado
   * @returns {Promise<Object>} Resumen de verificación
   */
  async checkInactiveUsers() {
    try {
      const hoursThreshold = 48; // 48 horas de inactividad
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

      const inactiveUsers = await User.find({
        'notificationPreferences.enabled': true,
        pushToken: { $exists: true, $ne: null },
        'stats.lastActive': { $lt: thresholdDate }
      }).select('_id pushToken notificationPreferences stats');

      const results = {
        checked: inactiveUsers.length,
        notified: 0,
        skipped: 0,
        errors: 0
      };

      for (const user of inactiveUsers) {
        try {
          // Verificar si el usuario tiene habilitadas las notificaciones diarias
          if (user.notificationPreferences?.types?.dailyReminders === false) {
            results.skipped++;
            continue;
          }

          const hoursInactive = Math.floor(
            (Date.now() - new Date(user.stats.lastActive).getTime()) / (1000 * 60 * 60)
          );

          const result = await this.sendBehaviorBasedNotification(user._id, {
            inactivity: { hours: hoursInactive }
          });

          if (result.success) {
            results.notified++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          console.error(`[NotificationScheduler] Error verificando usuario inactivo ${user._id}:`, error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('[NotificationScheduler] Error verificando usuarios inactivos:', error);
      return { checked: 0, notified: 0, skipped: 0, errors: 1 };
    }
  }

  /**
   * Inicia el servicio de programación
   */
  start() {
    if (this.isRunning) {
      console.warn('[NotificationScheduler] El servicio ya está corriendo');
      return;
    }

    this.isRunning = true;

    // Procesar notificaciones programadas cada minuto
    setInterval(() => {
      this.processScheduledNotifications().catch(err => {
        console.error('[NotificationScheduler] Error en intervalo de notificaciones programadas:', err);
      });
    }, this.CHECK_INTERVAL_MS);

    // Verificar usuarios inactivos cada hora
    setInterval(() => {
      this.checkInactiveUsers().catch(err => {
        console.error('[NotificationScheduler] Error en intervalo de usuarios inactivos:', err);
      });
    }, this.INACTIVITY_CHECK_INTERVAL_MS);

    // Ejecutar inmediatamente al iniciar
    this.processScheduledNotifications().catch(err => {
      console.error('[NotificationScheduler] Error en procesamiento inicial:', err);
    });

    this.checkInactiveUsers().catch(err => {
      console.error('[NotificationScheduler] Error en verificación inicial de inactivos:', err);
    });

    console.log('[NotificationScheduler] ✅ Servicio de programación de notificaciones iniciado');
  }

  /**
   * Detiene el servicio de programación
   */
  stop() {
    this.isRunning = false;
    console.log('[NotificationScheduler] ⏹️ Servicio de programación de notificaciones detenido');
  }
}

const notificationScheduler = new NotificationScheduler();
export default notificationScheduler;

