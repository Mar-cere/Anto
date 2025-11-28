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

class PushNotificationService {
  constructor() {
    // Crear cliente de Expo
    this.expo = new Expo();
    
    // Tipos de notificaciones
    this.NOTIFICATION_TYPES = {
      CRISIS_WARNING: 'crisis_warning',
      CRISIS_MEDIUM: 'crisis_medium',
      CRISIS_HIGH: 'crisis_high',
      FOLLOW_UP: 'crisis_followup',
      TECHNIQUE_REMINDER: 'technique_reminder',
      PROGRESS_POSITIVE: 'progress_positive',
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
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendNotification(pushToken, title, body, data = {}, type = 'default') {
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
      if (ticket.status === 'ok') {
        console.log('[PushNotificationService] ✅ Notificación enviada exitosamente');
        return { success: true, ticketId: ticket.id };
      } else {
        console.error('[PushNotificationService] ❌ Error en ticket:', ticket);
        return { success: false, error: ticket.message || 'Error desconocido' };
      }
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
      [this.NOTIFICATION_TYPES.CRISIS_WARNING]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.CRISIS_MEDIUM]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.CRISIS_HIGH]: 'anto-crisis',
      [this.NOTIFICATION_TYPES.FOLLOW_UP]: 'anto-followup',
      [this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER]: 'anto-reminders',
      [this.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'anto-reminders',
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
      [this.NOTIFICATION_TYPES.CRISIS_WARNING]: 'high',
      [this.NOTIFICATION_TYPES.CRISIS_MEDIUM]: 'high',
      [this.NOTIFICATION_TYPES.CRISIS_HIGH]: 'high',
      [this.NOTIFICATION_TYPES.FOLLOW_UP]: 'high',
      [this.NOTIFICATION_TYPES.TECHNIQUE_REMINDER]: 'default',
      [this.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'default',
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

