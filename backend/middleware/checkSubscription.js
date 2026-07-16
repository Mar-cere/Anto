/**
 * Middleware para verificar suscripción activa
 *
 * La decisión de acceso usa solo paymentService.getSubscriptionStatus + interpretSubscriptionAccess
 * (misma regla que GET /api/payments/subscription-status). No se re-evalúa con el documento
 * Subscription y su virtual isActive para evitar desincronía.
 *
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';
import paymentAuditService from '../services/paymentAuditService.js';
import paymentService from '../services/paymentService.js';
import { interpretSubscriptionAccess } from '../utils/subscriptionAccess.js';

const FIRST_SESSION_GRACE_WINDOW_MS = 24 * 60 * 60 * 1000;

const canApplyFirstSessionGrace = (req) => {
  if (!req?.path) return false;
  return (
    req.path === '/conversations' ||
    req.path === '/messages' ||
    req.path === '/tcc-continuity'
  );
};

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
        await paymentAuditService.logEvent(
          'SUBSCRIPTION_CHECK_FAILED',
          {
            reason: 'no_user_id',
            ip: req.ip,
            userAgent: req.get('user-agent'),
          },
          null,
        );

        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
      }

      const userRole = req.user?.role;
      if (userRole === 'emergency') {
        req.subscription = {
          isActive: true,
          isInTrial: false,
          status: 'emergency',
          plan: 'emergency',
          bypass: true,
        };

        await paymentAuditService.logEvent(
          'SUBSCRIPTION_CHECK_EMERGENCY_BYPASS',
          {
            userId: userId.toString(),
            userEmail: req.user?.email || 'unknown',
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path,
          },
          userId.toString(),
        );

        return next();
      }

      const userIdString = userId.toString();

      if (!userIdString.match(/^[0-9a-fA-F]{24}$/)) {
        await paymentAuditService.logEvent(
          'SUBSCRIPTION_CHECK_FAILED',
          {
            reason: 'invalid_user_id_format',
            userId: userIdString,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          },
          null,
        );

        return res.status(400).json({
          success: false,
          error: 'ID de usuario inválido',
        });
      }

      const userIdObjectId = mongoose.Types.ObjectId.isValid(userIdString)
        ? new mongoose.Types.ObjectId(userIdString)
        : userIdString;

      let apiStatus;
      try {
        apiStatus = await paymentService.getSubscriptionStatus(userIdString);
      } catch (statusErr) {
        console.error('[checkSubscription] getSubscriptionStatus', statusErr);
        await paymentAuditService.logEvent(
          'SUBSCRIPTION_CHECK_FAILED',
          {
            reason: 'subscription_status_error',
            message: statusErr?.message,
            userId: userIdString,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          },
          userIdString,
        );
        return res.status(503).json({
          success: false,
          error: 'No se pudo verificar la suscripción. Intenta de nuevo en unos segundos.',
        });
      }

      const gate = interpretSubscriptionAccess(apiStatus, allowTrial);
      if (gate.allowed) {
        req.subscription = {
          isActive: gate.isActive,
          isInTrial: gate.isInTrial,
          status: gate.status,
          plan: gate.plan,
        };
        const userForEmail = await User.findById(userIdObjectId).select('email').lean();
        await paymentAuditService.logEvent(
          'SUBSCRIPTION_CHECK_ALLOWED',
          {
            userId: userIdString,
            userEmail: userForEmail?.email || 'unknown',
            status: gate.status,
            isInTrial: gate.isInTrial,
            isActive: gate.isActive,
            source: 'getSubscriptionStatus',
            processingTime: Date.now() - startTime,
            endpoint: req.path,
          },
          userIdString,
        );
        return next();
      }

      const user = await User.findById(userIdObjectId)
        .select('email username name createdAt subscription')
        .lean();

      if (!user) {
        await paymentAuditService.logEvent(
          'SUBSCRIPTION_CHECK_FAILED',
          {
            reason: 'user_not_found',
            userId: userIdString,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          },
          userIdString,
        );

        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
      }

      const userSub = user.subscription || {};
      const now = new Date();

      if (userSub.status === 'trial' && userSub.trialEndDate && now > new Date(userSub.trialEndDate)) {
        await User.updateOne({ _id: userIdObjectId }, { $set: { 'subscription.status': 'expired' } });
        await paymentAuditService.logEvent(
          'TRIAL_EXPIRED',
          {
            userId: userIdString,
            userEmail: user.email,
            trialEndDate: userSub.trialEndDate,
            ip: req.ip,
          },
          userIdString,
        );
      }

      const accountAgeMs = user.createdAt
        ? Date.now() - new Date(user.createdAt).getTime()
        : Number.POSITIVE_INFINITY;
      const isNewAccountForGrace =
        Number.isFinite(accountAgeMs) && accountAgeMs >= 0 && accountAgeMs <= FIRST_SESSION_GRACE_WINDOW_MS;

      if (allowTrial && canApplyFirstSessionGrace(req) && isNewAccountForGrace) {
        const hasAnyUserMessages = await Message.exists({
          userId: userIdObjectId,
          role: 'user',
        });
        if (!hasAnyUserMessages) {
          req.subscription = {
            isActive: false,
            isInTrial: false,
            status: userSub.status || 'free',
            plan: userSub.plan,
            firstSessionGrace: true,
          };
          await paymentAuditService.logEvent(
            'SUBSCRIPTION_FIRST_SESSION_GRACE_GRANTED',
            {
              userId: userIdString,
              userEmail: user.email,
              currentStatus: userSub.status,
              endpoint: req.path,
              method: req.method,
              accountAgeMs,
            },
            userIdString,
          );
          return next();
        }
      }

      await paymentAuditService.logEvent(
        'SUBSCRIPTION_CHECK_DENIED',
        {
          userId: userIdString,
          userEmail: user.email,
          apiStatus: apiStatus?.status,
          apiIsActive: apiStatus?.isActive,
          apiIsInTrial: apiStatus?.isInTrial,
          userSubscriptionStatus: userSub.status,
          allowTrial,
          source: 'getSubscriptionStatus',
          processingTime: Date.now() - startTime,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          endpoint: req.path,
          method: req.method,
        },
        userIdString,
      );

      const trialEndedMsg =
        userSub.status === 'trial' && userSub.trialEndDate && now > new Date(userSub.trialEndDate);

      return res.status(403).json({
        success: false,
        error: 'Se requiere suscripción activa o trial válido',
        requiresSubscription: true,
        currentStatus: apiStatus?.status ?? userSub.status,
        trialEndDate: apiStatus?.trialEndDate ?? userSub.trialEndDate,
        message:
          trialEndedMsg
            ? 'Tu período de prueba ha expirado. Suscríbete para continuar.'
            : 'Necesitas una suscripción activa o trial válido para continuar.',
      });
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

      const userIdString = userId.toString();
      let apiStatus;
      try {
        apiStatus = await paymentService.getSubscriptionStatus(userIdString);
      } catch (e) {
        console.error('[requirePremium] getSubscriptionStatus', e);
        return res.status(503).json({
          success: false,
          error: 'No se pudo verificar la suscripción.',
        });
      }

      const gate = interpretSubscriptionAccess(apiStatus, true);
      const st = String(apiStatus?.status || '').toLowerCase();
      // Solo pago de suscripción (no trial / trialing), alineado con rutas que exigen premium real
      const premiumAllowed =
        gate.allowed &&
        (st === 'premium' || (st === 'active' && apiStatus?.isActive === true));

      if (premiumAllowed) {
        req.subscription = {
          isActive: true,
          isInTrial: gate.isInTrial,
          status: apiStatus?.status || 'premium',
          plan: gate.plan,
        };
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Se requiere suscripción premium',
        requiresPremium: true,
        currentStatus: apiStatus?.status,
      });
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
 * Usa la misma fuente que el resto de la app (getSubscriptionStatus).
 */
export const attachSubscriptionInfo = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return next();
    }

    const apiStatus = await paymentService.getSubscriptionStatus(userId.toString());
    const gate = interpretSubscriptionAccess(apiStatus, true);
    req.subscription = {
      isActive: gate.isActive,
      isInTrial: gate.isInTrial,
      status: gate.status,
      plan: gate.plan,
      daysRemaining: apiStatus?.daysRemaining,
    };

    next();
  } catch (error) {
    console.error('Error adjuntando información de suscripción:', error);
    next();
  }
};
