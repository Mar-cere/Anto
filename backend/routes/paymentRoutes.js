/**
 * Rutas de Pagos y Suscripciones
 * 
 * Endpoints para gestionar pagos, suscripciones y transacciones
 * usando Mercado Pago como proveedor de pagos.
 * 
 * @author AntoApp Team
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserObjectId } from '../middleware/validation.js';
import paymentService from '../services/paymentService.js';
import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import { getPlanPrice, formatAmount, isMercadoPagoConfigured } from '../config/mercadopago.js';
import Joi from 'joi';

const router = express.Router();

// Esquema de validación para crear checkout
const createCheckoutSchema = Joi.object({
  plan: Joi.string().valid('monthly', 'yearly').required(),
  successUrl: Joi.string().uri().optional(),
  cancelUrl: Joi.string().uri().optional(),
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
 */
router.get('/plans', (req, res) => {
  try {
    if (!isMercadoPagoConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Sistema de pagos no configurado',
      });
    }

    const currency = 'CLP';
    const monthlyAmount = getPlanPrice('monthly');
    const yearlyAmount = getPlanPrice('yearly');
    const monthlyFormatted = formatAmount(monthlyAmount, currency);
    const yearlyFormatted = formatAmount(yearlyAmount, currency);
    const savingsAmount = monthlyAmount * 12 - yearlyAmount;

    const plans = {
      monthly: {
        id: 'monthly',
        name: 'Premium Mensual',
        amount: monthlyAmount,
        formattedAmount: monthlyFormatted,
        interval: 'month',
        currency: currency,
        features: [
          'Chat ilimitado',
          'Todas las técnicas terapéuticas',
          'Análisis emocional avanzado',
          'Historial completo',
          'Exportación de datos',
          'Soporte prioritario',
        ],
      },
      yearly: {
        id: 'yearly',
        name: 'Premium Anual',
        amount: yearlyAmount,
        formattedAmount: yearlyFormatted,
        interval: 'year',
        currency: currency,
        discount: '33%',
        savings: formatAmount(savingsAmount, currency),
        features: [
          'Todo lo del plan mensual',
          'Ahorro de 2 meses',
          'Acceso anticipado a nuevas features',
        ],
      },
    };

    res.json({
      success: true,
      plans,
      provider: 'mercadopago',
    });
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
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const { error, value } = createCheckoutSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.details.map(d => d.message),
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
      const status = await paymentService.getSubscriptionStatus(userId);

      res.json({
        success: true,
        ...status,
      });
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
    const result = await paymentService.handleWebhook(req.body, null);

    res.json(result);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(400).json({
      error: error.message || 'Webhook processing failed',
    });
  }
});

export default router;
