/**
 * Servicio de Notificaciones de Trial
 * 
 * Gestiona las notificaciones relacionadas con el período de trial:
 * - Notificaciones cuando el trial está por expirar
 * - Recordatorios para suscribirse
 * - Actualización de estado cuando el trial expira
 * 
 * @author AntoApp Team
 */

import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

class TrialNotificationService {
  /**
   * Verificar y enviar notificaciones de trial próximo a expirar
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la verificación
   */
  async checkAndNotifyTrialExpiration(userId) {
    try {
      const user = await User.findById(userId).select('subscription email username');
      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const subscription = await Subscription.findOne({ userId });
      const now = new Date();

      // Verificar trial en modelo User
      let trialEndDate = user.subscription?.trialEndDate;
      let isInTrial = user.subscription?.status === 'trial' && 
                     trialEndDate && 
                     now <= trialEndDate;

      // Si no está en trial en User, verificar en Subscription
      if (!isInTrial && subscription) {
        trialEndDate = subscription.trialEnd;
        isInTrial = subscription.status === 'trialing' && 
                   trialEndDate && 
                   now <= trialEndDate;
      }

      if (!isInTrial || !trialEndDate) {
        return { success: false, message: 'Usuario no está en trial' };
      }

      // Calcular días restantes
      const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

      // Enviar notificación si quedan 1 o 2 días
      if (daysRemaining === 1 || daysRemaining === 2) {
        await this.sendTrialExpirationNotification(userId, daysRemaining);
        return { 
          success: true, 
          notified: true, 
          daysRemaining,
          message: `Notificación enviada: ${daysRemaining} día(s) restantes` 
        };
      }

      return { 
        success: true, 
        notified: false, 
        daysRemaining,
        message: `Trial activo: ${daysRemaining} días restantes` 
      };
    } catch (error) {
      console.error('[TrialNotificationService] Error verificando trial:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación de expiración de trial
   * @param {string} userId - ID del usuario
   * @param {number} daysRemaining - Días restantes
   */
  async sendTrialExpirationNotification(userId, daysRemaining) {
    try {
      const user = await User.findById(userId).select('email username');
      if (!user) return;

      const title = daysRemaining === 1 
        ? '⏰ Tu trial expira mañana'
        : `⏰ Tu trial expira en ${daysRemaining} días`;

      const body = daysRemaining === 1
        ? 'Tu período de prueba expira mañana. Suscríbete para continuar usando todas las funciones premium.'
        : `Tu período de prueba expira en ${daysRemaining} días. No te pierdas todas las funciones premium.`;

      // Nota: Las notificaciones push se envían desde el frontend
      // Este método solo registra el evento para logging
      console.log(`[TrialNotificationService] Trial próximo a expirar para usuario ${userId}: ${daysRemaining} días restantes`);
      
      // Aquí podrías integrar con el servicio de notificaciones push del backend
      // si tienes un sistema de notificaciones push desde el servidor
    } catch (error) {
      console.error('[TrialNotificationService] Error enviando notificación:', error);
    }
  }

  /**
   * Verificar y actualizar estado de trial expirado
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la verificación
   */
  async checkAndUpdateExpiredTrial(userId) {
    try {
      const user = await User.findById(userId).select('subscription');
      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const subscription = await Subscription.findOne({ userId });
      const now = new Date();

      // Verificar trial en modelo User
      if (user.subscription?.status === 'trial' && 
          user.subscription?.trialEndDate && 
          now > user.subscription.trialEndDate) {
        user.subscription.status = 'expired';
        await user.save();
        return { success: true, updated: true, model: 'User' };
      }

      // Verificar trial en modelo Subscription
      if (subscription && 
          subscription.status === 'trialing' && 
          subscription.trialEnd && 
          now > subscription.trialEnd) {
        subscription.status = 'expired';
        await subscription.save();
        return { success: true, updated: true, model: 'Subscription' };
      }

      return { success: true, updated: false, message: 'Trial aún activo' };
    } catch (error) {
      console.error('[TrialNotificationService] Error actualizando trial expirado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener información del trial del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Información del trial
   */
  async getTrialInfo(userId) {
    try {
      const user = await User.findById(userId).select('subscription');
      const subscription = await Subscription.findOne({ userId });
      const now = new Date();

      // Verificar trial en modelo User
      let trialEndDate = user?.subscription?.trialEndDate;
      let isInTrial = user?.subscription?.status === 'trial' && 
                     trialEndDate && 
                     now <= trialEndDate;

      // Si no está en trial en User, verificar en Subscription
      if (!isInTrial && subscription) {
        trialEndDate = subscription.trialEnd;
        isInTrial = subscription.status === 'trialing' && 
                   trialEndDate && 
                   now <= trialEndDate;
      }

      if (!isInTrial || !trialEndDate) {
        return {
          isInTrial: false,
          daysRemaining: 0,
          trialEndDate: null,
        };
      }

      const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

      return {
        isInTrial: true,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndDate,
        shouldNotify: daysRemaining <= 2, // Notificar si quedan 2 días o menos
      };
    } catch (error) {
      console.error('[TrialNotificationService] Error obteniendo info de trial:', error);
      return {
        isInTrial: false,
        daysRemaining: 0,
        trialEndDate: null,
        error: error.message,
      };
    }
  }
}

export default new TrialNotificationService();

