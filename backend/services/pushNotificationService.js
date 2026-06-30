/**
 * Servicio de Notificaciones Push
 * 
 * Maneja el envío de notificaciones push a dispositivos móviles
 * usando Expo Push Notifications.
 * 
 * @author AntoApp Team
 */

import { Expo } from 'expo-server-sdk';
import { NOTIFICATION_ICON_URL } from '../constants/app.js';
import NotificationEngagement from '../models/NotificationEngagement.js';
import {
  getPushNotificationCopy,
  buildWeeklyProgressBody,
  pickRandom,
  normalizeNotificationLanguage,
} from './pushNotificationCopyPools.js';

function poolFor(options = {}) {
  return getPushNotificationCopy(options.language);
}

class PushNotificationService {
  constructor() {
    // Crear cliente de Expo
    this.expo = new Expo();
    
    // Tipos de notificaciones
    this.NOTIFICATION_TYPES = {
      // Crisis y seguimiento
      CRISIS_WARNING: 'crisis_warning',
      CRISIS_MEDIUM: 'crisis_medium',
      CRISIS_HIGH: 'crisis_high',
      FOLLOW_UP: 'crisis_followup',
      CRISIS_RESOURCES: 'crisis_resources',
      
      // Técnicas y bienestar
      TECHNIQUE_REMINDER: 'technique_reminder',
      BREATHING_REMINDER: 'breathing_reminder',
      MINDFULNESS_REMINDER: 'mindfulness_reminder',
      GROUNDING_REMINDER: 'grounding_reminder',
      PROGRESSIVE_RELAXATION: 'progressive_relaxation',
      
      // Progreso y logros
      PROGRESS_POSITIVE: 'progress_positive',
      ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
      STREAK_MILESTONE: 'streak_milestone',
      WEEKLY_PROGRESS: 'weekly_progress',
      PERSONAL_BEST: 'personal_best',
      
      // Hábitos y tareas
      HABIT_REMINDER: 'habit_reminder',
      HABIT_MISSED: 'habit_missed',
      TASK_REMINDER: 'task_reminder',
      TASK_OVERDUE: 'task_overdue',
      TASK_DUE_SOON: 'task_due_soon',
      
      // Check-ins y reflexión
      DAILY_CHECKIN: 'daily_checkin',
      EMOTIONAL_CHECKIN: 'emotional_checkin',
      GRATITUDE_REMINDER: 'gratitude_reminder',
      JOURNALING_PROMPT: 'journaling_prompt',
      WEEKLY_REFLECTION: 'weekly_reflection',
      BETWEEN_SESSIONS_NUDGE: 'between_sessions_nudge',
      
      // Motivación y apoyo
      MOTIVATIONAL_MESSAGE: 'motivational_message',
      MORNING_MOTIVATION: 'morning_motivation',
      EVENING_REFLECTION: 'evening_reflection',
      MIDDAY_MOTIVATION: 'midday_motivation',
      WEEKEND_REFLECTION: 'weekend_reflection',
      
      // Recordatorios preventivos
      WELLNESS_TIP: 'wellness_tip',
      SELF_CARE_REMINDER: 'self_care_reminder',
      HYDRATION_REMINDER: 'hydration_reminder',
      MOVEMENT_BREAK: 'movement_break',
      SLEEP_ROUTINE_REMINDER: 'sleep_routine_reminder',
      
      // Trial y suscripciones
      TRIAL_EXPIRING: 'trial_expiring',
      TRIAL_EXPIRED: 'trial_expired',
      SUBSCRIPTION_REMINDER: 'subscription_reminder',
      TRIAL_WELCOME: 'trial_welcome',
      SUBSCRIPTION_RENEWAL_HINT: 'subscription_renewal_hint',
      
      // Alertas de emergencia
      EMERGENCY_ALERT_SENT: 'emergency_alert_sent',
      EMERGENCY_CONTACT_UPDATED: 'emergency_contact_updated',
      EMERGENCY_TEST_REMINDER: 'emergency_test_reminder',
      EMERGENCY_SAFETY_REVIEW: 'emergency_safety_review',
      EMERGENCY_INFO_DIGEST: 'emergency_info_digest',
    };
  }

