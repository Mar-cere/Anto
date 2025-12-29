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
    const verifyUrl = isSandbox ? APPLE_VERIFY_URL_SANDBOX : APPLE_VERIFY_URL_PRODUCTION;
    
    // Obtener shared secret desde variables de entorno
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    
    const payload = {
      'receipt-data': receiptData,
      password: sharedSecret, // Shared secret para suscripciones auto-renovables
      'exclude-old-transactions': true,
    };

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Si el recibo es de sandbox pero se envió a producción, intentar con sandbox
      if (data.status === 21007 && !isSandbox) {
        console.log('[AppleReceipt] Recibo de sandbox detectado, revalidando...');
        return this.validateReceiptWithApple(receiptData, true);
      }

      return data;
    } catch (error) {
      console.error('[AppleReceipt] Error validando recibo:', error);
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
    try {
      // Verificar que el recibo es válido
      if (receiptResponse.status !== 0) {
        const errorMessage = this.getStatusErrorMessage(receiptResponse.status);
        return {
          success: false,
          error: errorMessage,
          status: receiptResponse.status,
        };
      }

      const receipt = receiptResponse.receipt;
      const latestReceiptInfo = receiptResponse.latest_receipt_info || [];
      
      // Buscar la transacción más reciente para este producto
      const transaction = latestReceiptInfo
        .filter(t => t.product_id === productId)
        .sort((a, b) => {
          const dateA = new Date(parseInt(a.purchase_date_ms));
          const dateB = new Date(parseInt(b.purchase_date_ms));
          return dateB - dateA;
        })[0];

      if (!transaction) {
        return {
          success: false,
          error: 'No se encontró la transacción en el recibo',
        };
      }

      // Obtener información del plan
      const plan = PRODUCT_ID_TO_PLAN[productId];
      if (!plan) {
        return {
          success: false,
          error: `Product ID no reconocido: ${productId}`,
        };
      }

      // Calcular fechas
      const purchaseDate = new Date(parseInt(transaction.purchase_date_ms));
      const expiresDate = transaction.expires_date_ms 
        ? new Date(parseInt(transaction.expires_date_ms))
        : new Date(purchaseDate.getTime() + PLAN_DURATION_DAYS[plan] * 24 * 60 * 60 * 1000);

      // Verificar si la suscripción está activa
      const now = new Date();
      const isActive = expiresDate > now;

      // Obtener o crear usuario
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'Usuario no encontrado',
        };
      }

      // Actualizar suscripción del usuario
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

      // Crear o actualizar registro en modelo Subscription
      let subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        subscription = new Subscription({
          userId,
          provider: 'apple',
          plan: plan,
          status: isActive ? 'active' : 'expired',
          isActive,
          isInTrial: false,
        });
      } else {
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
      console.error('[AppleReceipt] Error procesando suscripción:', error);
      await paymentAuditService.logEvent('APPLE_SUBSCRIPTION_ERROR', {
        userId: userId.toString(),
        error: error.message,
      }, userId.toString()).catch(() => {});

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

