/**
 * Rutas de Pagos y Suscripciones
 * 
 * Endpoints para gestionar pagos, suscripciones y transacciones
 * usando Mercado Pago como proveedor de pagos.
 * 
 * @author AntoApp Team
 */

import express from 'express';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import Joi from 'joi';
import { formatAmount, getPlanPrice } from '../config/mercadopago.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserObjectId } from '../middleware/validation.js';
import Transaction from '../models/Transaction.js';
import appleReceiptService from '../services/appleReceiptService.js';
import {
  extractAppleSignedPayload,
  handleAppleServerNotification,
} from '../services/appleServerNotificationService.js';
import cacheService from '../services/cacheService.js';
import paymentAuditService from '../services/paymentAuditService.js';
import paymentService from '../services/paymentService.js';
import logger from '../utils/logger.js';
import { normalizeAppleReceiptPayload } from '../utils/appleReceiptNormalize.js';
import {
  extractMercadoPagoWebhookResourceId,
  verifyMercadoPagoWebhookSignature
} from '../utils/mercadopagoWebhookSignature.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { paymentApiCopy } from '../utils/paymentApiCopy.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';

const router = express.Router();

router.use((req, res, next) => {
  const language = resolveRequestLanguage(req);
  req.appLanguage = language;
  req.apiCopy = paymentApiCopy(language);
  next();
});

/** Deep links de la app (Android/iOS) tras pago Mercado Pago vía navegador. */
const PAYMENT_RETURN_APP_SUCCESS = 'anto://payments/success';
const PAYMENT_RETURN_APP_CANCEL = 'anto://payments/cancel';

/**
 * HTML mínimo sin JS inline (compatible con CSP estricto): meta refresh + enlace manual.
 */