  /**
   * Valida si un token es válido
   * @param {string} token - Token push de Expo
   * @returns {boolean}
   */
  isValidToken(token) {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Normaliza título/cuerpo antes de Expo (trim, fallback, longitud).
   */
  _sanitizePushText(text, fallback, maxLen, language = 'es') {
    const lang = normalizeNotificationLanguage(language);
    const defaultBody =
      lang === 'en' ? 'You have a notification in Anto.' : 'Tienes una notificación en Anto.';
    const fb =
      String(fallback ?? '').trim() ||
      (maxLen <= 200 ? 'Anto' : defaultBody);
    if (text === undefined || text === null) {
      return fb.slice(0, maxLen);
    }
    const raw = typeof text === 'string' ? text : String(text);
    const trimmed = raw.trim();
    const out = (trimmed || fb).slice(0, maxLen);
    return out || fb;
  }

  /**
   * Envía una notificación push a un usuario
   * @param {string} pushToken - Token push del dispositivo
   * @param {string} title - Título de la notificación
   * @param {string} body - Cuerpo de la notificación
   * @param {Object} data - Datos adicionales
   * @param {string} type - Tipo de notificación
   * @param {string} userId - ID del usuario (opcional, para tracking)
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendNotification(pushToken, title, body, data = {}, type = 'default', userId = null) {
    try {
      // Validar token
      if (!this.isValidToken(pushToken)) {
        console.error('[PushNotificationService] ❌ Token inválido:', pushToken);
        return { success: false, error: 'Token inválido' };
      }

      const language = normalizeNotificationLanguage(data?.language);
      const safeTitle = this._sanitizePushText(title, 'Anto', 180, language);
      const safeBody = this._sanitizePushText(body, null, 500, language);

      // Determinar canal y prioridad según tipo
      const channelId = this.getChannelId(type);
      const priority = this.getPriority(type);
      const sound = this.getSound(type);

      // Construir mensaje
      const message = {
        to: pushToken,
        sound,
        title: safeTitle,
        body: safeBody,
        data: {
          ...data,
          type,
          timestamp: new Date().toISOString(),
        },
        priority,
        channelId,
        badge: 1,
        // Icono de la aplicación para Android (debe ser una URL pública)
        icon: NOTIFICATION_ICON_URL,
      };

      // Enviar notificación
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('[PushNotificationService] ❌ Error enviando chunk:', error);
          return { success: false, error: error.message };
        }
      }

      // Verificar resultados
      if (!tickets.length) {
        return { success: false, error: 'Sin respuesta del servicio de push' };
      }
      const ticket = tickets[0];
      const result = ticket.status === 'ok'
        ? { success: true, ticketId: ticket.id, title: safeTitle, body: safeBody }
        : {
            success: false,
            error: ticket.message || 'Error desconocido',
            title: safeTitle,
            body: safeBody,
          };

      // Registrar engagement si se proporciona userId
      if (userId) {
        try {
          await NotificationEngagement.create({
            userId,
            notificationType: type,
            pushToken,
            status: result.success ? 'sent' : 'error',
            notificationData: {
              title: safeTitle,
              body: safeBody,
              data
            },
            error: result.error || null
          });
        } catch (engagementError) {
          // No bloquear si falla el registro de engagement
          console.warn('[PushNotificationService] Error registrando engagement:', engagementError.message);
        }
      }

      if (result.success) {
        console.log('[PushNotificationService] ✅ Notificación enviada exitosamente');
      } else {
        console.error('[PushNotificationService] ❌ Error en ticket:', ticket);
      }

      return result;
    } catch (error) {
      console.error('[PushNotificationService] ❌ Error enviando notificación:', error);
      return { success: false, error: error.message };
    }
  }

  _send(pushToken, title, body, data, type, options = {}) {
    return this.sendNotification(
      pushToken,
      title,
      body,
      { ...data, language: options.language },
      type,
      options.userId ?? null,
    );
  }

  /**
   * Envía notificación de crisis WARNING
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendCrisisWarning(pushToken, options = {}) {
    const { emotion, intensity } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).crisisWarning.titles),
      pickRandom(poolFor(options).crisisWarning.bodies),
      {
        emotion,
        intensity,
        action: 'open_chat',
      },
      this.NOTIFICATION_TYPES.CRISIS_WARNING,
    options
    );
  }

  /**
   * Envía notificación de crisis MEDIUM
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendCrisisMedium(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).crisisMedium.titles),
      pickRandom(poolFor(options).crisisMedium.bodies),
      {
        action: 'open_chat',
        riskLevel: 'MEDIUM',
      },
      this.NOTIFICATION_TYPES.CRISIS_MEDIUM,
    options
    );
  }

  /**
   * Envía notificación de crisis HIGH
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendCrisisHigh(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).crisisHigh.titles),
      pickRandom(poolFor(options).crisisHigh.bodies),
      {
        action: 'open_chat',
        riskLevel: 'HIGH',
        emergency: true,
      },
      this.NOTIFICATION_TYPES.CRISIS_HIGH,
    options
    );
  }

  /**
   * Envía notificación de seguimiento post-crisis
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendFollowUp(pushToken, options = {}) {
    const { hoursSinceCrisis, message } = options;
    let body = message;
    if (!body) {
      if (hoursSinceCrisis != null && hoursSinceCrisis !== '') {
        body = pickRandom(poolFor(options).followUpWithHours(hoursSinceCrisis));
      } else {
        body = pickRandom(poolFor(options).followUpNoHours);
      }
    }
    return this._send(
      pushToken,
      pickRandom(
        poolFor(options).followUpTitles,
        options.language === 'en' ? '💙 How are you feeling now?' : '💙 ¿Cómo te sientes ahora?',
      ),
      body,
      {
        action: 'open_chat',
        followUp: true,
      },
      this.NOTIFICATION_TYPES.FOLLOW_UP,
    options
    );
  }

  /**
   * Check-in breve tras intercambio emocionalmente intenso (no es crisis MEDIUM/HIGH).
   */
  async sendWellbeingChatCheckIn(pushToken, options = {}) {
    const { conversationId } = options;
    const conv = conversationId != null ? String(conversationId) : undefined;

    return this._send(
      pushToken,
      pickRandom(poolFor(options).wellbeingCheckIn.titles),
      pickRandom(poolFor(options).wellbeingCheckIn.bodies),
      {
        action: 'open_chat',
        wellbeingCheckIn: true,
        ...(conv ? { conversationId: conv } : {})
      },
      this.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN,
    options
    );
  }

  /**
   * Envía recordatorio de técnica terapéutica
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendTechniqueReminder(pushToken, options = {}) {
    const { technique, emotion } = options;
    const safeTechnique =
      technique != null && String(technique).trim() !== ''
        ? String(technique).trim().slice(0, 120)
        : 'regulación emocional';
    const safeEmotion =
      emotion != null && String(emotion).trim() !== '' ? String(emotion).trim().slice(0, 80) : '';
    return this._send(
      pushToken,
      pickRandom(
        poolFor(options).techniqueTitles,
        options.language === 'en' ? '🧘 Regulation technique' : '🧘 Técnica de regulación',
      ),
      pickRandom(
        poolFor(options).techniqueBodies(safeTechnique, safeEmotion),
        `Te proponemos un ejercicio breve de ${safeTechnique} para acompañarte hoy.`
      ),
      {
        action: 'open_technique',
        technique: safeTechnique,
        emotion: safeEmotion || emotion,
      },
      this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER,
    options
    );
  }

  /**
   * Envía notificación de progreso positivo
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendProgressPositive(pushToken, options = {}) {
    const { achievement, message } = options;
    const ach = achievement || 'un avance importante';
    return this._send(
      pushToken,
      pickRandom(poolFor(options).progressPositive.titles),
      message || pickRandom(poolFor(options).progressPositive.bodies(ach)),
      {
        action: 'open_dashboard',
        achievement,
      },
      this.NOTIFICATION_TYPES.PROGRESS_POSITIVE,
    options
    );
  }

  /**
   * Envía recordatorio de hábito
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendHabitReminder(pushToken, options = {}) {
    const { habitName, habitId } = options;
    const name = habitName || 'tu hábito';
    return this._send(
      pushToken,
      pickRandom(poolFor(options).habitReminder.titles),
      pickRandom(poolFor(options).habitReminder.bodies(name)),
      {
        action: 'open_habits',
        habitId,
        habitName,
      },
      this.NOTIFICATION_TYPES.HABIT_REMINDER,
    options
    );
  }

  /**
   * Envía notificación de hábito perdido
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendHabitMissed(pushToken, options = {}) {
    const { habitName, streak } = options;
    const name = habitName || 'tu hábito';
    return this._send(
      pushToken,
      pickRandom(poolFor(options).habitMissed.titles),
      pickRandom(poolFor(options).habitMissed.bodies(name, streak)),
      {
        action: 'open_habits',
        habitName,
        streak,
      },
      this.NOTIFICATION_TYPES.HABIT_MISSED,
    options
    );
  }

  /**
   * Envía recordatorio de tarea
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendTaskReminder(pushToken, options = {}) {
    const { taskTitle, taskId, dueDate } = options;
    const title = taskTitle || (options.language === 'en' ? 'Task' : 'Tarea');
    return this._send(
      pushToken,
      pickRandom(poolFor(options).taskReminder.titles),
      pickRandom(poolFor(options).taskReminder.bodies(title, dueDate)),
      {
        action: 'open_tasks',
        taskId,
        taskTitle,
      },
      this.NOTIFICATION_TYPES.TASK_REMINDER,
    options
    );
  }

  /**
   * Envía notificación de tarea vencida
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendTaskOverdue(pushToken, options = {}) {
    const { taskTitle, taskId, daysOverdue } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).taskOverdue.titles),
      pickRandom(
        poolFor(options).taskOverdue.bodies(
          taskTitle || (options.language === 'en' ? 'Task' : 'Tarea'),
          daysOverdue,
        ),
      ),
      {
        action: 'open_tasks',
        taskId,
        taskTitle,
        overdue: true,
      },
      this.NOTIFICATION_TYPES.TASK_OVERDUE,
    options
    );
  }

  /**
   * Envía recordatorio de check-in diario
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendDailyCheckIn(pushToken, options = {}) {
    const { timeOfDay } = options;
    const greetings = {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
    };
    const greeting = greetings[timeOfDay] || 'Hola';
    const titlePool = poolFor(options).dailyCheckIn.titles(greeting);
    return this._send(
      pushToken,
      pickRandom(titlePool),
      pickRandom(poolFor(options).dailyCheckIn.bodies),
      {
        action: 'open_chat',
        checkIn: true,
        timeOfDay,
      },
      this.NOTIFICATION_TYPES.DAILY_CHECKIN,
    options
    );
  }

  async sendBetweenSessionsNudge(pushToken, options = {}) {
    const { message } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).betweenSessionsNudge.titles),
      message || pickRandom(poolFor(options).betweenSessionsNudge.bodies),
      {
        action: 'open_chat',
        betweenSessions: true,
      },
      this.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE,
    options
    );
  }

  /**
   * Envía recordatorio de respiración/meditación
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendBreathingReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).breathing.titles),
      pickRandom(poolFor(options).breathing.bodies),
      {
        action: 'open_technique',
        technique: 'breathing',
      },
      this.NOTIFICATION_TYPES.BREATHING_REMINDER,
    options
    );
  }

  /**
   * Envía recordatorio de mindfulness
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendMindfulnessReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).mindfulness.titles),
      pickRandom(poolFor(options).mindfulness.bodies),
      {
        action: 'open_technique',
        technique: 'mindfulness',
      },
      this.NOTIFICATION_TYPES.MINDFULNESS_REMINDER,
    options
    );
  }

  /**
   * Envía notificación de logro desbloqueado
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendAchievementUnlocked(pushToken, options = {}) {
    const { achievementName, description } = options;
    const name = achievementName || 'Logro';
    return this._send(
      pushToken,
      pickRandom(poolFor(options).achievement.titles),
      pickRandom(poolFor(options).achievement.bodies(name, description)),
      {
        action: 'open_dashboard',
        achievement: achievementName,
      },
      this.NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
    options
    );
  }

  /**
   * Envía notificación de hito de racha
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendStreakMilestone(pushToken, options = {}) {
    const { streak, type } = options;
    const typeText = type === 'habits' ? 'hábitos' : 'días';
    const raw = Number(streak);
    const streakSafe = Number.isFinite(raw)
      ? Math.max(0, Math.min(10000, Math.floor(raw)))
      : 0;
    return this._send(
      pushToken,
      pickRandom(
        poolFor(options).streak.titles,
        options.language === 'en' ? '🔥 Impressive streak!' : '🔥 ¡Racha impresionante!',
      ),
      pickRandom(
        poolFor(options).streak.bodies(streakSafe, typeText),
        `¡Llevas ${streakSafe} ${typeText} seguidos! Tu constancia cuenta.`
      ),
      {
        action: 'open_dashboard',
        streak: streakSafe,
        type,
      },
      this.NOTIFICATION_TYPES.STREAK_MILESTONE,
    options
    );
  }

  /**
   * Envía resumen de progreso semanal
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendWeeklyProgress(pushToken, options = {}) {
    const { completedHabits, completedTasks, emotionalTrend } = options;
    const body = buildWeeklyProgressBody(
      completedHabits,
      completedTasks,
      emotionalTrend,
      options.language,
    );
    return this._send(
      pushToken,
      pickRandom(poolFor(options).weeklyProgress.titles),
      body,
      {
        action: 'open_dashboard',
        weeklySummary: true,
      },
      this.NOTIFICATION_TYPES.WEEKLY_PROGRESS,
    options
    );
  }

  /**
   * Envía mensaje motivacional
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendMotivationalMessage(pushToken, options = {}) {
    const { message, timeOfDay } = options;
    const messagePool =
      poolFor(options).motivational[timeOfDay] || poolFor(options).motivational.morning;
    const selectedMessage = message || pickRandom(messagePool);
    return this._send(
      pushToken,
      pickRandom(poolFor(options).motivationalTitles),
      selectedMessage,
      {
        action: 'open_dashboard',
        motivational: true,
      },
      this.NOTIFICATION_TYPES.MOTIVATIONAL_MESSAGE,
    options
    );
  }

  /**
   * Envía recordatorio de gratitud
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendGratitudeReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).gratitude.titles),
      pickRandom(poolFor(options).gratitude.bodies),
      {
        action: 'open_chat',
        gratitude: true,
      },
      this.NOTIFICATION_TYPES.GRATITUDE_REMINDER,
    options
    );
  }

  /**
   * Envía consejo de bienestar
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendWellnessTip(pushToken, options = {}) {
    const { tip } = options;
    const selectedTip = tip || pickRandom(poolFor(options).wellnessTips);
    return this._send(
      pushToken,
      '💡 Consejo de bienestar',
      selectedTip,
      {
        action: 'open_dashboard',
        wellnessTip: true,
      },
      this.NOTIFICATION_TYPES.WELLNESS_TIP,
    options
    );
  }

  /**
   * Envía recordatorio de autocuidado
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendSelfCareReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).selfCare.titles),
      pickRandom(poolFor(options).selfCare.bodies),
      {
        action: 'open_dashboard',
        selfCare: true,
      },
      this.NOTIFICATION_TYPES.SELF_CARE_REMINDER,
    options
    );
  }

  /**
   * Envía notificación de trial próximo a expirar
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendTrialExpiring(pushToken, options = {}) {
    const { daysRemaining } = options;
    const raw = Number(daysRemaining);
    const dr =
      Number.isFinite(raw) && raw > 0 ? Math.min(365, Math.floor(raw)) : 1;
    const title = pickRandom(
      poolFor(options).trialExpiringTitles(dr),
      options.language === 'en' ? '⏰ Your trial' : '⏰ Tu trial',
    );
    const body = pickRandom(
      poolFor(options).trialExpiringBodies(dr),
      options.language === 'en'
        ? 'Your trial period is ending soon. Review plans when you can.'
        : 'Tu período de prueba está por terminar. Revisa los planes cuando puedas.',
    );
    return this._send(
      pushToken,
      title,
      body,
      {
        action: 'open_subscription',
        daysRemaining: dr,
      },
      this.NOTIFICATION_TYPES.TRIAL_EXPIRING,
    options
    );
  }

  /**
   * Envía notificación de trial expirado
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendTrialExpired(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).trialExpired.titles),
      pickRandom(poolFor(options).trialExpired.bodies),
      {
        action: 'open_subscription',
      },
      this.NOTIFICATION_TYPES.TRIAL_EXPIRED,
    options
    );
  }

  /**
   * Envía recordatorio de suscripción
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendSubscriptionReminder(pushToken, options = {}) {
    const { message } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).subscriptionReminder.titles),
      message || pickRandom(poolFor(options).subscriptionReminder.bodies),
      {
        action: 'open_subscription',
      },
      this.NOTIFICATION_TYPES.SUBSCRIPTION_REMINDER,
    options
    );
  }

  /**
   * Envía notificación al usuario cuando se envían alertas de emergencia
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendEmergencyAlertSent(pushToken, options = {}) {
    const { successfulSends, totalContacts, riskLevel, isTest } = options;
    const ok = successfulSends ?? 0;
    const total = totalContacts ?? 0;
    const title = isTest
      ? pickRandom(poolFor(options).emergencySent.testTitles)
      : pickRandom(poolFor(options).emergencySent.liveTitles);
    const body = isTest
      ? pickRandom(poolFor(options).emergencySent.testBodies(ok, total))
      : pickRandom(poolFor(options).emergencySent.liveBodies(ok, total));
    return this._send(
      pushToken,
      title,
      body,
      {
        action: 'open_emergency_alerts',
        riskLevel,
        successfulSends,
        totalContacts,
        isTest: isTest || false,
      },
      this.NOTIFICATION_TYPES.EMERGENCY_ALERT_SENT,
    options
    );
  }

  /**
   * Recursos y contención tras momento de alerta (sin escalamiento automático).
   */
  async sendCrisisResources(pushToken, options = {}) {
    const { message } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).crisisResources.titles),
      message || pickRandom(poolFor(options).crisisResources.bodies),
      { action: 'open_chat', resources: true },
      this.NOTIFICATION_TYPES.CRISIS_RESOURCES,
    options
    );
  }

  async sendGroundingReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).grounding.titles),
      pickRandom(poolFor(options).grounding.bodies),
      { action: 'open_technique', technique: 'grounding' },
      this.NOTIFICATION_TYPES.GROUNDING_REMINDER,
    options
    );
  }

  async sendProgressiveRelaxation(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).progressiveRelaxation.titles),
      pickRandom(poolFor(options).progressiveRelaxation.bodies),
      { action: 'open_technique', technique: 'progressive_relaxation' },
      this.NOTIFICATION_TYPES.PROGRESSIVE_RELAXATION,
    options
    );
  }

  async sendPersonalBest(pushToken, options = {}) {
    const { metric, value } = options;
    const m = metric || 'tu seguimiento';
    const v = value ?? '¡sigue así!';
    return this._send(
      pushToken,
      pickRandom(
        poolFor(options).personalBest.titles,
        options.language === 'en' ? '⭐ New personal best' : '⭐ Nuevo récord personal',
      ),
      pickRandom(
        poolFor(options).personalBest.bodies(m, v),
        options.language === 'en'
          ? `You beat your best in ${m}: ${v}`.trim()
          : `Superaste tu mejor marca en ${m}: ${v}`.trim(),
      ),
      { action: 'open_dashboard', personalBest: true },
      this.NOTIFICATION_TYPES.PERSONAL_BEST,
    options
    );
  }

  async sendTaskDueSoon(pushToken, options = {}) {
    const { taskTitle, taskId, dueIn } = options;
    const t = taskTitle || 'Tu tarea';
    const d = dueIn || 'pronto';
    return this._send(
      pushToken,
      pickRandom(poolFor(options).taskDueSoon.titles),
      pickRandom(poolFor(options).taskDueSoon.bodies(t, d)),
      { action: 'open_tasks', taskId, taskTitle, dueSoon: true },
      this.NOTIFICATION_TYPES.TASK_DUE_SOON,
    options
    );
  }

  async sendJournalingPrompt(pushToken, options = {}) {
    const { prompt } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).journaling.titles),
      prompt || pickRandom(poolFor(options).journaling.bodies),
      { action: 'open_chat', journaling: true },
      this.NOTIFICATION_TYPES.JOURNALING_PROMPT,
    options
    );
  }

  async sendWeeklyReflection(pushToken, options = {}) {
    const { summary } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).weeklyReflection.titles),
      summary || pickRandom(poolFor(options).weeklyReflection.bodies),
      { action: 'open_dashboard', weeklyReflection: true },
      this.NOTIFICATION_TYPES.WEEKLY_REFLECTION,
    options
    );
  }

  async sendMiddayMotivation(pushToken, options = {}) {
    const { message } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).midday.titles),
      message || pickRandom(poolFor(options).midday.bodies),
      { action: 'open_dashboard', midday: true },
      this.NOTIFICATION_TYPES.MIDDAY_MOTIVATION,
    options
    );
  }

  async sendWeekendReflection(pushToken, options = {}) {
    const { message } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).weekend.titles),
      message || pickRandom(poolFor(options).weekend.bodies),
      { action: 'open_dashboard', weekend: true },
      this.NOTIFICATION_TYPES.WEEKEND_REFLECTION,
    options
    );
  }

  async sendHydrationReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).hydration.titles),
      pickRandom(poolFor(options).hydration.bodies),
      { action: 'open_dashboard', hydration: true },
      this.NOTIFICATION_TYPES.HYDRATION_REMINDER,
    options
    );
  }

  async sendMovementBreak(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).movementBreak.titles),
      pickRandom(poolFor(options).movementBreak.bodies),
      { action: 'open_dashboard', movementBreak: true },
      this.NOTIFICATION_TYPES.MOVEMENT_BREAK,
    options
    );
  }

  async sendSleepRoutineReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).sleepRoutine.titles),
      pickRandom(poolFor(options).sleepRoutine.bodies),
      { action: 'open_dashboard', sleepRoutine: true },
      this.NOTIFICATION_TYPES.SLEEP_ROUTINE_REMINDER,
    options
    );
  }

  async sendTrialWelcome(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).trialWelcome.titles),
      pickRandom(poolFor(options).trialWelcome.bodies),
      { action: 'open_dashboard', trialWelcome: true },
      this.NOTIFICATION_TYPES.TRIAL_WELCOME,
    options
    );
  }

  async sendSubscriptionRenewalHint(pushToken, options = {}) {
    const { message } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).renewalHint.titles),
      message || pickRandom(poolFor(options).renewalHint.bodies),
      { action: 'open_subscription', renewalHint: true },
      this.NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_HINT,
    options
    );
  }

  async sendEmergencyContactUpdated(pushToken, options = {}) {
    const { contactName } = options;
    const body = contactName
      ? pickRandom(poolFor(options).emergencyContactUpdated.bodiesWithName(contactName))
      : pickRandom(poolFor(options).emergencyContactUpdated.bodiesGeneric);
    return this._send(
      pushToken,
      pickRandom(poolFor(options).emergencyContactUpdated.titles),
      body,
      { action: 'open_emergency_alerts', contactUpdated: true },
      this.NOTIFICATION_TYPES.EMERGENCY_CONTACT_UPDATED,
    options
    );
  }

  async sendEmergencyTestReminder(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).emergencyTestReminder.titles),
      pickRandom(poolFor(options).emergencyTestReminder.bodies),
      { action: 'open_emergency_alerts', testReminder: true },
      this.NOTIFICATION_TYPES.EMERGENCY_TEST_REMINDER,
    options
    );
  }

  async sendEmergencySafetyReview(pushToken, options = {}) {
    return this._send(
      pushToken,
      pickRandom(poolFor(options).emergencySafetyReview.titles),
      pickRandom(poolFor(options).emergencySafetyReview.bodies),
      { action: 'open_emergency_alerts', safetyReview: true },
      this.NOTIFICATION_TYPES.EMERGENCY_SAFETY_REVIEW,
    options
    );
  }

  async sendEmergencyInfoDigest(pushToken, options = {}) {
    const { snippet } = options;
    return this._send(
      pushToken,
      pickRandom(poolFor(options).emergencyInfoDigest.titles),
      snippet || pickRandom(poolFor(options).emergencyInfoDigest.bodies),
      { action: 'open_emergency_alerts', infoDigest: true },
      this.NOTIFICATION_TYPES.EMERGENCY_INFO_DIGEST,
    options
    );
  }

  /**
   * Envía notificaciones a múltiples tokens
   * @param {Array<string>} pushTokens - Array de tokens
   * @param {string} title - Título
   * @param {string} body - Cuerpo
   * @param {Object} data - Datos adicionales
   * @param {string} type - Tipo de notificación
   * @returns {Promise<Object>} Resultados del envío
   */
  async sendBulkNotifications(pushTokens, title, body, data = {}, type = 'default') {
    try {
      // Filtrar tokens válidos
      const validTokens = pushTokens.filter(token => this.isValidToken(token));
      
      if (validTokens.length === 0) {
        return { success: false, error: 'No hay tokens válidos' };
      }

      const channelId = this.getChannelId(type);
      const priority = this.getPriority(type);
      const sound = this.getSound(type);

      // Construir mensajes
      const messages = validTokens.map(token => ({
        to: token,
        sound,
        title,
        body,
        data: {
          ...data,
          type,
          timestamp: new Date().toISOString(),
        },
        priority,
        channelId,
        badge: 1,
        // Icono de la aplicación para Android (debe ser una URL pública)
        icon: NOTIFICATION_ICON_URL,
      }));

      // Enviar en chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('[PushNotificationService] ❌ Error enviando chunk:', error);
        }
      }

      // Contar éxitos y errores
      const successful = tickets.filter(t => t.status === 'ok').length;
      const failed = tickets.filter(t => t.status !== 'ok').length;

      return {
        success: successful > 0,
        successful,
        failed,
        total: tickets.length,
        tickets,
      };
    } catch (error) {
      console.error('[PushNotificationService] ❌ Error enviando notificaciones bulk:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el canal de Android según el tipo
   * @param {string} type - Tipo de notificación
   * @returns {string}
   */
  getChannelId(type) {
    const channelMap = {
      // Crisis - canal de máxima prioridad
      [this.NOTIFICATION_TYPES.CRISIS_WARNING]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.CRISIS_MEDIUM]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.CRISIS_HIGH]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.FOLLOW_UP]: 'anto-followup',
      [this.NOTIFICATION_TYPES.CRISIS_RESOURCES]: 'anto-crisis',
      
      // Técnicas y bienestar - canal de alta prioridad
      [this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.BREATHING_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.MINDFULNESS_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.GROUNDING_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.PROGRESSIVE_RELAXATION]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.WELLNESS_TIP]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.SELF_CARE_REMINDER]: 'anto-reminders',
      
      // Progreso y logros - canal de alta prioridad
      [this.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.STREAK_MILESTONE]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.WEEKLY_PROGRESS]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.PERSONAL_BEST]: 'anto-reminders',
      
      // Hábitos y tareas - canal de recordatorios
      [this.NOTIFICATION_TYPES.HABIT_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.HABIT_MISSED]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.TASK_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.TASK_OVERDUE]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.TASK_DUE_SOON]: 'anto-reminders',
      
      // Check-ins y reflexión - canal de recordatorios
      [this.NOTIFICATION_TYPES.DAILY_CHECKIN]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.GRATITUDE_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.JOURNALING_PROMPT]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.WEEKLY_REFLECTION]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE]: 'anto-reminders',
      
      // Motivación - canal de recordatorios
      [this.NOTIFICATION_TYPES.MOTIVATIONAL_MESSAGE]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.MORNING_MOTIVATION]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.EVENING_REFLECTION]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.MIDDAY_MOTIVATION]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.WEEKEND_REFLECTION]: 'anto-reminders',
      
      // Recordatorios preventivos
      [this.NOTIFICATION_TYPES.HYDRATION_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.MOVEMENT_BREAK]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.SLEEP_ROUTINE_REMINDER]: 'anto-reminders',
      
      // Trial y suscripciones - canal dedicado
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRING]: 'anto-trial',
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRED]: 'anto-trial',
      [this.NOTIFICATION_TYPES.SUBSCRIPTION_REMINDER]: 'anto-trial',
      [this.NOTIFICATION_TYPES.TRIAL_WELCOME]: 'anto-trial',
      [this.NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_HINT]: 'anto-trial',
      
      // Alertas de emergencia - canal de crisis
      [this.NOTIFICATION_TYPES.EMERGENCY_ALERT_SENT]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.EMERGENCY_CONTACT_UPDATED]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.EMERGENCY_TEST_REMINDER]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.EMERGENCY_SAFETY_REVIEW]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.EMERGENCY_INFO_DIGEST]: 'anto-crisis',
    };
    return channelMap[type] || 'anto-notifications';
  }

  /**
   * Obtiene la prioridad según el tipo
   * @param {string} type - Tipo de notificación
   * @returns {string}
   */
  getPriority(type) {
    const priorityMap = {
      // Crisis - máxima prioridad
      [this.NOTIFICATION_TYPES.CRISIS_WARNING]: 'high',
      [this.NOTIFICATION_TYPES.CRISIS_MEDIUM]: 'high',
      [this.NOTIFICATION_TYPES.CRISIS_HIGH]: 'high',
      [this.NOTIFICATION_TYPES.FOLLOW_UP]: 'high',
      [this.NOTIFICATION_TYPES.CRISIS_RESOURCES]: 'high',
      
      // Tareas vencidas - alta prioridad
      [this.NOTIFICATION_TYPES.TASK_OVERDUE]: 'high',
      [this.NOTIFICATION_TYPES.HABIT_MISSED]: 'high',
      
      // Recordatorios importantes - alta prioridad
      [this.NOTIFICATION_TYPES.HABIT_REMINDER]: 'high',
      [this.NOTIFICATION_TYPES.TASK_REMINDER]: 'high',
      [this.NOTIFICATION_TYPES.TASK_DUE_SOON]: 'high',
      [this.NOTIFICATION_TYPES.DAILY_CHECKIN]: 'high',
      [this.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN]: 'high',
      
      // Técnicas y bienestar - prioridad normal
      [this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.BREATHING_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.MINDFULNESS_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.GROUNDING_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.PROGRESSIVE_RELAXATION]: 'default',
      [this.NOTIFICATION_TYPES.WELLNESS_TIP]: 'default',
      [this.NOTIFICATION_TYPES.SELF_CARE_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.HYDRATION_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.MOVEMENT_BREAK]: 'default',
      [this.NOTIFICATION_TYPES.SLEEP_ROUTINE_REMINDER]: 'default',
      
      // Progreso y logros - prioridad normal
      [this.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'default',
      [this.NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED]: 'default',
      [this.NOTIFICATION_TYPES.STREAK_MILESTONE]: 'default',
      [this.NOTIFICATION_TYPES.WEEKLY_PROGRESS]: 'default',
      [this.NOTIFICATION_TYPES.PERSONAL_BEST]: 'default',
      
      // Motivación y reflexión - prioridad normal
      [this.NOTIFICATION_TYPES.MOTIVATIONAL_MESSAGE]: 'default',
      [this.NOTIFICATION_TYPES.MORNING_MOTIVATION]: 'default',
      [this.NOTIFICATION_TYPES.EVENING_REFLECTION]: 'default',
      [this.NOTIFICATION_TYPES.MIDDAY_MOTIVATION]: 'default',
      [this.NOTIFICATION_TYPES.WEEKEND_REFLECTION]: 'default',
      [this.NOTIFICATION_TYPES.GRATITUDE_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.JOURNALING_PROMPT]: 'default',
      [this.NOTIFICATION_TYPES.WEEKLY_REFLECTION]: 'default',
      [this.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE]: 'default',
      
      // Trial y suscripciones - alta prioridad
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRING]: 'high',
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRED]: 'high',
      [this.NOTIFICATION_TYPES.SUBSCRIPTION_REMINDER]: 'high',
      [this.NOTIFICATION_TYPES.TRIAL_WELCOME]: 'high',
      [this.NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_HINT]: 'high',
      
      // Alertas de emergencia - alta prioridad
      [this.NOTIFICATION_TYPES.EMERGENCY_ALERT_SENT]: 'high',
      [this.NOTIFICATION_TYPES.EMERGENCY_CONTACT_UPDATED]: 'high',
      [this.NOTIFICATION_TYPES.EMERGENCY_TEST_REMINDER]: 'high',
      [this.NOTIFICATION_TYPES.EMERGENCY_SAFETY_REVIEW]: 'high',
      [this.NOTIFICATION_TYPES.EMERGENCY_INFO_DIGEST]: 'high',
    };
    return priorityMap[type] || 'default';
  }

  /**
   * Obtiene el sonido según el tipo
   * @param {string} type - Tipo de notificación
   * @returns {string}
   */
  getSound(type) {
    const soundMap = {
      [this.NOTIFICATION_TYPES.CRISIS_WARNING]: 'default',
      [this.NOTIFICATION_TYPES.CRISIS_MEDIUM]: 'default',
      [this.NOTIFICATION_TYPES.CRISIS_HIGH]: 'default',
      [this.NOTIFICATION_TYPES.FOLLOW_UP]: 'default',
      [this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'default',
    };
    return soundMap[type] || 'default';
  }
}

// Exportar instancia singleton
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

