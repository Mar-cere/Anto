/**
 * Servicio de Validación de Recibos de Apple
 * 
 * Valida recibos de App Store usando el servicio de verificación de Apple
 * 
 * @author AntoApp Team
 */

import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';
import paymentAuditService from './paymentAuditService.js';
import logger from '../utils/logger.js';

// URLs de verificación de Apple
const APPLE_VERIFY_URL_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_URL_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';

// Mapeo de Product IDs a planes
const PRODUCT_ID_TO_PLAN = {
  'com.anto.app.weekly': 'weekly',
  'com.anto.app.monthly': 'monthly',
  'com.anto.app.quarterly': 'quarterly',
  'com.anto.app.semestral': 'semestral',
  'com.anto.app.yearly': 'yearly',
};

// Mapeo de planes a duración en días
const PLAN_DURATION_DAYS = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  semestral: 180,
  yearly: 365,
};

class AppleReceiptService {
  /**
   * Validar recibo con Apple
   * @param {string} receiptData - Datos del recibo (base64)
   * @param {boolean} isSandbox - Si es sandbox o producción
   * @returns {Promise<Object>} - Respuesta de Apple
   */
  async validateReceiptWithApple(receiptData, isSandbox = false) {
    const startTime = Date.now();
    const verifyUrl = isSandbox ? APPLE_VERIFY_URL_SANDBOX : APPLE_VERIFY_URL_PRODUCTION;
    
    logger.externalService('Apple', 'Validando recibo', {
      isSandbox,
      url: verifyUrl,
      receiptLength: receiptData ? receiptData.length : 0,
      hasSharedSecret: !!process.env.APPLE_SHARED_SECRET,
    });
    
    // Obtener shared secret desde variables de entorno
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    
    if (!sharedSecret) {
      logger.error('[AppleReceipt] APPLE_SHARED_SECRET no configurado', {
        isSandbox,
      });
      throw new Error('APPLE_SHARED_SECRET no está configurado');
    }
    
    const payload = {
      'receipt-data': receiptData,
      password: sharedSecret, // Shared secret para suscripciones auto-renovables
      'exclude-old-transactions': true,
    };

    try {
      logger.debug('[AppleReceipt] Enviando petición a Apple', {
        isSandbox,
        url: verifyUrl,
        payloadSize: JSON.stringify(payload).length,
      });

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - startTime;
      logger.debug('[AppleReceipt] Respuesta recibida de Apple', {
        isSandbox,
        status: response.status,
        statusText: response.statusText,
        responseTime,
      });

      const data = await response.json();
      
      logger.externalService('Apple', 'Validación de recibo completada', {
        isSandbox,
        appleStatus: data.status,
        hasReceipt: !!data.receipt,
        hasLatestReceiptInfo: !!(data.latest_receipt_info && data.latest_receipt_info.length > 0),
        latestReceiptInfoCount: data.latest_receipt_info ? data.latest_receipt_info.length : 0,
        responseTime,
      });

      // Si el recibo es de sandbox pero se envió a producción, intentar con sandbox
      if (data.status === 21007 && !isSandbox) {
        logger.warn('[AppleReceipt] Recibo de sandbox detectado en producción, revalidando con sandbox', {
          originalStatus: data.status,
        });
        return this.validateReceiptWithApple(receiptData, true);
      }

      if (data.status !== 0) {
        logger.warn('[AppleReceipt] Recibo rechazado por Apple', {
          isSandbox,
          appleStatus: data.status,
          errorMessage: this.getStatusErrorMessage(data.status),
        });
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[AppleReceipt] Error validando recibo con Apple', {
        isSandbox,
        error: error.message,
        stack: error.stack,
        duration,
      });
      throw error;
    }
  }

  /**
   * Procesar y activar suscripción desde recibo validado
   * @param {string} userId - ID del usuario
   * @param {Object} receiptResponse - Respuesta de Apple
   * @param {string} productId - Product ID comprado
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  async processSubscription(userId, receiptResponse, productId, transactionId) {
    const startTime = Date.now();
    
    try {
      logger.payment('AppleReceiptService.processSubscription iniciado', {
        userId: userId.toString(),
        productId,
        transactionId: transactionId || 'no proporcionado',
        receiptStatus: receiptResponse.status,
      });

      // Verificar que el recibo es válido
      if (receiptResponse.status !== 0) {
        const errorMessage = this.getStatusErrorMessage(receiptResponse.status);
        logger.payment('AppleReceiptService.processSubscription: recibo inválido', {
          userId: userId.toString(),
          productId,
          transactionId: transactionId || 'no proporcionado',
          appleStatus: receiptResponse.status,
          errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
          status: receiptResponse.status,
        };
      }

      const receipt = receiptResponse.receipt;
      const latestReceiptInfo = receiptResponse.latest_receipt_info || [];
      
      logger.debug('[AppleReceipt] Procesando suscripción', {
        userId: userId.toString(),
        productId,
        transactionId: transactionId || 'no proporcionado',
        latestReceiptInfoCount: latestReceiptInfo.length,
        hasReceipt: !!receipt,
      });
      
      // Buscar la transacción más reciente para este producto
      const transaction = latestReceiptInfo
        .filter(t => t.product_id === productId)
        .sort((a, b) => {
          const dateA = new Date(parseInt(a.purchase_date_ms));
          const dateB = new Date(parseInt(b.purchase_date_ms));
          return dateB - dateA;
        })[0];

      if (!transaction) {
        logger.payment('AppleReceiptService.processSubscription: transacción no encontrada', {
          userId: userId.toString(),
          productId,
          transactionId: transactionId || 'no proporcionado',
          availableProductIds: latestReceiptInfo.map(t => t.product_id),
        });
        return {
          success: false,
          error: 'No se encontró la transacción en el recibo',
        };
      }

      logger.debug('[AppleReceipt] Transacción encontrada', {
        userId: userId.toString(),
        productId,
        transactionProductId: transaction.product_id,
        purchaseDateMs: transaction.purchase_date_ms,
        expiresDateMs: transaction.expires_date_ms,
        originalTransactionId: transaction.original_transaction_id,
      });

      // Obtener información del plan
      const plan = PRODUCT_ID_TO_PLAN[productId];
      if (!plan) {
        logger.payment('AppleReceiptService.processSubscription: Product ID no reconocido', {
          userId: userId.toString(),
          productId,
          availablePlans: Object.keys(PRODUCT_ID_TO_PLAN),
        });
        return {
          success: false,
          error: `Product ID no reconocido: ${productId}`,
        };
      }

      // Log específico para plan semanal (para debugging)
      if (plan === 'weekly') {
        logger.payment('AppleReceiptService.processSubscription: Procesando plan SEMANAL', {
          userId: userId.toString(),
          productId,
          plan,
          planDurationDays: PLAN_DURATION_DAYS[plan],
          transactionData: {
            product_id: transaction.product_id,
            purchase_date_ms: transaction.purchase_date_ms,
            expires_date_ms: transaction.expires_date_ms,
            original_transaction_id: transaction.original_transaction_id,
            is_trial_period: transaction.is_trial_period,
            is_in_intro_offer_period: transaction.is_in_intro_offer_period,
          },
        });
      }

      logger.debug('[AppleReceipt] Plan identificado', {
        userId: userId.toString(),
        productId,
        plan,
        planDurationDays: PLAN_DURATION_DAYS[plan],
      });

      // Calcular fechas
      const purchaseDate = new Date(parseInt(transaction.purchase_date_ms));
      
      // Para suscripciones semanales, Apple puede no proporcionar expires_date_ms
      // si la suscripción es muy corta o si hay problemas con la configuración
      let expiresDate;
      if (transaction.expires_date_ms) {
        expiresDate = new Date(parseInt(transaction.expires_date_ms));
      } else {
        // Calcular fecha de expiración basada en la duración del plan
        const durationMs = PLAN_DURATION_DAYS[plan] * 24 * 60 * 60 * 1000;
        expiresDate = new Date(purchaseDate.getTime() + durationMs);
        
        // Log específico para plan semanal cuando no hay expires_date_ms
        if (plan === 'weekly') {
          logger.warn('[AppleReceipt] Plan semanal sin expires_date_ms, calculando manualmente', {
            userId: userId.toString(),
            productId,
            purchaseDate: purchaseDate.toISOString(),
            calculatedExpiresDate: expiresDate.toISOString(),
            durationDays: PLAN_DURATION_DAYS[plan],
          });
        }
      }

      // Verificar si la suscripción está activa
      const now = new Date();
      const isActive = expiresDate > now;
      
      // Validación especial para plan semanal
      if (plan === 'weekly') {
        const daysUntilExpiry = Math.floor((expiresDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          logger.warn('[AppleReceipt] Plan semanal ya expirado al procesar', {
            userId: userId.toString(),
            productId,
            purchaseDate: purchaseDate.toISOString(),
            expiresDate: expiresDate.toISOString(),
            now: now.toISOString(),
            daysUntilExpiry,
          });
        } else if (daysUntilExpiry > 7) {
          logger.warn('[AppleReceipt] Plan semanal con duración inesperada', {
            userId: userId.toString(),
            productId,
            purchaseDate: purchaseDate.toISOString(),
            expiresDate: expiresDate.toISOString(),
            daysUntilExpiry,
            expectedDays: 7,
          });
        }
      }

      logger.debug('[AppleReceipt] Fechas calculadas', {
        userId: userId.toString(),
        purchaseDate: purchaseDate.toISOString(),
        expiresDate: expiresDate.toISOString(),
        now: now.toISOString(),
        isActive,
        daysUntilExpiry: Math.floor((expiresDate - now) / (1000 * 60 * 60 * 24)),
      });

      // Obtener o crear usuario
      const user = await User.findById(userId);
      if (!user) {
        logger.payment('AppleReceiptService.processSubscription: usuario no encontrado', {
          userId: userId.toString(),
          productId,
        });
        return {
          success: false,
          error: 'Usuario no encontrado',
        };
      }

      logger.debug('[AppleReceipt] Usuario encontrado', {
        userId: userId.toString(),
        currentSubscriptionStatus: user.subscription?.status,
        currentSubscriptionPlan: user.subscription?.plan,
      });

      // Actualizar suscripción del usuario
      logger.debug('[AppleReceipt] Actualizando suscripción del usuario', {
        userId: userId.toString(),
        oldStatus: user.subscription?.status,
        newStatus: isActive ? 'premium' : 'expired',
        plan,
      });

      user.subscription = {
        status: isActive ? 'premium' : 'expired',
        plan: plan,
        subscriptionStartDate: purchaseDate,
        subscriptionEndDate: expiresDate,
        provider: 'apple',
        appleTransactionId: transactionId,
        appleOriginalTransactionId: transaction.original_transaction_id,
      };

      await user.save();
      logger.database('Usuario actualizado con nueva suscripción', {
        userId: userId.toString(),
        subscriptionStatus: user.subscription.status,
        subscriptionPlan: user.subscription.plan,
      });

      // Crear o actualizar registro en modelo Subscription
      let subscription = await Subscription.findOne({ userId });
      const isNewSubscription = !subscription;
      
      if (!subscription) {
        logger.debug('[AppleReceipt] Creando nuevo registro de suscripción', {
          userId: userId.toString(),
          plan,
          isActive,
        });
        subscription = new Subscription({
          userId,
          provider: 'apple',
          plan: plan,
          status: isActive ? 'active' : 'expired',
          isActive,
          isInTrial: false,
        });
      } else {
        logger.debug('[AppleReceipt] Actualizando registro de suscripción existente', {
          userId: userId.toString(),
          oldPlan: subscription.plan,
          newPlan: plan,
          oldStatus: subscription.status,
          newStatus: isActive ? 'active' : 'expired',
        });
        subscription.provider = 'apple';
        subscription.plan = plan;
        subscription.status = isActive ? 'active' : 'expired';
        subscription.isActive = isActive;
        subscription.isInTrial = false;
      }

      subscription.appleTransactionId = transactionId;
      subscription.appleOriginalTransactionId = transaction.original_transaction_id;
      subscription.startDate = purchaseDate;
      subscription.endDate = expiresDate;
      await subscription.save();
      
      logger.database(isNewSubscription ? 'Nueva suscripción creada' : 'Suscripción actualizada', {
        userId: userId.toString(),
        subscriptionId: subscription._id.toString(),
        plan,
        status: subscription.status,
        isActive: subscription.isActive,
      });

      // Crear registro de transacción
      const transactionRecord = new Transaction({
        userId,
        type: 'subscription',
        provider: 'apple',
        amount: parseFloat(transaction.price || 0),
        currency: transaction.currency || 'USD',
        status: isActive ? 'completed' : 'expired',
        transactionId: transactionId,
        metadata: {
          productId,
          plan,
          purchaseDate,
          expiresDate,
          originalTransactionId: transaction.original_transaction_id,
        },
      });
      await transactionRecord.save();
      
      logger.database('Transacción creada', {
        userId: userId.toString(),
        transactionId: transactionRecord._id.toString(),
        amount: transactionRecord.amount,
        currency: transactionRecord.currency,
        status: transactionRecord.status,
      });

      // Registrar evento de auditoría
      await paymentAuditService.logEvent('APPLE_SUBSCRIPTION_ACTIVATED', {
        userId: userId.toString(),
        productId,
        plan,
        transactionId,
        originalTransactionId: transaction.original_transaction_id,
        purchaseDate,
        expiresDate,
        isActive,
      }, userId.toString());

      const duration = Date.now() - startTime;
      logger.payment('AppleReceiptService.processSubscription completado exitosamente', {
        userId: userId.toString(),
        productId,
        plan,
        transactionId,
        isActive,
        duration,
      });

      return {
        success: true,
        subscription: {
          status: user.subscription.status,
          plan: plan,
          startDate: purchaseDate,
          endDate: expiresDate,
          isActive,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[AppleReceipt] Error procesando suscripción', {
        userId: userId.toString(),
        productId,
        transactionId: transactionId || 'no proporcionado',
        error: error.message,
        stack: error.stack,
        duration,
      });
      
      await paymentAuditService.logEvent('APPLE_SUBSCRIPTION_ERROR', {
        userId: userId.toString(),
        productId,
        transactionId: transactionId || 'no proporcionado',
        error: error.message,
        stack: error.stack,
      }, userId.toString()).catch((auditError) => {
        logger.error('[AppleReceipt] Error registrando evento de auditoría', {
          originalError: error.message,
          auditError: auditError.message,
        });
      });

      return {
        success: false,
        error: error.message || 'Error al procesar la suscripción',
      };
    }
  }

  /**
   * Obtener mensaje de error según el código de estado de Apple
   * @param {number} status - Código de estado de Apple
   * @returns {string} - Mensaje de error
   */
  getStatusErrorMessage(status) {
    const errorMessages = {
      21000: 'El recibo enviado no es válido',
      21002: 'El recibo enviado no es válido',
      21003: 'El recibo no pudo ser autenticado',
      21004: 'La shared secret proporcionada no coincide',
      21005: 'El servidor de recibos no está disponible',
      21006: 'El recibo es válido pero la suscripción ha expirado',
      21007: 'El recibo es de sandbox pero se envió a producción',
      21008: 'El recibo es de producción pero se envió a sandbox',
      21010: 'El recibo no puede ser autorizado',
    };

    return errorMessages[status] || `Error desconocido: ${status}`;
  }
}

export default new AppleReceiptService();

