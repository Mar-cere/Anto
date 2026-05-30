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

import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { resolveAppLanguage } from '../utils/resolveAppLanguage.js';
import pushNotificationService from './pushNotificationService.js';
import {
  APP_TRIAL_DAYS,
  computeTrialTimeRemaining,
} from '../constants/subscription.js';

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

      const { daysRemaining } = computeTrialTimeRemaining(trialEndDate, now);
      const notifyWindowDays = Math.max(1, APP_TRIAL_DAYS);

      if (daysRemaining >= 1 && daysRemaining <= notifyWindowDays) {
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
      const user = await User.findById(userId).select(
        'email username pushToken preferences.language',
      );
      if (!user) return;

      const language = resolveAppLanguage({
        preferenceLanguage: user?.preferences?.language,
      });

      console.log(`[TrialNotificationService] Trial próximo a expirar para usuario ${userId}: ${daysRemaining} días restantes`);
      
      // Enviar notificación push si el usuario tiene token
      if (user.pushToken) {
        try {
          await pushNotificationService.sendTrialExpiring(user.pushToken, {
            daysRemaining,
            language,
          });
          console.log(`[TrialNotificationService] Notificación push enviada a usuario ${userId}`);
        } catch (pushError) {
          console.error('[TrialNotificationService] Error enviando notificación push:', pushError);
        }
      } else {
        console.log(`[TrialNotificationService] Usuario ${userId} no tiene pushToken configurado`);
      }
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

      // Suscripción premium vigente en User: no mostrar banner ni trial
      if (
        user?.subscription?.status === 'premium' &&
        user.subscription.subscriptionEndDate &&
        new Date(user.subscription.subscriptionEndDate) >= now
      ) {
        return {
          isInTrial: false,
          daysRemaining: 0,
          trialEndDate: null,
        };
      }

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

      const { daysRemaining, hoursRemaining } = computeTrialTimeRemaining(trialEndDate, now);
      const notifyWindowDays = Math.max(1, APP_TRIAL_DAYS);

      return {
        isInTrial: true,
        daysRemaining,
        hoursRemaining,
        trialEndDate,
        appTrialDays: APP_TRIAL_DAYS,
        shouldNotify: daysRemaining >= 1 && daysRemaining <= notifyWindowDays,
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

