/**
 * Rutas de Pagos y Suscripciones
 * 
 * Endpoints para gestionar pagos, suscripciones y transacciones
 * usando Mercado Pago como proveedor de pagos.
 * 
 * @author AntoApp Team
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserObjectId } from '../middleware/validation.js';
import paymentService from '../services/paymentService.js';
import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import { getPlanPrice, formatAmount, isMercadoPagoConfigured } from '../config/mercadopago.js';
import cacheService from '../services/cacheService.js';
import Joi from 'joi';

const router = express.Router();

// Rate limiters para pagos
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de checkout por 15 minutos
  message: 'Demasiados intentos de checkout. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No aplicar rate limiting en desarrollo
    return process.env.NODE_ENV === 'development';
  }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Máximo 20 operaciones de pago por hora
  message: 'Demasiadas operaciones de pago. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// Esquema de validación para crear checkout
const createCheckoutSchema = Joi.object({
  plan: Joi.string().valid('weekly', 'monthly', 'quarterly', 'semestral', 'yearly').required(),
  successUrl: Joi.string().uri().allow(null, '').optional(),
  cancelUrl: Joi.string().uri().allow(null, '').optional(),
});

// Esquema de validación para cancelar suscripción
const cancelSubscriptionSchema = Joi.object({
  cancelImmediately: Joi.boolean().default(false),
});

// Esquema de validación para actualizar método de pago
const updatePaymentMethodSchema = Joi.object({
  paymentMethodId: Joi.string().required(),
});

/**
 * GET /api/payments/plans
 * Obtener información de los planes disponibles
 * Nota: Este endpoint no requiere autenticación ni configuración completa de Mercado Pago
 * ya que solo devuelve información estática de los planes.
 */
router.get('/plans', async (req, res) => {
  try {
    const cacheKey = 'plans:all';
    
    // Intentar obtener del caché
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const currency = 'CLP';
    
    // Calcular precios
    const weeklyAmount = getPlanPrice('weekly');
    const monthlyAmount = getPlanPrice('monthly');
    const quarterlyAmount = getPlanPrice('quarterly');
    const semestralAmount = getPlanPrice('semestral');
    const yearlyAmount = getPlanPrice('yearly');
    
    // Calcular ahorros vs mensual
    const monthlyEquivalent = monthlyAmount;
    const quarterlySavings = (monthlyAmount * 3) - quarterlyAmount;
    const semestralSavings = (monthlyAmount * 6) - semestralAmount;
    const yearlySavings = (monthlyAmount * 12) - yearlyAmount;

    const plans = {
      weekly: {
        id: 'weekly',
        name: 'Premium Semanal',
        amount: weeklyAmount,
        formattedAmount: formatAmount(weeklyAmount, currency),
        interval: 'week',
        currency: currency,
        features: [
          'Chat ilimitado',
          'Todas las técnicas terapéuticas',
          'Análisis emocional avanzado',
          'Historial completo',
        ],
      },
      monthly: {
        id: 'monthly',
        name: 'Premium Mensual',
        amount: monthlyAmount,
        formattedAmount: formatAmount(monthlyAmount, currency),
        interval: 'month',
        currency: currency,
        discount: '5%',
        features: [
          'Chat ilimitado',
          'Todas las técnicas terapéuticas',
          'Análisis emocional avanzado',
          'Historial completo',
          'Exportación de datos',
          'Soporte prioritario',
        ],
      },
      quarterly: {
        id: 'quarterly',
        name: 'Premium Trimestral',
        amount: quarterlyAmount,
        formattedAmount: formatAmount(quarterlyAmount, currency),
        interval: 'quarter',
        currency: currency,
        discount: '10%',
        savings: formatAmount(quarterlySavings, currency),
        features: [
          'Todo lo del plan mensual',
          'Ahorro de $600 CLP',
          'Facturación trimestral',
        ],
      },
      semestral: {
        id: 'semestral',
        name: 'Premium Semestral',
        amount: semestralAmount,
        formattedAmount: formatAmount(semestralAmount, currency),
        interval: 'semester',
        currency: currency,
        discount: '15%',
        savings: formatAmount(semestralSavings, currency),
        features: [
          'Todo lo del plan mensual',
          'Ahorro de $1,600 CLP',
          'Facturación semestral',
        ],
      },
      yearly: {
        id: 'yearly',
        name: 'Premium Anual',
        amount: yearlyAmount,
        formattedAmount: formatAmount(yearlyAmount, currency),
        interval: 'year',
        currency: currency,
        discount: '20%',
        savings: formatAmount(yearlySavings, currency),
        features: [
          'Todo lo del plan mensual',
          'Ahorro de $4,200 CLP',
          'Mejor precio por mes',
          'Acceso anticipado a nuevas features',
        ],
      },
    };

    const response = {
      success: true,
      plans,
      provider: 'mercadopago',
    };
    
    // Guardar en caché por 1 hora (los planes son estáticos)
    await cacheService.set(cacheKey, response, 3600);
    
    res.json(response);
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener planes',
    });
  }
});

/**
 * POST /api/payments/create-checkout-session
 * Crear sesión de checkout para suscripción
 */
router.post(
  '/create-checkout-session',
  checkoutLimiter,
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const { error, value } = createCheckoutSchema.validate(req.body);
      if (error) {
        console.error('Error de validación en create-checkout-session:', error.details);
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          message: error.details.map(d => d.message).join(', '),
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
          })),
        });
      }

      const { plan, successUrl, cancelUrl } = value;
      const userId = req.user._id;

      const session = await paymentService.createCheckoutSession(
        userId,
        plan,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        ...session,
      });
    } catch (error) {
      console.error('Error creando sesión de checkout:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al crear sesión de checkout',
      });
    }
  }
);

