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
      
      // Técnicas y bienestar
      TECHNIQUE_REMINDER: 'technique_reminder',
      BREATHING_REMINDER: 'breathing_reminder',
      MINDFULNESS_REMINDER: 'mindfulness_reminder',
      
      // Progreso y logros
      PROGRESS_POSITIVE: 'progress_positive',
      ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
      STREAK_MILESTONE: 'streak_milestone',
      WEEKLY_PROGRESS: 'weekly_progress',
      
      // Hábitos y tareas
      HABIT_REMINDER: 'habit_reminder',
      HABIT_MISSED: 'habit_missed',
      TASK_REMINDER: 'task_reminder',
      TASK_OVERDUE: 'task_overdue',
      
      // Check-ins y reflexión
      DAILY_CHECKIN: 'daily_checkin',
      EMOTIONAL_CHECKIN: 'emotional_checkin',
      GRATITUDE_REMINDER: 'gratitude_reminder',
      
      // Motivación y apoyo
      MOTIVATIONAL_MESSAGE: 'motivational_message',
      MORNING_MOTIVATION: 'morning_motivation',
      EVENING_REFLECTION: 'evening_reflection',
      
      // Recordatorios preventivos
      WELLNESS_TIP: 'wellness_tip',
      SELF_CARE_REMINDER: 'self_care_reminder',
      
      // Trial y suscripciones
      TRIAL_EXPIRING: 'trial_expiring',
      TRIAL_EXPIRED: 'trial_expired',
      SUBSCRIPTION_REMINDER: 'subscription_reminder',
      
      // Alertas de emergencia
      EMERGENCY_ALERT_SENT: 'emergency_alert_sent',
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

      // Determinar canal y prioridad según tipo
      const channelId = this.getChannelId(type);
      const priority = this.getPriority(type);
      const sound = this.getSound(type);

      // Construir mensaje
      const message = {
        to: pushToken,
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
      const ticket = tickets[0];
      const result = ticket.status === 'ok'
        ? { success: true, ticketId: ticket.id, title, body }
        : { success: false, error: ticket.message || 'Error desconocido', title, body };

      // Registrar engagement si se proporciona userId
      if (userId) {
        try {
          await NotificationEngagement.create({
            userId,
            notificationType: type,
            pushToken,
            status: result.success ? 'sent' : 'error',
            notificationData: {
              title,
              body,
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

  /**
   * Envía notificación de crisis WARNING
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendCrisisWarning(pushToken, options = {}) {
    const { emotion, intensity } = options;
    
    return this.sendNotification(
      pushToken,
      '⚠️ Cuidado con tu bienestar',
      `Detectamos que estás pasando por un momento difícil. ¿Quieres que te ayudemos con algunas técnicas de regulación?`,
      {
        emotion,
        intensity,
        action: 'open_chat',
      },
      this.NOTIFICATION_TYPES.CRISIS_WARNING
    );
  }

  /**
   * Envía notificación de crisis MEDIUM
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendCrisisMedium(pushToken, options = {}) {
    return this.sendNotification(
      pushToken,
      '🔔 Apoyo disponible',
      `Estamos aquí para ti. Hemos notificado a tus contactos de emergencia. ¿Quieres conversar?`,
      {
        action: 'open_chat',
        riskLevel: 'MEDIUM',
      },
      this.NOTIFICATION_TYPES.CRISIS_MEDIUM
    );
  }

  /**
   * Envía notificación de crisis HIGH
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendCrisisHigh(pushToken, options = {}) {
    return this.sendNotification(
      pushToken,
      '🚨 Apoyo inmediato',
      `Tu seguridad es importante. Hemos notificado a tus contactos de emergencia. Estamos aquí para ayudarte.`,
      {
        action: 'open_chat',
        riskLevel: 'HIGH',
        emergency: true,
      },
      this.NOTIFICATION_TYPES.CRISIS_HIGH
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
    
    return this.sendNotification(
      pushToken,
      '💙 ¿Cómo te sientes ahora?',
      message || `Han pasado ${hoursSinceCrisis} horas desde tu último momento difícil. ¿Quieres compartir cómo te sientes?`,
      {
        action: 'open_chat',
        followUp: true,
      },
      this.NOTIFICATION_TYPES.FOLLOW_UP
    );
  }

  /**
   * Check-in breve tras intercambio emocionalmente intenso (no es crisis MEDIUM/HIGH).
   */
  async sendWellbeingChatCheckIn(pushToken, options = {}) {
    const { conversationId } = options;
    const conv = conversationId != null ? String(conversationId) : undefined;

    return this.sendNotification(
      pushToken,
      '¿Cómo sigues?',
      'Hace un momento estuvimos en un momento muy cargado. Si quieres, Anto sigue aquí para ti.',
      {
        action: 'open_chat',
        wellbeingCheckIn: true,
        ...(conv ? { conversationId: conv } : {})
      },
      this.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN
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
    
    return this.sendNotification(
      pushToken,
      '🧘 Técnica de regulación',
      `Te recordamos la técnica "${technique}" que puede ayudarte con ${emotion || 'tu bienestar'}.`,
      {
        action: 'open_technique',
        technique,
        emotion,
      },
      this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER
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
    
    return this.sendNotification(
      pushToken,
      '🎉 ¡Buen progreso!',
      message || `Has logrado ${achievement || 'un avance importante'}. ¡Sigue así!`,
      {
        action: 'open_dashboard',
        achievement,
      },
      this.NOTIFICATION_TYPES.PROGRESS_POSITIVE
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
    
    return this.sendNotification(
      pushToken,
      '📋 Recordatorio de hábito',
      `Es hora de completar tu hábito: "${habitName}". ¡Tú puedes hacerlo!`,
      {
        action: 'open_habits',
        habitId,
        habitName,
      },
      this.NOTIFICATION_TYPES.HABIT_REMINDER
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
    
    return this.sendNotification(
      pushToken,
      '⏰ Te perdiste un hábito',
      `No te preocupes, todos tenemos días difíciles. Tu racha de ${streak || 0} días sigue siendo impresionante. ¡Mañana es una nueva oportunidad!`,
      {
        action: 'open_habits',
        habitName,
        streak,
      },
      this.NOTIFICATION_TYPES.HABIT_MISSED
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
    
    return this.sendNotification(
      pushToken,
      '✅ Recordatorio de tarea',
      `Tienes una tarea pendiente: "${taskTitle}". ${dueDate ? `Vence ${dueDate}` : 'No olvides completarla'}.`,
      {
        action: 'open_tasks',
        taskId,
        taskTitle,
      },
      this.NOTIFICATION_TYPES.TASK_REMINDER
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
    
    return this.sendNotification(
      pushToken,
      '⚠️ Tarea vencida',
      `La tarea "${taskTitle}" está vencida ${daysOverdue > 1 ? `hace ${daysOverdue} días` : 'hoy'}. ¿Quieres completarla ahora?`,
      {
        action: 'open_tasks',
        taskId,
        taskTitle,
        overdue: true,
      },
      this.NOTIFICATION_TYPES.TASK_OVERDUE
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
    
    return this.sendNotification(
      pushToken,
      `💭 ${greeting}, ¿cómo te sientes?`,
      `Tómate un momento para reflexionar sobre cómo te sientes hoy. Un pequeño check-in puede hacer una gran diferencia.`,
      {
        action: 'open_chat',
        checkIn: true,
        timeOfDay,
      },
      this.NOTIFICATION_TYPES.DAILY_CHECKIN
    );
  }

  /**
   * Envía recordatorio de respiración/meditación
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendBreathingReminder(pushToken, options = {}) {
    return this.sendNotification(
      pushToken,
      '🌬️ Momento de respirar',
      `Tómate 2 minutos para una pausa de respiración. Puede ayudarte a sentirte más centrado y tranquilo.`,
      {
        action: 'open_technique',
        technique: 'breathing',
      },
      this.NOTIFICATION_TYPES.BREATHING_REMINDER
    );
  }

  /**
   * Envía recordatorio de mindfulness
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendMindfulnessReminder(pushToken, options = {}) {
    return this.sendNotification(
      pushToken,
      '🧘 Momento de mindfulness',
      `Practica estar presente en este momento. La atención plena puede ayudarte a manejar mejor el estrés y las emociones.`,
      {
        action: 'open_technique',
        technique: 'mindfulness',
      },
      this.NOTIFICATION_TYPES.MINDFULNESS_REMINDER
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
    
    return this.sendNotification(
      pushToken,
      '🏆 ¡Logro desbloqueado!',
      `¡Felicitaciones! Has desbloqueado: "${achievementName}". ${description || 'Sigue así, estás haciendo un gran trabajo.'}`,
      {
        action: 'open_dashboard',
        achievement: achievementName,
      },
      this.NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED
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
    
    return this.sendNotification(
      pushToken,
      '🔥 ¡Racha impresionante!',
      `¡Increíble! Llevas ${streak} ${typeText} consecutivos. Tu consistencia está dando frutos. ¡Sigue así!`,
      {
        action: 'open_dashboard',
        streak,
        type,
      },
      this.NOTIFICATION_TYPES.STREAK_MILESTONE
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
    
    let body = `Esta semana completaste ${completedHabits || 0} hábitos y ${completedTasks || 0} tareas.`;
    if (emotionalTrend) {
      body += ` Tu bienestar emocional ${emotionalTrend === 'improving' ? 'está mejorando' : emotionalTrend === 'stable' ? 'se mantiene estable' : 'necesita atención'}.`;
    }
    
    return this.sendNotification(
      pushToken,
      '📊 Tu semana en resumen',
      body,
      {
        action: 'open_dashboard',
        weeklySummary: true,
      },
      this.NOTIFICATION_TYPES.WEEKLY_PROGRESS
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
    const messages = {
      morning: [
        'Cada nuevo día es una oportunidad para crecer. ¡Tú puedes con lo que venga hoy!',
        'Hoy es un día perfecto para dar pequeños pasos hacia tu bienestar.',
        'Recuerda: eres más fuerte de lo que crees. ¡Buen día!',
      ],
      afternoon: [
        'Estás haciendo un gran trabajo. Tómate un momento para reconocer tu esfuerzo.',
        'Cada pequeño paso cuenta. Sigue adelante, estás en el camino correcto.',
        'Tu bienestar es importante. ¿Cómo te sientes en este momento?',
      ],
      evening: [
        'Reflexiona sobre el día. ¿Qué cosas positivas puedes reconocer?',
        'Has llegado hasta aquí. Eso ya es un logro. Descansa bien.',
        'Cada día que pasas cuidando de ti mismo es un día ganado.',
      ],
    };
    
    const messagePool = messages[timeOfDay] || messages.morning;
    const selectedMessage = message || messagePool[Math.floor(Math.random() * messagePool.length)];
    
    return this.sendNotification(
      pushToken,
      '💙 Un mensaje para ti',
      selectedMessage,
      {
        action: 'open_dashboard',
        motivational: true,
      },
      this.NOTIFICATION_TYPES.MOTIVATIONAL_MESSAGE
    );
  }

  /**
   * Envía recordatorio de gratitud
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendGratitudeReminder(pushToken, options = {}) {
    return this.sendNotification(
      pushToken,
      '🙏 Momento de gratitud',
      `Tómate un momento para pensar en algo por lo que estés agradecido hoy. La gratitud puede cambiar tu perspectiva.`,
      {
        action: 'open_chat',
        gratitude: true,
      },
      this.NOTIFICATION_TYPES.GRATITUDE_REMINDER
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
    const tips = [
      'El autocuidado no es egoísta, es necesario. Tómate tiempo para ti.',
      'Pequeños momentos de pausa durante el día pueden hacer una gran diferencia.',
      'Recuerda hidratarte y mover tu cuerpo. Tu cuerpo y mente están conectados.',
      'La respiración profunda puede ayudarte a manejar el estrés en cualquier momento.',
      'Conectar con la naturaleza, aunque sea por unos minutos, puede mejorar tu estado de ánimo.',
    ];
    
    const selectedTip = tip || tips[Math.floor(Math.random() * tips.length)];
    
    return this.sendNotification(
      pushToken,
      '💡 Consejo de bienestar',
      selectedTip,
      {
        action: 'open_dashboard',
        wellnessTip: true,
      },
      this.NOTIFICATION_TYPES.WELLNESS_TIP
    );
  }

  /**
   * Envía recordatorio de autocuidado
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendSelfCareReminder(pushToken, options = {}) {
    return this.sendNotification(
      pushToken,
      '💆 Tiempo de autocuidado',
      `¿Has dedicado tiempo a cuidarte hoy? El autocuidado es esencial para tu bienestar. ¿Qué puedes hacer por ti ahora mismo?`,
      {
        action: 'open_dashboard',
        selfCare: true,
      },
      this.NOTIFICATION_TYPES.SELF_CARE_REMINDER
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
    
    const title = daysRemaining === 1 
      ? '⏰ Tu trial expira mañana'
      : `⏰ Tu trial expira en ${daysRemaining} días`;
    
    const body = daysRemaining === 1
      ? 'Tu período de prueba expira mañana. Suscríbete para continuar usando todas las funciones premium.'
      : `Tu período de prueba expira en ${daysRemaining} días. No te pierdas todas las funciones premium.`;
    
    return this.sendNotification(
      pushToken,
      title,
      body,
      {
        action: 'open_subscription',
        daysRemaining,
      },
      this.NOTIFICATION_TYPES.TRIAL_EXPIRING
    );
  }

  /**
   * Envía notificación de trial expirado
   * @param {string} pushToken - Token push
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async sendTrialExpired(pushToken, options = {}) {
    return this.sendNotification(
      pushToken,
      '⏰ Tu trial ha expirado',
      'Tu período de prueba ha terminado. Suscríbete ahora para continuar disfrutando de todas las funciones premium.',
      {
        action: 'open_subscription',
      },
      this.NOTIFICATION_TYPES.TRIAL_EXPIRED
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
    
    return this.sendNotification(
      pushToken,
      '💎 Recordatorio de suscripción',
      message || 'No te pierdas todas las funciones premium. Suscríbete ahora y continúa tu viaje de bienestar.',
      {
        action: 'open_subscription',
      },
      this.NOTIFICATION_TYPES.SUBSCRIPTION_REMINDER
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
    
    const title = isTest 
      ? '🧪 Alerta de Prueba Enviada'
      : '🚨 Alerta de Emergencia Enviada';
    
    const body = isTest
      ? `Se envió una alerta de prueba a ${successfulSends} de ${totalContacts} contacto(s) de emergencia.`
      : `Hemos detectado una situación de riesgo y hemos notificado a ${successfulSends} de ${totalContacts} contacto(s) de emergencia.`;
    
    return this.sendNotification(
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
      this.NOTIFICATION_TYPES.EMERGENCY_ALERT_SENT
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
      
      // Técnicas y bienestar - canal de alta prioridad
      [this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.BREATHING_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.MINDFULNESS_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.WELLNESS_TIP]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.SELF_CARE_REMINDER]: 'anto-reminders',
      
      // Progreso y logros - canal de alta prioridad
      [this.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.STREAK_MILESTONE]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.WEEKLY_PROGRESS]: 'anto-reminders',
      
      // Hábitos y tareas - canal de recordatorios
      [this.NOTIFICATION_TYPES.HABIT_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.HABIT_MISSED]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.TASK_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.TASK_OVERDUE]: 'anto-reminders',
      
      // Check-ins y reflexión - canal de recordatorios
      [this.NOTIFICATION_TYPES.DAILY_CHECKIN]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.GRATITUDE_REMINDER]: 'anto-reminders',
      
      // Motivación - canal de recordatorios
      [this.NOTIFICATION_TYPES.MOTIVATIONAL_MESSAGE]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.MORNING_MOTIVATION]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.EVENING_REFLECTION]: 'anto-reminders',
      
      // Trial y suscripciones - canal de recordatorios
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRING]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRED]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.SUBSCRIPTION_REMINDER]: 'anto-reminders',
      
      // Alertas de emergencia - canal de crisis
      [this.NOTIFICATION_TYPES.EMERGENCY_ALERT_SENT]: 'anto-crisis',
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
      
      // Tareas vencidas - alta prioridad
      [this.NOTIFICATION_TYPES.TASK_OVERDUE]: 'high',
      [this.NOTIFICATION_TYPES.HABIT_MISSED]: 'high',
      
      // Recordatorios importantes - alta prioridad
      [this.NOTIFICATION_TYPES.HABIT_REMINDER]: 'high',
      [this.NOTIFICATION_TYPES.TASK_REMINDER]: 'high',
      [this.NOTIFICATION_TYPES.DAILY_CHECKIN]: 'high',
      [this.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN]: 'high',
      
      // Técnicas y bienestar - prioridad normal
      [this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.BREATHING_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.MINDFULNESS_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.WELLNESS_TIP]: 'default',
      [this.NOTIFICATION_TYPES.SELF_CARE_REMINDER]: 'default',
      
      // Progreso y logros - prioridad normal
      [this.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'default',
      [this.NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED]: 'default',
      [this.NOTIFICATION_TYPES.STREAK_MILESTONE]: 'default',
      [this.NOTIFICATION_TYPES.WEEKLY_PROGRESS]: 'default',
      
      // Motivación y reflexión - prioridad normal
      [this.NOTIFICATION_TYPES.MOTIVATIONAL_MESSAGE]: 'default',
      [this.NOTIFICATION_TYPES.MORNING_MOTIVATION]: 'default',
      [this.NOTIFICATION_TYPES.EVENING_REFLECTION]: 'default',
      [this.NOTIFICATION_TYPES.GRATITUDE_REMINDER]: 'default',
      
      // Trial y suscripciones - alta prioridad
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRING]: 'high',
      [this.NOTIFICATION_TYPES.TRIAL_EXPIRED]: 'high',
      [this.NOTIFICATION_TYPES.SUBSCRIPTION_REMINDER]: 'high',
      
      // Alertas de emergencia - alta prioridad
      [this.NOTIFICATION_TYPES.EMERGENCY_ALERT_SENT]: 'high',
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

