/**
 * Middleware para verificar suscripción activa
 * 
 * Verifica si el usuario tiene una suscripción activa o está en trial.
 * Útil para restringir acceso a features premium.
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import paymentAuditService from '../services/paymentAuditService.js';

/**
 * Middleware para verificar si el usuario tiene suscripción activa
 * @param {boolean} allowTrial - Si permitir usuarios en trial
 * @returns {Function} - Middleware de Express
 */
export const requireActiveSubscription = (allowTrial = true) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    try {
      const userId = req.user?._id;
      if (!userId || !userId.toString) {
        // Registrar intento de acceso sin autenticación
        await paymentAuditService.logEvent('SUBSCRIPTION_CHECK_FAILED', {
          reason: 'no_user_id',
          ip: req.ip,
          userAgent: req.get('user-agent'),
        }, null);
        
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
      }

      const userIdString = userId.toString();

      // Validar formato de ObjectId
      if (!userIdString.match(/^[0-9a-fA-F]{24}$/)) {
        await paymentAuditService.logEvent('SUBSCRIPTION_CHECK_FAILED', {
          reason: 'invalid_user_id_format',
          userId: userIdString,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        }, null);
        
        return res.status(400).json({
          success: false,
          error: 'ID de usuario inválido',
        });
      }

      // Verificar acceso usando el servicio de auditoría (validación adicional)
      const accessVerification = await paymentAuditService.verifyUserAccess(userIdString);
      
      // Buscar suscripción en modelo separado
      // Asegurar que userIdString sea un ObjectId válido
      const userIdObjectId = mongoose.Types.ObjectId.isValid(userIdString) 
        ? new mongoose.Types.ObjectId(userIdString) 
        : userIdString;
      let subscription = await Subscription.findOne({ userId: userIdObjectId });

      // Si no existe, verificar en modelo User
      if (!subscription) {
        const user = await User.findById(userIdObjectId).select('subscription email username name');
        if (!user) {
          // Registrar intento de acceso con usuario inexistente
          await paymentAuditService.logEvent('SUBSCRIPTION_CHECK_FAILED', {
            reason: 'user_not_found',
            userId: userIdString,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          }, userIdString);
          
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
          // Si el trial expiró, actualizar el status a 'expired'
          if (userSub.status === 'trial' && userSub.trialEndDate && now > userSub.trialEndDate) {
            user.subscription.status = 'expired';
            await user.save();
            
            // Registrar expiración de trial
            await paymentAuditService.logEvent('TRIAL_EXPIRED', {
              userId: userIdString,
              userEmail: user.email,
              trialEndDate: userSub.trialEndDate,
              ip: req.ip,
            }, userIdString);
          }
          
          // Registrar acceso denegado
          await paymentAuditService.logEvent('SUBSCRIPTION_CHECK_DENIED', {
            userId: userIdString,
            userEmail: user.email,
            currentStatus: userSub.status,
            allowTrial,
            isInTrial,
            hasActiveSub,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path,
            method: req.method,
          }, userIdString);
          
          return res.status(403).json({
            success: false,
            error: 'Se requiere suscripción activa o trial válido para usar el chat',
            requiresSubscription: true,
            currentStatus: userSub.status,
            trialEndDate: userSub.trialEndDate,
            message: userSub.status === 'trial' && userSub.trialEndDate && now > userSub.trialEndDate
              ? 'Tu período de prueba ha expirado. Por favor, suscríbete para continuar usando el chat.'
              : 'Necesitas una suscripción activa para usar el chat.',
          });
        }

        // Agregar información de suscripción al request
        req.subscription = {
          isActive: hasActiveSub,
          isInTrial: isInTrial,
          status: userSub.status,
          plan: userSub.plan,
        };

        // Registrar acceso permitido
        await paymentAuditService.logEvent('SUBSCRIPTION_CHECK_ALLOWED', {
          userId: userIdString,
          userEmail: user.email,
          status: userSub.status,
          isInTrial,
          hasActiveSub,
          processingTime: Date.now() - startTime,
          endpoint: req.path,
        }, userIdString);

        return next();
      }

      // Verificar suscripción en modelo separado
      const now = new Date();
      const isActive = subscription.isActive;
      let isInTrial = subscription.isInTrial;
      
      // Si el trial expiró, actualizar el status
      if (subscription.status === 'trialing' && subscription.trialEnd && now > subscription.trialEnd) {
        subscription.status = 'expired';
        await subscription.save();
        isInTrial = false;
      }

      if (!isActive && (!allowTrial || !isInTrial)) {
        // Obtener información del usuario para logging
        const user = await User.findById(userIdString).select('email username name');
        
        // Registrar acceso denegado
        await paymentAuditService.logEvent('SUBSCRIPTION_CHECK_DENIED', {
          userId: userIdString,
          userEmail: user?.email || 'unknown',
          currentStatus: subscription.status,
          allowTrial,
          isInTrial,
          isActive,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          endpoint: req.path,
          method: req.method,
        }, userIdString);
        
        return res.status(403).json({
          success: false,
          error: 'Se requiere suscripción activa o trial válido para usar el chat',
          requiresSubscription: true,
          currentStatus: subscription.status,
          trialEnd: subscription.trialEnd,
          message: subscription.status === 'trialing' && subscription.trialEnd && now > subscription.trialEnd
            ? 'Tu período de prueba ha expirado. Por favor, suscríbete para continuar usando el chat.'
            : 'Necesitas una suscripción activa para usar el chat.',
        });
      }

      // Agregar información de suscripción al request
      req.subscription = {
        isActive,
        isInTrial,
        status: subscription.status,
        plan: subscription.plan,
      };

      // Registrar acceso permitido
      const user = await User.findById(userIdString).select('email');
      await paymentAuditService.logEvent('SUBSCRIPTION_CHECK_ALLOWED', {
        userId: userIdString,
        userEmail: user?.email || 'unknown',
        status: subscription.status,
        isInTrial,
        isActive,
        processingTime: Date.now() - startTime,
        endpoint: req.path,
      }, userIdString);

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