/**
 * GET /api/payments/trial-info
 * Obtener información del trial del usuario
 */
router.get(
  '/trial-info',
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const trialNotificationService = (await import('../services/trialNotificationService.js')).default;
      const trialInfo = await trialNotificationService.getTrialInfo(req.user._id);
      
      res.json({
        success: true,
        ...trialInfo,
      });
    } catch (error) {
      console.error('Error obteniendo info de trial:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener información del trial',
      });
    }
  }
);

/**
 * GET /api/payments/subscription-status
 * Obtener estado de suscripción del usuario
 */
router.get(
  '/subscription-status',
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const cacheKey = cacheService.generateKey('subscription', userId);
      
      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const status = await paymentService.getSubscriptionStatus(userId);

      const response = {
        success: true,
        ...status,
      };
      
      // Guardar en caché por 5 minutos (el estado puede cambiar)
      await cacheService.set(cacheKey, response, 300);

      res.json(response);
    } catch (error) {
      console.error('Error obteniendo estado de suscripción:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estado de suscripción',
      });
    }
  }
);

/**
 * POST /api/payments/cancel-subscription
 * Cancelar suscripción del usuario
 */
router.post(
  '/cancel-subscription',
  paymentLimiter,
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const { error, value } = cancelSubscriptionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.details.map(d => d.message),
        });
      }

      const { cancelImmediately } = value;
      const userId = req.user._id;

      const result = await paymentService.cancelSubscription(userId, cancelImmediately);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al cancelar suscripción',
      });
    }
  }
);

/**
 * POST /api/payments/update-payment-method
 * Actualizar método de pago
 */
router.post(
  '/update-payment-method',
  paymentLimiter,
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const { error, value } = updatePaymentMethodSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.details.map(d => d.message),
        });
      }

      const { paymentMethodId } = value;
      const userId = req.user._id;

      const result = await paymentService.updatePaymentMethod(userId, paymentMethodId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error actualizando método de pago:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar método de pago',
      });
    }
  }
);

/**
 * GET /api/payments/transactions
 * Obtener historial de transacciones del usuario
 */
router.get(
  '/transactions',
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { limit = 50, skip = 0, status, type } = req.query;

      const transactions = await Transaction.getUserTransactions(userId, {
        limit: parseInt(limit),
        skip: parseInt(skip),
        status,
        type,
      });

      const total = await Transaction.countDocuments({
        userId,
        ...(status && { status }),
        ...(type && { type }),
      });

      res.json({
        success: true,
        transactions,
        count: transactions.length,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      });
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener transacciones',
      });
    }
  }
);

/**
 * GET /api/payments/transactions
 * Obtener historial de transacciones del usuario
 */
router.get(
  '/transactions',
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { limit = 50, skip = 0, status, type } = req.query;

      const transactions = await Transaction.getUserTransactions(userId, {
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
        status,
        type,
      });

      res.json({
        success: true,
        transactions,
        count: transactions.length,
      });
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener transacciones',
      });
    }
  }
);

/**
 * GET /api/payments/transactions/stats
 * Obtener estadísticas de transacciones
 */
router.get(
  '/transactions/stats',
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { startDate, endDate } = req.query;

      const stats = await Transaction.getTransactionStats(
        userId,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      res.json({
        success: true,
        stats: {
          ...stats,
          formattedTotalAmount: formatAmount(stats.totalAmount, 'CLP'),
          formattedAverageAmount: formatAmount(stats.averageAmount || 0, 'CLP'),
        },
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas',
      });
    }
  }
);

/**
 * POST /api/payments/webhook
 * Webhook para eventos de pago de Mercado Pago
 * IMPORTANTE: Esta ruta NO debe usar authenticateToken
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    // Validar que el webhook viene de Mercado Pago
    // Mercado Pago envía notificaciones desde IPs específicas
    // En producción, se puede validar el rango de IPs de Mercado Pago
    const allowedIPs = process.env.MERCADOPAGO_WEBHOOK_IPS?.split(',') || [];
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Si hay IPs configuradas, validar
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      console.warn('[PAYMENT_WEBHOOK] IP no autorizada:', clientIP);
      await paymentService.handleWebhook(req.body, null).catch(() => {});
      // Responder 200 para no revelar que la IP fue rechazada
      return res.status(200).json({ received: true });
    }

    // Validar que el body tenga la estructura esperada
    if (!req.body || (!req.body.type && !req.body.action && !req.body.id)) {
      console.warn('[PAYMENT_WEBHOOK] Webhook con estructura inválida:', req.body);
      return res.status(400).json({
        error: 'Invalid webhook structure',
      });
    }

    // Registrar webhook recibido
    console.log('[PAYMENT_WEBHOOK] Webhook recibido:', {
      type: req.body.type || req.body.action,
      data: req.body.data ? 'present' : 'missing',
      timestamp: new Date().toISOString(),
      ip: clientIP,
    });

    // Obtener firma si está disponible (Mercado Pago puede enviar headers)
    const signature = req.headers['x-signature'] || req.headers['x-mercadopago-signature'] || null;

    const result = await paymentService.handleWebhook(req.body, signature);

    res.json(result);
  } catch (error) {
    console.error('[PAYMENT_WEBHOOK] Error procesando webhook:', error);
    // Responder 200 para evitar reintentos de Mercado Pago
    res.status(200).json({
      received: true,
      error: error.message || 'Webhook processing failed',
    });
  }
});

export default router;
