/**
 * Servicio de Auditoría de Pagos
 * 
 * Registra y audita todas las operaciones relacionadas con pagos
 * para garantizar la integridad y trazabilidad del sistema.
 * 
 * @author AntoApp Team
 */

import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

class PaymentAuditService {
  /**
   * Registrar evento de auditoría
   * @param {string} eventType - Tipo de evento
   * @param {Object} data - Datos del evento
   * @param {string} userId - ID del usuario
   * @param {string} transactionId - ID de transacción (opcional)
   */
  async logEvent(eventType, data, userId, transactionId = null) {
    try {
      const logEntry = {
        timestamp: new Date(),
        eventType,
        userId,
        transactionId,
        data,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
      };

      console.log(`[PAYMENT_AUDIT] ${eventType}`, {
        userId,
        transactionId,
        timestamp: logEntry.timestamp,
        ...data,
      });

      // Aquí podrías guardar en una colección de auditoría si lo necesitas
      // await AuditLog.create(logEntry);
    } catch (error) {
      console.error('[PAYMENT_AUDIT] Error registrando evento:', error);
    }
  }

  /**
   * Verificar integridad de una transacción
   * @param {string} transactionId - ID de la transacción
   * @returns {Promise<Object>} - Resultado de la verificación
   */
  async verifyTransactionIntegrity(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate('userId', 'email username name');

      if (!transaction) {
        return {
          valid: false,
          error: 'Transacción no encontrada',
        };
      }

      // Verificar que el usuario existe
      if (!transaction.userId) {
        return {
          valid: false,
          error: 'Usuario asociado no encontrado',
        };
      }

      // Verificar que el userId en la transacción coincide con el usuario
      if (transaction.userId._id.toString() !== transaction.userId.toString()) {
        return {
          valid: false,
          error: 'Inconsistencia en el ID de usuario',
        };
      }

      // Si la transacción está completada, verificar que la suscripción esté activa
      if (transaction.status === 'completed' && transaction.type === 'subscription') {
        const subscription = await Subscription.findOne({ userId: transaction.userId._id });
        const user = await User.findById(transaction.userId._id);

        if (!subscription && user?.subscription.status !== 'premium') {
          return {
            valid: false,
            error: 'Pago completado pero suscripción no activada',
            requiresActivation: true,
            transactionId: transaction._id.toString(),
            userId: transaction.userId._id.toString(),
          };
        }
      }

      return {
        valid: true,
        transaction: {
          id: transaction._id.toString(),
          userId: transaction.userId._id.toString(),
          userEmail: transaction.userId.email,
          userName: transaction.userId.name || transaction.userId.username,
          amount: transaction.amount,
          status: transaction.status,
          plan: transaction.plan,
        },
      };
    } catch (error) {
      console.error('[PAYMENT_AUDIT] Error verificando integridad:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Buscar pagos completados sin suscripción activa
   * @returns {Promise<Array>} - Lista de pagos que requieren activación
   */
  async findUnactivatedPayments() {
    try {
      const completedTransactions = await Transaction.find({
        status: 'completed',
        type: 'subscription',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Últimos 7 días
      }).populate('userId', 'email username name subscription');

      const unactivated = [];

      for (const transaction of completedTransactions) {
        if (!transaction.userId) continue;

        const subscription = await Subscription.findOne({ userId: transaction.userId._id });
        const user = await User.findById(transaction.userId._id);

        const isActivated = subscription?.status === 'active' || 
                           user?.subscription.status === 'premium';

        if (!isActivated) {
          unactivated.push({
            transactionId: transaction._id.toString(),
            userId: transaction.userId._id.toString(),
            userEmail: transaction.userId.email,
            userName: transaction.userId.name || transaction.userId.username,
            amount: transaction.amount,
            plan: transaction.plan,
            completedAt: transaction.processedAt || transaction.createdAt,
            daysSinceCompletion: Math.floor(
              (Date.now() - (transaction.processedAt || transaction.createdAt)) / (1000 * 60 * 60 * 24)
            ),
          });
        }
      }

      return unactivated;
    } catch (error) {
      console.error('[PAYMENT_AUDIT] Error buscando pagos no activados:', error);
      return [];
    }
  }

  /**
   * Verificar que un usuario tiene acceso válido
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Estado de acceso del usuario
   */
  async verifyUserAccess(userId) {
    try {
      const user = await User.findById(userId).select('email username name subscription');
      if (!user) {
        return {
          valid: false,
          error: 'Usuario no encontrado',
        };
      }

      const subscription = await Subscription.findOne({ userId });
      const now = new Date();

      // Verificar trial
      const isInTrial = user.subscription.status === 'trial' &&
                       user.subscription.trialEndDate &&
                       now <= user.subscription.trialEndDate;

      // Verificar suscripción premium
      const hasPremium = user.subscription.status === 'premium' &&
                        user.subscription.subscriptionEndDate &&
                        now <= user.subscription.subscriptionEndDate;

      // Verificar suscripción en modelo separado
      const hasActiveSubscription = subscription?.status === 'active' &&
                                   subscription?.isActive;

      return {
        valid: isInTrial || hasPremium || hasActiveSubscription,
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          name: user.name,
        },
        subscription: {
          status: user.subscription.status,
          isInTrial,
          hasPremium,
          hasActiveSubscription,
          trialEndDate: user.subscription.trialEndDate,
          subscriptionEndDate: user.subscription.subscriptionEndDate,
        },
      };
    } catch (error) {
      console.error('[PAYMENT_AUDIT] Error verificando acceso:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

export default new PaymentAuditService();