function paymentReturnHtml(appDeepLink, title, bodyText) {
  const safeLink = appDeepLink.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${safeLink}" />
  <title>${title}</title>
</head>
<body>
  <p>${bodyText}</p>
  <p><a href="${safeLink}">Abrir la app Anto</a></p>
</body>
</html>`;
}

/**
 * GET /api/payments/return/success
 * URL HTTPS para Mercado Pago (back_url). Redirige al deep link de la app.
 * Si viene preapproval_id, activa suscripción e invalida caché antes del HTML (evita trial stale).
 */
router.get('/return/success', async (req, res) => {
  const preapprovalId = req.query.preapproval_id || req.query.preapprovalId;
  if (preapprovalId) {
    try {
      await paymentService.syncAfterBrowserReturn(String(preapprovalId));
    } catch (e) {
      logger.warn('[PAYMENT_RETURN] syncAfterBrowserReturn falló; se envía redirección igual', {
        error: e?.message,
        preapprovalId: String(preapprovalId),
      });
    }
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.type('html').send(
    paymentReturnHtml(
      PAYMENT_RETURN_APP_SUCCESS,
      'Pago — Anto',
      'Volviendo a la app Anto…'
    )
  );
});

/**
 * GET /api/payments/return/cancel
 * URL HTTPS para cancel_url en checkout.
 */
router.get('/return/cancel', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.type('html').send(
    paymentReturnHtml(
      PAYMENT_RETURN_APP_CANCEL,
      'Pago cancelado — Anto',
      'Pago cancelado. Puedes volver a la app Anto.'
    )
  );
});

// Rate limiters para pagos
const checkoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de checkout por 15 minutos
  message: (req) => paymentApiCopy(resolveRequestLanguage(req)).rateLimitCheckout,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No aplicar rate limiting en desarrollo
    return process.env.NODE_ENV === 'development';
  }
});

const paymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Máximo 20 operaciones de pago por hora
  message: (req) => paymentApiCopy(resolveRequestLanguage(req)).rateLimitPayment,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// Webhooks de terceros (Mercado Pago, Apple ASN); límite permisivo
const webhookLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: (req) => paymentApiCopy(resolveRequestLanguage(req)).rateLimitWebhook,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Esquema de validación para crear checkout
const createCheckoutSchema = Joi.object({
  plan: Joi.string().valid('monthly', 'quarterly', 'semestral', 'yearly').required(),
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
    const monthlyAmount = getPlanPrice('monthly');
    const quarterlyAmount = getPlanPrice('quarterly');
    const semestralAmount = getPlanPrice('semestral');
    const yearlyAmount = getPlanPrice('yearly');
    

    // Todos los planes incluyen el servicio completo
    const allFeatures = [
      'Servicio completo incluido',
    ];

    const plans = {
      monthly: {
        id: 'monthly',
        name: 'Premium Mensual',
        amount: monthlyAmount,
        formattedAmount: formatAmount(monthlyAmount, currency),
        interval: 'month',
        currency: currency,
        features: allFeatures,
      },
      quarterly: {
        id: 'quarterly',
        name: 'Premium Trimestral',
        amount: quarterlyAmount,
        formattedAmount: formatAmount(quarterlyAmount, currency),
        interval: 'quarter',
        currency: currency,
        features: allFeatures,
      },
      semestral: {
        id: 'semestral',
        name: 'Premium Semestral',
        amount: semestralAmount,
        formattedAmount: formatAmount(semestralAmount, currency),
        interval: 'semester',
        currency: currency,
        features: allFeatures,
      },
      yearly: {
        id: 'yearly',
        name: 'Premium Anual',
        amount: yearlyAmount,
        formattedAmount: formatAmount(yearlyAmount, currency),
        interval: 'year',
        currency: currency,
        features: allFeatures,
      },
    };

    const response = {
      success: true,
      plans,
      provider: 'mercadopago',
    };
    
    // Guardar en caché por 5 minutos (reducido para permitir actualizaciones rápidas de precios)
    await cacheService.set(cacheKey, response, 300);
    
    res.json(response);
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({
      success: false,
      error: req.apiCopy.plansError,
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
          error: req.apiCopy.invalidData,
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
        error: error.message || req.apiCopy.checkoutError,
      });
    }
  }
);

/**
 * GET /api/payments/trial-info
 * Obtener información del trial del usuario (cache 60s para reducir llamadas repetidas)
 */
const TRIAL_INFO_TTL_SECONDS = 60;
router.get(
  '/trial-info',
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const cacheKey = cacheService.generateKey('trial-info', userId);
      const trialInfo = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const trialNotificationService = (await import('../services/trialNotificationService.js')).default;
          return trialNotificationService.getTrialInfo(userId);
        },
        TRIAL_INFO_TTL_SECONDS
      );

      res.json({
        success: true,
        ...trialInfo,
      });
    } catch (error) {
      console.error('Error obteniendo info de trial:', error);
      res.status(500).json({
        success: false,
        error: req.apiCopy.trialError,
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
    const startTime = Date.now();
    const userId = req.user._id;
    
    // Agregar headers para evitar caché del navegador y deshabilitar 304
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    
    // Deshabilitar la verificación de freshness de Express para evitar 304
    // Esto fuerza que siempre se devuelva 200 en lugar de 304
    req.headers['if-none-match'] = undefined;
    req.headers['if-modified-since'] = undefined;
    
    try {
      logger.payment('GET /subscription-status iniciado', {
        userId: userId.toString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
        ifNoneMatch: req.get('if-none-match'),
        ifModifiedSince: req.get('if-modified-since'),
      });
      
      const cacheKey = cacheService.generateKey('subscription', userId);
      logger.debug('[PaymentRoutes] Cache key generado', { cacheKey, userId: userId.toString() });
      
      // Verificar si está en caché antes de usar getOrSet
      let wasCached = false;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        wasCached = true;
        logger.payment('GET /subscription-status: respuesta desde caché', {
          userId: userId.toString(),
          cached: true,
          duration: Date.now() - startTime,
        });
        // Agregar timestamp único para evitar que Express devuelva 304
        const response = {
          ...cached,
          _timestamp: Date.now(), // Timestamp único para evitar 304
        };
        // Forzar status 200 explícitamente
        return res.status(200).json(response);
      }
      
      // Usar getOrSet para evitar cache stampede (múltiples solicitudes simultáneas)
      // Si hay cache miss, solo una solicitud ejecutará la consulta
      logger.debug('[PaymentRoutes] Cache miss, obteniendo estado de suscripción', {
        userId: userId.toString(),
      });
      
      let cacheResponse;
      try {
        cacheResponse = await cacheService.getOrSet(
          cacheKey,
          async () => {
            const status = await paymentService.getSubscriptionStatus(userId);
            
            logger.debug('[PaymentRoutes] Estado de suscripción obtenido', {
              userId: userId.toString(),
              hasStatus: !!status,
              statusKeys: status ? Object.keys(status) : [],
            });

            return {
              success: true,
              ...status,
            };
          },
          120 // 2 min: menor desfase entre UI y gate del chat
        );

        logger.debug('[PaymentRoutes] Respuesta guardada en caché', {
          userId: userId.toString(),
          ttl: 120,
        });
      } catch (cacheError) {
        logger.error('[PaymentRoutes] Error en getOrSet para subscription-status', {
          userId: userId.toString(),
          error: cacheError.message,
          stack: cacheError.stack,
        });
        // Si hay error en el caché, intentar obtener directamente sin caché
        logger.debug('[PaymentRoutes] Reintentando sin caché...', {
          userId: userId.toString(),
        });
        const status = await paymentService.getSubscriptionStatus(userId);
        cacheResponse = {
          success: true,
          ...status,
        };
      }

      // Agregar timestamp único para evitar que Express devuelva 304
      const response = {
        ...cacheResponse,
        _timestamp: Date.now(), // Timestamp único para evitar 304
      };

      const duration = Date.now() - startTime;
      logger.payment('GET /subscription-status completado exitosamente', {
        userId: userId.toString(),
        duration,
        cached: false,
      });

      // Forzar status 200 explícitamente (no permitir 304)
      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.requestError(req, error, 'Error obteniendo estado de suscripción');
      logger.payment('GET /subscription-status error', {
        userId: userId.toString(),
        error: error.message,
        stack: error.stack,
        duration,
      });
      
      res.status(500).json({
        success: false,
        error: error.message || req.apiCopy.subscriptionStatusError,
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
          error: req.apiCopy.invalidData,
          details: error.details.map(d => d.message),
        });
      }

      const { cancelImmediately } = value;
      const userId = req.user._id;

      const result = await paymentService.cancelSubscription(userId, cancelImmediately);

      await cacheService.invalidateUserCache(userId).catch((err) => {
        logger.warn('POST /cancel-subscription: error invalidando caché de usuario', {
          userId: userId.toString(),
          error: err?.message,
        });
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      res.status(500).json({
        success: false,
        error: error.message || req.apiCopy.cancelError,
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
          error: req.apiCopy.invalidData,
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
        error: error.message || req.apiCopy.paymentMethodError,
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
        error: req.apiCopy.transactionsError,
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
        error: req.apiCopy.statsError,
      });
    }
  }
);

/**
 * POST /api/payments/validate-receipt
 * Validar recibo de Apple App Store (StoreKit)
 */
const validateReceiptSchema = Joi.object({
  receipt: Joi.string().min(1).required(),
  productId: Joi.string().required(),
  transactionId: Joi.string().optional(),
  originalTransactionIdentifierIOS: Joi.string().optional(),
  restore: Joi.boolean().default(false),
});

router.post(
  '/validate-receipt',
  paymentLimiter,
  authenticateToken,
  validateUserObjectId,
  async (req, res) => {
    const startTime = Date.now();
    const userId = req.user._id;
    
    try {
      logger.payment('POST /validate-receipt iniciado', {
        userId: userId.toString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
        hasReceipt: !!req.body.receipt,
        hasProductId: !!req.body.productId,
        restore: req.body.restore || false,
      });

      const { error, value } = validateReceiptSchema.validate(req.body);
      if (error) {
        logger.payment('POST /validate-receipt: validación fallida', {
          userId: userId.toString(),
          validationErrors: error.details.map(d => d.message),
        });
        return res.status(400).json({
          success: false,
          error: req.apiCopy.invalidData,
          details: error.details.map(d => d.message),
        });
      }

      const { receipt: rawReceipt, productId, transactionId, originalTransactionIdentifierIOS, restore } =
        value;

      const normalized = normalizeAppleReceiptPayload(rawReceipt);
      if (!normalized.ok) {
        logger.payment('POST /validate-receipt: recibo inválido antes de Apple', {
          userId: userId.toString(),
          productId,
          reason: normalized.error,
          rawLength: typeof rawReceipt === 'string' ? rawReceipt.length : 0,
        });
        return res.status(400).json({
          success: false,
          error: normalized.error,
          appleStatus: 21002,
        });
      }
      const receipt = normalized.receipt;

      logger.payment('POST /validate-receipt: datos validados', {
        userId: userId.toString(),
        productId,
        transactionId: transactionId || 'no proporcionado',
        originalTransactionIdentifierIOS: originalTransactionIdentifierIOS || 'no proporcionado',
        restore,
        receiptLength: receipt.length,
      });

      // Validar recibo con Apple
      const isSandbox =
        process.env.NODE_ENV !== 'production' || process.env.APPLE_IAP_FORCE_SANDBOX === 'true';
      logger.payment('POST /validate-receipt: iniciando validación con Apple', {
        userId: userId.toString(),
        isSandbox,
        environment: process.env.NODE_ENV,
      });

      const receiptResponse = await appleReceiptService.validateReceiptWithApple(receipt, isSandbox);
      
      logger.payment('POST /validate-receipt: respuesta de Apple recibida', {
        userId: userId.toString(),
        appleStatus: receiptResponse.status,
        hasReceipt: !!receiptResponse.receipt,
        hasLatestReceiptInfo: !!(receiptResponse.latest_receipt_info && receiptResponse.latest_receipt_info.length > 0),
        latestReceiptInfoCount: receiptResponse.latest_receipt_info ? receiptResponse.latest_receipt_info.length : 0,
      });

      // Si Apple rechazó el recibo, retornar error inmediatamente sin procesar
      if (receiptResponse.status !== 0) {
        const errorMessage = appleReceiptService.getStatusErrorMessage 
          ? appleReceiptService.getStatusErrorMessage(receiptResponse.status)
          : `Recibo rechazado por Apple (código: ${receiptResponse.status})`;
        
        // En JSON logging (Render) el "message" es lo visible; meter el código en el texto.
        logger.payment(
          `POST /validate-receipt: Apple rechazó el recibo — status=${receiptResponse.status} — ${errorMessage}`,
          {
            userId: userId.toString(),
            appleStatus: receiptResponse.status,
            productId,
            errorMessage,
          }
        );
        
        return res.status(400).json({
          success: false,
          error: errorMessage,
          status: receiptResponse.status,
          appleStatus: receiptResponse.status,
        });
      }

      // Procesar suscripción
      logger.payment('POST /validate-receipt: iniciando procesamiento de suscripción', {
        userId: userId.toString(),
        productId,
        transactionId: transactionId || originalTransactionIdentifierIOS,
      });

      const result = await appleReceiptService.processSubscription(
        userId,
        receiptResponse,
        productId,
        transactionId || originalTransactionIdentifierIOS
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.payment('POST /validate-receipt: suscripción procesada exitosamente', {
          userId: userId.toString(),
          productId,
          transactionId: transactionId || originalTransactionIdentifierIOS,
          restore,
          duration,
          subscriptionStatus: result.subscription?.status,
          subscriptionPlan: result.subscription?.plan,
          isActive: result.subscription?.isActive,
        });

        // Invalidar caché de suscripción para que el próximo GET subscription-status devuelva datos actualizados
        await cacheService.invalidateUserCache(userId).catch((err) => {
          logger.warn('POST /validate-receipt: error invalidando caché de usuario', { userId: userId.toString(), error: err?.message });
        });

        res.json({
          success: true,
          message: restore ? req.apiCopy.receiptRestored : req.apiCopy.receiptActivated,
          subscription: result.subscription,
        });
      } else {
        logger.error('POST /validate-receipt: Error procesando suscripción', {
            userId: userId.toString(),
            productId,
            transactionId: transactionId || originalTransactionIdentifierIOS,
            error: result.error,
            status: result.status,
            duration,
            possibleCauses: [
              'Producto no configurado correctamente en App Store Connect',
              'Suscripción semanal puede requerir configuración especial',
              'Verificar que el producto esté activo y disponible',
            ],
          });
        
        logger.payment('POST /validate-receipt: error procesando suscripción', {
          userId: userId.toString(),
          productId,
          transactionId: transactionId || originalTransactionIdentifierIOS,
          error: result.error,
          status: result.status,
          duration,
        });

        res.status(400).json({
          success: false,
          error: result.error,
          status: result.status,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.requestError(req, error, 'Error validando recibo de Apple');
      logger.payment('POST /validate-receipt: excepción no manejada', {
        userId: userId.toString(),
        error: error.message,
        stack: error.stack,
        duration,
      });
      
      res.status(500).json({
        success: false,
        error: error.message || req.apiCopy.validateReceiptError,
      });
    }
  }
);

/**
 * GET /api/payments/apple-server-notifications
 * Solo para comprobar que la URL existe (navegador). Apple siempre usa POST.
 */
router.get('/apple-server-notifications', (req, res) => {
  res.status(200).json({
    ok: true,
    hint:
      'App Store Server Notifications V2: Apple envía POST con JSON { "signedPayload": "..." }. Un GET no procesa notificaciones.',
  });
});

/**
 * POST /api/payments/apple-server-notifications
 * App Store Server Notifications V2. Apple firma el payload (JWS); no usar JWT de usuario.
 * Configurar la misma URL en App Store Connect (Producción y Sandbox).
 */
router.post(
  '/apple-server-notifications',
  webhookLimiter,
  async (req, res) => {
    try {
      const signedPayload = extractAppleSignedPayload(req.body);
      logger.payment(
        `[AppleASN] POST recibido ${JSON.stringify({
          bodyType: typeof req.body,
          bodyKeys:
            req.body && typeof req.body === 'object' && !Array.isArray(req.body)
              ? Object.keys(req.body)
              : [],
          hasSignedPayload: typeof signedPayload === 'string' && signedPayload.length > 0,
          signedPayloadLength: typeof signedPayload === 'string' ? signedPayload.length : 0,
          signedPayloadParts:
            typeof signedPayload === 'string' ? signedPayload.split('.').length : 0,
        })}`,
      );
      if (process.env.APPLE_ASN_DEBUG === 'true') {
        const sp = signedPayload;
        logger.debug('[AppleASN-DEBUG] POST apple-server-notifications', {
          hasSignedPayload: typeof sp === 'string' && sp.length > 0,
          signedPayloadLength: typeof sp === 'string' ? sp.length : 0,
          signedPayloadPrefix: typeof sp === 'string' ? sp.substring(0, 120) : null,
          bodyTopLevelKeys:
            req.body && typeof req.body === 'object' && !Array.isArray(req.body)
              ? Object.keys(req.body)
              : [],
        });
      }
      const result = await handleAppleServerNotification(signedPayload);
      return res.status(200).json({ received: true, ...result });
    } catch (error) {
      const msg = error?.message || String(error);
      logger.payment('POST /apple-server-notifications: error', {
        message: msg,
        stack: error?.stack,
      });
      if (
        msg === 'signedPayload requerido' ||
        msg.includes('Fallo verificación JWS') ||
        msg.includes('Notificación decodificada inválida') ||
        msg.includes('Notificación sin notificationUUID')
      ) {
        return res.status(400).json({ received: false, error: msg });
      }
      return res.status(500).json({ received: false, error: req.apiCopy.webhookInternalError });
    }
  }
);

/**
 * POST /api/payments/webhook
 * Webhook para eventos de pago de Mercado Pago
 * IMPORTANTE: Esta ruta NO debe usar authenticateToken
 */
router.post('/webhook', express.json(), webhookLimiter, async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    
    // Validar que el webhook viene de Mercado Pago
    // En producción, validar IPs y firma
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedIPs = process.env.MERCADOPAGO_WEBHOOK_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || [];
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    // En producción, validar IP si está configurada
    if (isProduction && allowedIPs.length > 0) {
      // Verificar IP directa o a través de proxy
      const isAllowedIP = allowedIPs.some(allowedIP => {
        return clientIP === allowedIP || 
               clientIP?.startsWith(allowedIP) ||
               req.headers['x-forwarded-for']?.includes(allowedIP);
      });
      
      if (!isAllowedIP) {
        console.warn('[PAYMENT_WEBHOOK] IP no autorizada:', {
          ip: clientIP,
          forwardedFor: req.headers['x-forwarded-for'],
          allowedIPs: allowedIPs.length,
          timestamp: new Date().toISOString()
        });
        
        // Registrar intento no autorizado
        await paymentAuditService.logEvent('WEBHOOK_UNAUTHORIZED_IP', {
          ip: clientIP,
          forwardedFor: req.headers['x-forwarded-for'],
          userAgent,
          hasBody: !!req.body
        }, null).catch(() => {});
        
        // Responder 200 para no revelar que la IP fue rechazada
        return res.status(200).json({ received: true });
      }
    }

    // Mercado Pago puede enviar webhook en body JSON o vía query params.
    // Normalizamos ambos formatos para evitar perder notificaciones válidas.
    const hasBody = req.body && Object.keys(req.body).length > 0;
    const normalizedPayload = hasBody
      ? req.body
      : {
          type: req.query.type || req.query.topic,
          action: req.query.action || null,
          id: req.query.id || null,
          data: {
            id: req.query['data.id'] || req.query.id || null,
          },
        };

    // Validar que el payload tenga la estructura esperada
    if (!normalizedPayload || (!normalizedPayload.type && !normalizedPayload.action && !normalizedPayload.id && !normalizedPayload?.data?.id)) {
      console.warn('[PAYMENT_WEBHOOK] Webhook con estructura inválida:', {
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        queryKeys: req.query ? Object.keys(req.query) : [],
        ip: clientIP
      });
      
      await paymentAuditService.logEvent('WEBHOOK_INVALID_STRUCTURE', {
        ip: clientIP,
        userAgent,
        bodyKeys: req.body ? Object.keys(req.body) : []
      }, null).catch(() => {});
      
      return res.status(400).json({
        error: 'Invalid webhook structure',
      });
    }

    const xSignatureRaw = req.headers['x-signature'] || req.headers['x-mercadopago-signature'] || null;
    const xRequestId = req.headers['x-request-id'] || null;
    const resourceId = extractMercadoPagoWebhookResourceId(normalizedPayload);

    // Con MERCADOPAGO_WEBHOOK_SECRET: validación HMAC real (no usar x-request-id como “firma”).
    if (webhookSecret) {
      if (!xSignatureRaw || !xRequestId || !resourceId) {
        console.warn('[PAYMENT_WEBHOOK] Falta firma, x-request-id o data.id para validar:', {
          ip: clientIP,
          hasSignature: !!xSignatureRaw,
          hasRequestId: !!xRequestId,
          hasResourceId: !!resourceId
        });
        await paymentAuditService.logEvent('WEBHOOK_MISSING_SIGNATURE', {
          ip: clientIP,
          userAgent,
          reason: 'incomplete_headers_or_body',
          type: normalizedPayload?.type || normalizedPayload?.action
        }, null).catch(() => {});
        return res.status(400).json({
          error: 'Missing webhook signature or notification id'
        });
      }

      const verification = verifyMercadoPagoWebhookSignature({
        rawXSignature: xSignatureRaw,
        xRequestId,
        dataId: resourceId,
        secret: webhookSecret
      });

      if (!verification.valid) {
        console.warn('[PAYMENT_WEBHOOK] Firma inválida:', {
          ip: clientIP,
          reason: verification.reason,
          resourceId
        });
        await paymentAuditService.logEvent('WEBHOOK_SIGNATURE_INVALID', {
          ip: clientIP,
          userAgent,
          reason: verification.reason,
          resourceId
        }, null).catch(() => {});
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    } else if (isProduction) {
      logger.warn('[PAYMENT_WEBHOOK] MERCADOPAGO_WEBHOOK_SECRET no configurado en producción: se aceptan notificaciones sin HMAC');
    }

    // Registrar webhook recibido
    console.log('[PAYMENT_WEBHOOK] Webhook recibido:', {
      type: normalizedPayload.type || normalizedPayload.action,
      data: normalizedPayload.data ? 'present' : 'missing',
      hasSignature: !!xSignatureRaw,
      resourceId,
      timestamp: new Date().toISOString(),
      ip: clientIP,
      source: hasBody ? 'body' : 'query',
    });

    const result = await paymentService.handleWebhook(normalizedPayload, xSignatureRaw || '');

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
