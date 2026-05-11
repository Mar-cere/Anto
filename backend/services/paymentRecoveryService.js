/**
 * Servicio de Recuperación de Pagos
 * 
 * Detecta y recupera pagos que fueron procesados pero no activaron
 * las suscripciones correctamente.
 * 
 * @author AntoApp Team
 */

import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import paymentServiceMercadoPago from './paymentServiceMercadoPago.js';
import paymentAuditService from './paymentAuditService.js';

class PaymentRecoveryService {
  /**
   * Intentar activar una suscripción desde una transacción completada
   * @param {string} transactionId - ID de la transacción
   * @returns {Promise<Object>} - Resultado de la activación
   */
  async activateFromTransaction(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate('userId', 'email username name');

      if (!transaction) {
        return {
          success: false,
          error: 'Transacción no encontrada',
        };
      }

      if (transaction.status !== 'completed') {
        return {
          success: false,
          error: 'La transacción no está completada',
          status: transaction.status,
        };
      }

      if (transaction.type !== 'subscription') {
        return {
          success: false,
          error: 'La transacción no es de tipo suscripción',
        };
      }

      const userId = transaction.userId._id;
      const plan = transaction.plan;

      // Verificar si ya está activada (por fechas; premium vencido debe poder recuperarse)
      const existingSubscription = await Subscription.findOne({ userId });
      const user = await User.findById(userId);
      const now = new Date();

      const subEnd = existingSubscription?.currentPeriodEnd
        ? new Date(existingSubscription.currentPeriodEnd)
        : null;
      const subTrialEnd = existingSubscription?.trialEnd
        ? new Date(existingSubscription.trialEnd)
        : null;
      const userPremiumEnd = user?.subscription?.subscriptionEndDate
        ? new Date(user.subscription.subscriptionEndDate)
        : null;
      const userTrialEnd = user?.subscription?.trialEndDate
        ? new Date(user.subscription.trialEndDate)
        : null;

      const subActiveVigent =
        existingSubscription?.status === 'active' &&
        subEnd &&
        !Number.isNaN(subEnd.getTime()) &&
        subEnd >= now;
      const subTrialingVigent =
        existingSubscription?.status === 'trialing' &&
        subTrialEnd &&
        !Number.isNaN(subTrialEnd.getTime()) &&
        subTrialEnd >= now;
      const userPremiumVigent =
        user?.subscription?.status === 'premium' &&
        userPremiumEnd &&
        !Number.isNaN(userPremiumEnd.getTime()) &&
        userPremiumEnd >= now;
      const userTrialVigent =
        user?.subscription?.status === 'trial' &&
        userTrialEnd &&
        !Number.isNaN(userTrialEnd.getTime()) &&
        userTrialEnd >= now;

      if (subActiveVigent || subTrialingVigent || userPremiumVigent || userTrialVigent) {
        return {
          success: true,
          message: 'La suscripción ya está activa',
          alreadyActive: true,
        };
      }

      // Activar suscripción (forzar reintento; no aplicar idempotencia por paymentId)
      await paymentServiceMercadoPago.activateSubscriptionFromPayment(transaction, {
        skipIdempotency: true,
        source: 'recovery',
        externalId:
          transaction.metadata?.paymentId ||
          transaction.metadata?.mercadopagoPaymentId ||
          transaction.providerTransactionId ||
          null,
      });

      // Registrar evento
      await paymentAuditService.logEvent('SUBSCRIPTION_RECOVERED', {
        transactionId: transaction._id.toString(),
        userId: userId.toString(),
        plan,
        method: 'automatic_recovery',
      }, userId.toString(), transactionId);

      return {
        success: true,
        message: 'Suscripción activada correctamente',
        transactionId: transaction._id.toString(),
        userId: userId.toString(),
        plan,
      };
    } catch (error) {
      console.error('[PAYMENT_RECOVERY] Error activando suscripción:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Procesar todos los pagos no activados
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  async processUnactivatedPayments() {
    try {
      const unactivated = await paymentAuditService.findUnactivatedPayments();
      
      const results = {
        total: unactivated.length,
        successful: 0,
        failed: 0,
        errors: [],
      };

      for (const payment of unactivated) {
        try {
          const result = await this.activateFromTransaction(payment.transactionId);
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              transactionId: payment.transactionId,
              error: result.error,
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            transactionId: payment.transactionId,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('[PAYMENT_RECOVERY] Error procesando pagos no activados:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        errors: [error.message],
      };
    }
  }
}

export default new PaymentRecoveryService();

