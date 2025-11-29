/**
 * Middleware para verificar suscripción activa
 * 
 * Verifica si el usuario tiene una suscripción activa o está en trial.
 * Útil para restringir acceso a features premium.
 * 
 * @author AntoApp Team
 */

import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

/**
 * Middleware para verificar si el usuario tiene suscripción activa
 * @param {boolean} allowTrial - Si permitir usuarios en trial
 * @returns {Function} - Middleware de Express
 */
export const requireActiveSubscription = (allowTrial = true) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
      }

      // Buscar suscripción en modelo separado
      let subscription = await Subscription.findOne({ userId });

      // Si no existe, verificar en modelo User
      if (!subscription) {
        const user = await User.findById(userId).select('subscription');
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
          });
        }

        const userSub = user.subscription;
        const now = new Date();

        // Verificar si tiene suscripción activa
        const hasActiveSub = userSub.status === 'premium' && 
                            userSub.subscriptionEndDate && 
                            now <= userSub.subscriptionEndDate;

        // Verificar si está en trial
        const isInTrial = userSub.status === 'trial' && 
                         userSub.trialEndDate && 
                         now <= userSub.trialEndDate;

        if (!hasActiveSub && (!allowTrial || !isInTrial)) {
          return res.status(403).json({
            success: false,
            error: 'Se requiere suscripción activa',
            requiresSubscription: true,
            currentStatus: userSub.status,
          });
        }

        // Agregar información de suscripción al request
        req.subscription = {
          isActive: hasActiveSub,
          isInTrial: isInTrial,
          status: userSub.status,
          plan: userSub.plan,
        };

        return next();
      }

      // Verificar suscripción en modelo separado
      const isActive = subscription.isActive;
      const isInTrial = subscription.isInTrial;

      if (!isActive && (!allowTrial || !isInTrial)) {
        return res.status(403).json({
          success: false,
          error: 'Se requiere suscripción activa',
          requiresSubscription: true,
          currentStatus: subscription.status,
        });
      }

      // Agregar información de suscripción al request
      req.subscription = {
        isActive,
        isInTrial,
        status: subscription.status,
        plan: subscription.plan,
      };

      next();
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar suscripción',
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario tiene acceso premium (no solo trial)
 * @returns {Function} - Middleware de Express
 */
export const requirePremium = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
      }

      const subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        const user = await User.findById(userId).select('subscription');
        if (!user || user.subscription.status !== 'premium') {
          return res.status(403).json({
            success: false,
            error: 'Se requiere suscripción premium',
            requiresPremium: true,
          });
        }

        const now = new Date();
        if (!user.subscription.subscriptionEndDate || 
            now > user.subscription.subscriptionEndDate) {
          return res.status(403).json({
            success: false,
            error: 'Suscripción expirada',
            requiresPremium: true,
          });
        }

        req.subscription = {
          isActive: true,
          isInTrial: false,
          status: 'premium',
          plan: user.subscription.plan,
        };

        return next();
      }

      if (subscription.status !== 'active' || !subscription.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Se requiere suscripción premium activa',
          requiresPremium: true,
          currentStatus: subscription.status,
        });
      }

      req.subscription = {
        isActive: true,
        isInTrial: false,
        status: subscription.status,
        plan: subscription.plan,
      };

      next();
    } catch (error) {
      console.error('Error verificando suscripción premium:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar suscripción',
      });
    }
  };
};

/**
 * Middleware opcional: agrega información de suscripción sin bloquear
 * Útil para mostrar diferentes UI según el estado de suscripción
 */
export const attachSubscriptionInfo = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return next();
    }

    const subscription = await Subscription.findOne({ userId });
    
    if (subscription) {
      req.subscription = {
        isActive: subscription.isActive,
        isInTrial: subscription.isInTrial,
        status: subscription.status,
        plan: subscription.plan,
        daysRemaining: subscription.daysRemaining,
      };
    } else {
      const user = await User.findById(userId).select('subscription');
      if (user) {
        const now = new Date();
        const hasActiveSub = user.subscription.status === 'premium' && 
                            user.subscription.subscriptionEndDate && 
                            now <= user.subscription.subscriptionEndDate;
        const isInTrial = user.subscription.status === 'trial' && 
                         user.subscription.trialEndDate && 
                         now <= user.subscription.trialEndDate;

        req.subscription = {
          isActive: hasActiveSub,
          isInTrial: isInTrial,
          status: user.subscription.status,
          plan: user.subscription.plan,
        };
      }
    }

    next();
  } catch (error) {
    console.error('Error adjuntando información de suscripción:', error);
    // No bloquear la request, solo continuar sin información
    next();
  }
};

