/**
 * Servicio de Pagos con Mercado Pago
 * 
 * Gestiona todas las operaciones relacionadas con pagos usando Mercado Pago,
 * incluyendo creación de preferencias de pago, suscripciones,
 * y procesamiento de webhooks (notificaciones IPN).
 * 
 * @author AntoApp Team
 */

import { preferenceClient, preapprovalClient, preapprovalPlanClient, MERCADOPAGO_CONFIG, getPlanPrice, getPreapprovalPlanId, getPreapprovalCheckoutUrl, isMercadoPagoConfigured } from '../config/mercadopago.js';
import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import paymentAuditService from './paymentAuditService.js';

class PaymentServiceMercadoPago {
  /**
   * Crear sesión de checkout para suscripción recurrente usando Preapproval Plans
   * @param {string} userId - ID del usuario
   * @param {string} plan - Plan seleccionado ('monthly' o 'yearly')
   * @param {string} successUrl - URL de éxito (opcional, para redirección después del pago)
   * @param {string} cancelUrl - URL de cancelación (opcional)
   * @returns {Promise<Object>} - URL de checkout de Mercado Pago
   */
  async createCheckoutSession(userId, plan, successUrl = null, cancelUrl = null) {
    try {
      if (!isMercadoPagoConfigured()) {
        throw new Error('Mercado Pago no está configurado correctamente. Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado.');
      }

      // Validar y obtener usuario con información completa
      if (!userId || typeof userId.toString !== 'function') {
        throw new Error('ID de usuario inválido');
      }

      const userIdString = userId.toString();
      const user = await User.findById(userIdString).select('email username name subscription');
      if (!user) {
        await paymentAuditService.logEvent('CHECKOUT_CREATION_FAILED', {
          reason: 'user_not_found',
          userId: userIdString,
          plan,
        }, userIdString);
        throw new Error('Usuario no encontrado');
      }

      // Validar que el userId sea un ObjectId válido
      if (!userIdString.match(/^[0-9a-fA-F]{24}$/)) {
        await paymentAuditService.logEvent('CHECKOUT_CREATION_FAILED', {
          reason: 'invalid_user_id_format',
          userId: userIdString,
          plan,
        }, userIdString);
        throw new Error('ID de usuario con formato inválido');
      }

      // Validar que el plan sea válido
      const validPlans = ['weekly', 'monthly', 'quarterly', 'semestral', 'yearly'];
      if (!validPlans.includes(plan)) {
        throw new Error(`Plan inválido: ${plan}. Los planes válidos son: ${validPlans.join(', ')}`);
      }

      // Obtener el ID del Preapproval Plan
      const preapprovalPlanId = getPreapprovalPlanId(plan);
      if (!preapprovalPlanId) {
        throw new Error(`Preapproval Plan ID para ${plan} no está configurado. Por favor, configura MERCADOPAGO_PREAPPROVAL_PLAN_ID_${plan.toUpperCase()} en las variables de entorno`);
      }

      const price = getPlanPrice(plan);
      if (!price || price <= 0) {
        throw new Error(`Precio inválido para el plan ${plan}. Verifica la configuración de precios.`);
      }
      
      // Generar URL de checkout para Preapproval Plan
      const checkoutUrl = getPreapprovalCheckoutUrl(preapprovalPlanId);
      if (!checkoutUrl) {
        throw new Error(`No se pudo generar la URL de checkout para el plan ${plan}`);
      }

      // Registrar transacción pendiente con información completa del usuario
      let transaction;
      try {
        transaction = await Transaction.create({
          userId: userIdString,
          type: 'subscription',
          amount: price,
          currency: MERCADOPAGO_CONFIG.currency.toLowerCase(),
          status: 'pending',
          paymentProvider: 'mercadopago',
          providerTransactionId: preapprovalPlanId, // Usar el plan ID como referencia
          plan: plan,
          description: `Suscripción ${plan} - Checkout iniciado`,
          metadata: {
            preapprovalPlanId: preapprovalPlanId,
            plan: plan,
            checkoutUrl: checkoutUrl,
            successUrl: successUrl || MERCADOPAGO_CONFIG.successUrl,
            cancelUrl: cancelUrl || MERCADOPAGO_CONFIG.cancelUrl,
            // Información del usuario para auditoría
            userEmail: user.email,
            userName: user.name || user.username,
            userId: userIdString,
            createdAt: new Date().toISOString(),
          },
        });

        // Registrar evento de auditoría
        await paymentAuditService.logEvent('CHECKOUT_CREATED', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          userEmail: user.email,
          userName: user.name || user.username,
          plan,
          amount: price,
          preapprovalPlanId,
        }, userIdString, transaction._id.toString());
      } catch (dbError) {
        console.error('Error creando transacción en la base de datos:', dbError);
        await paymentAuditService.logEvent('CHECKOUT_CREATION_FAILED', {
          reason: 'database_error',
          userId: userIdString,
          userEmail: user.email,
          plan,
          error: dbError.message,
        }, userIdString);
        throw new Error(`Error al registrar la transacción: ${dbError.message}`);
      }

      return {
        sessionId: preapprovalPlanId,
        url: checkoutUrl,
        preferenceId: preapprovalPlanId, // Mantener compatibilidad
        preapprovalPlanId: preapprovalPlanId,
      };
    } catch (error) {
      console.error('Error en createCheckoutSession:', error);
      // Re-lanzar el error con el mensaje original
      throw error;
    }
  }

  /**
   * Crear suscripción recurrente (Preapproval)
   * @param {string} userId - ID del usuario
   * @param {string} plan - Plan seleccionado
   * @param {string} cardToken - Token de tarjeta de Mercado Pago
   * @returns {Promise<Object>} - Suscripción creada
   */
  async createSubscription(userId, plan, cardToken) {
    if (!isMercadoPagoConfigured()) {
      throw new Error('Mercado Pago no está configurado correctamente');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const price = getPlanPrice(plan);
    if (!price || price <= 0) {
      throw new Error(`Plan ${plan} no está configurado`);
    }

    // Calcular fecha de inicio y fin del período
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Crear preapproval (suscripción recurrente)
    // Nota: Esto requiere el SDK completo de Mercado Pago
    // Por ahora, usamos preferencias con notificaciones para manejar renovaciones

    // Para suscripciones, Mercado Pago usa un enfoque diferente
    // Se puede usar Preapproval API o manejar renovaciones manualmente con notificaciones

    throw new Error('Creación directa de suscripciones requiere implementación adicional con Preapproval API');
  }

  /**
   * Cancelar suscripción
   * @param {string} userId - ID del usuario
   * @param {boolean} cancelImmediately - Si cancelar inmediatamente
   * @returns {Promise<Object>} - Resultado de la cancelación
   */
  async cancelSubscription(userId, cancelImmediately = false) {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      throw new Error('Suscripción no encontrada');
    }

    // Si tiene ID de suscripción de Mercado Pago, cancelarla
    if (subscription.mercadopagoSubscriptionId) {
      try {
        // Cancelar en Mercado Pago
        // Nota: Esto requiere el endpoint de cancelación de suscripciones
        // Por ahora, solo actualizamos en nuestra base de datos
      } catch (error) {
        console.error('Error cancelando suscripción en Mercado Pago:', error);
      }
    }

    // Actualizar en base de datos
    await subscription.cancel(cancelImmediately);

    // Actualizar usuario
    const user = await User.findById(userId);
    if (user) {
      if (cancelImmediately) {
        user.subscription.status = 'expired';
      } else {
        user.subscription.status = 'premium';
      }
      await user.save();
    }

    return {
      success: true,
      canceledAt: subscription.canceledAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  /**
   * Actualizar método de pago
   * @param {string} userId - ID del usuario
   * @param {string} cardToken - Nuevo token de tarjeta
   * @returns {Promise<Object>} - Resultado de la actualización
   */
  async updatePaymentMethod(userId, cardToken) {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      throw new Error('Suscripción no encontrada');
    }

    // Actualizar método de pago en Mercado Pago
    // Esto requiere actualizar el preapproval o la suscripción

    subscription.paymentMethodId = cardToken;
    await subscription.save();

    return {
      success: true,
      paymentMethodId: cardToken,
    };
  }

  /**
   * Obtener estado de suscripción
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Estado de la suscripción
   */
  async getSubscriptionStatus(userId) {
    const subscription = await Subscription.findOne({ userId });
    const user = await User.findById(userId);

    if (!subscription && !user?.subscription) {
      return {
        hasSubscription: false,
        status: 'free',
      };
    }

    if (subscription) {
      return {
        hasSubscription: true,
        status: subscription.status,
        plan: subscription.plan,
        isActive: subscription.isActive,
        isInTrial: subscription.isInTrial,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining: subscription.daysRemaining,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
      };
    }

    const userSubscription = user.subscription;
    return {
      hasSubscription: userSubscription.status !== 'free',
      status: userSubscription.status,
      plan: userSubscription.plan,
      trialStartDate: userSubscription.trialStartDate,
      trialEndDate: userSubscription.trialEndDate,
      subscriptionStartDate: userSubscription.subscriptionStartDate,
      subscriptionEndDate: userSubscription.subscriptionEndDate,
    };
  }

  /**
   * Procesar notificación IPN de Mercado Pago
   * @param {Object} data - Datos de la notificación
   * @param {string} signature - Firma de la notificación (opcional)
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  async handleWebhook(data, signature = null) {
    // Mercado Pago envía notificaciones IPN
    // El formato depende del tipo de notificación

    try {
      // Mercado Pago puede enviar diferentes formatos
      // Formato 1: { type: 'payment', data: {...} }
      // Formato 2: { action: 'payment.created', data: {...} }
      // Formato 3: Directamente el objeto de notificación

      let type = data.type || data.action?.split('.')[0] || 'unknown';
      let notificationData = data.data || data;

      // Normalizar tipo
      if (type.includes('payment')) type = 'payment';
      if (type.includes('subscription')) type = 'subscription';
      if (type.includes('preapproval')) type = 'preapproval';

      // Registrar webhook recibido
      await paymentAuditService.logEvent('WEBHOOK_RECEIVED', {
        type,
        hasData: !!notificationData,
        signature: signature ? 'present' : 'missing',
      }, null);

      switch (type) {
        case 'payment':
          await this.handlePaymentNotification(notificationData);
          break;
        case 'subscription':
          await this.handleSubscriptionNotification(notificationData);
          break;
        case 'preapproval':
          await this.handlePreapprovalNotification(notificationData);
          break;
        default:
          console.log(`[WEBHOOK] Tipo de notificación no manejado: ${type}`, data);
          await paymentAuditService.logEvent('WEBHOOK_UNKNOWN_TYPE', {
            type,
            data: JSON.stringify(data).substring(0, 500), // Limitar tamaño
          }, null);
      }

      return { received: true, type, processed: true };
    } catch (error) {
      console.error('[WEBHOOK] Error procesando notificación de Mercado Pago:', error);
      await paymentAuditService.logEvent('WEBHOOK_PROCESSING_ERROR', {
        error: error.message,
        stack: error.stack?.substring(0, 500),
      }, null);
      throw error;
    }
  }

  // Handlers de notificaciones
  async handlePaymentNotification(paymentData) {
    try {
      const paymentId = paymentData.id;
      const preferenceId = paymentData.preference_id || paymentData.preapproval_plan_id;

      if (!paymentId) {
        console.warn('[PAYMENT_WEBHOOK] Payment ID no encontrado en notificación');
        return;
      }

      // Buscar transacción por preference ID o payment ID
      let transaction = await Transaction.findOne({
        $or: [
          { providerTransactionId: preferenceId },
          { providerTransactionId: paymentId },
          { 'metadata.paymentId': paymentId },
        ],
      }).populate('userId', 'email username name');

      if (!transaction) {
        console.warn(`[PAYMENT_WEBHOOK] Transacción no encontrada para preference: ${preferenceId} o payment: ${paymentId}`);
        await paymentAuditService.logEvent('PAYMENT_NOTIFICATION_ORPHAN', {
          paymentId,
          preferenceId,
          status: paymentData.status,
        }, null);
        return;
      }

      const userId = transaction.userId._id || transaction.userId;
      const userIdString = userId.toString();

      // Actualizar estado según el estado del pago
      const statusMap = {
        approved: 'completed',
        pending: 'processing',
        rejected: 'failed',
        cancelled: 'canceled',
        refunded: 'refunded',
      };

      const oldStatus = transaction.status;
      transaction.status = statusMap[paymentData.status] || 'pending';
      transaction.providerTransactionId = paymentId; // Actualizar con payment ID
      transaction.processedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        paymentId: paymentId,
        paymentStatus: paymentData.status,
        notificationReceivedAt: new Date().toISOString(),
        previousStatus: oldStatus,
      };

      await transaction.save();

      // Registrar notificación recibida
      await paymentAuditService.logEvent('PAYMENT_NOTIFICATION_RECEIVED', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        userEmail: transaction.userId.email,
        paymentId,
        status: paymentData.status,
        oldStatus,
        newStatus: transaction.status,
      }, userIdString, transaction._id.toString());

      // Si el pago fue aprobado, activar suscripción
      if (paymentData.status === 'approved') {
        try {
          await this.activateSubscriptionFromPayment(transaction);
        } catch (activationError) {
          console.error('[PAYMENT_WEBHOOK] Error activando suscripción:', activationError);
          // El error ya se registra en activateSubscriptionFromPayment
          throw activationError;
        }
      }
    } catch (error) {
      console.error('[PAYMENT_WEBHOOK] Error procesando notificación de pago:', error);
      throw error;
    }
  }

  async handleSubscriptionNotification(subscriptionData) {
    // Manejar notificaciones de suscripción
    const subscriptionId = subscriptionData.id;
    const subscription = await Subscription.findOne({
      mercadopagoSubscriptionId: subscriptionId,
    });

    if (subscription) {
      // Actualizar estado de suscripción
      subscription.status = subscriptionData.status;
      await subscription.save();
    }
  }

  async handlePreapprovalNotification(preapprovalData) {
    try {
      // Las notificaciones de preapproval vienen cuando se crea/actualiza una suscripción
      const preapprovalId = preapprovalData.id;
      const status = preapprovalData.status;
      const payerEmail = preapprovalData.payer_email;
      const planId = preapprovalData.preapproval_plan_id;

      console.log('[PREAPPROVAL_WEBHOOK] Notificación recibida:', {
        preapprovalId,
        status,
        payerEmail,
        planId,
      });

      // Buscar transacción por plan ID
      const transaction = await Transaction.findOne({
        $or: [
          { providerTransactionId: planId },
          { 'metadata.preapprovalPlanId': planId },
        ],
      }).populate('userId', 'email username name');

      if (!transaction) {
        console.warn(`[PREAPPROVAL_WEBHOOK] Transacción no encontrada para plan: ${planId}`);
        await paymentAuditService.logEvent('PREAPPROVAL_NOTIFICATION_ORPHAN', {
          preapprovalId,
          planId,
          status,
          payerEmail,
        }, null);
        return;
      }

      const userId = transaction.userId._id || transaction.userId;
      const userIdString = userId.toString();

      // Validar que el email del payer coincida con el usuario
      if (payerEmail && transaction.userId.email && payerEmail.toLowerCase() !== transaction.userId.email.toLowerCase()) {
        console.warn(`[PREAPPROVAL_WEBHOOK] Email del payer no coincide: ${payerEmail} vs ${transaction.userId.email}`);
        await paymentAuditService.logEvent('PREAPPROVAL_EMAIL_MISMATCH', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          payerEmail,
          userEmail: transaction.userId.email,
        }, userIdString, transaction._id.toString());
      }

      // Actualizar transacción
      transaction.metadata = {
        ...transaction.metadata,
        preapprovalId,
        preapprovalStatus: status,
        payerEmail,
        preapprovalNotificationReceivedAt: new Date().toISOString(),
      };

      // Si el preapproval está autorizado, actualizar estado
      if (status === 'authorized') {
        transaction.status = 'completed';
        transaction.processedAt = new Date();
        await transaction.save();

        // Activar suscripción
        try {
          await this.activateSubscriptionFromPayment(transaction);
        } catch (activationError) {
          console.error('[PREAPPROVAL_WEBHOOK] Error activando suscripción:', activationError);
          throw activationError;
        }
      } else if (status === 'cancelled' || status === 'paused') {
        transaction.status = 'canceled';
        await transaction.save();
      }

      // Registrar evento
      await paymentAuditService.logEvent('PREAPPROVAL_NOTIFICATION_RECEIVED', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        userEmail: transaction.userId.email,
        preapprovalId,
        status,
        planId,
      }, userIdString, transaction._id.toString());
    } catch (error) {
      console.error('[PREAPPROVAL_WEBHOOK] Error procesando notificación:', error);
      throw error;
    }
  }

  async activateSubscriptionFromPayment(transaction) {
    try {
      // Validar transacción
      if (!transaction || !transaction.userId) {
        throw new Error('Transacción inválida: falta userId');
      }

      const userId = transaction.userId._id || transaction.userId;
      const userIdString = userId.toString();
      const plan = transaction.plan;

      if (!plan) {
        throw new Error('Transacción inválida: falta plan');
      }

      // Validar que el usuario existe
      const user = await User.findById(userIdString).select('email username name subscription');
      if (!user) {
        throw new Error(`Usuario no encontrado: ${userIdString}`);
      }

      // Calcular fechas del período según el plan
      const now = new Date();
      const periodEnd = new Date(now);
      
      const planDurations = {
        weekly: () => periodEnd.setDate(periodEnd.getDate() + 7),
        monthly: () => periodEnd.setMonth(periodEnd.getMonth() + 1),
        quarterly: () => periodEnd.setMonth(periodEnd.getMonth() + 3),
        semestral: () => periodEnd.setMonth(periodEnd.getMonth() + 6),
        yearly: () => periodEnd.setFullYear(periodEnd.getFullYear() + 1),
      };

      if (planDurations[plan]) {
        planDurations[plan]();
      } else {
        throw new Error(`Plan inválido: ${plan}`);
      }

      // Buscar o crear suscripción
      let subscription = await Subscription.findOne({ userId: userIdString });

      if (!subscription) {
        subscription = new Subscription({
          userId: userIdString,
          plan: plan,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          mercadopagoTransactionId: transaction.providerTransactionId,
          metadata: {
            activatedFrom: transaction._id.toString(),
            activatedAt: now.toISOString(),
            userEmail: user.email,
            userName: user.name || user.username,
          },
        });
      } else {
        subscription.status = 'active';
        subscription.plan = plan;
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = periodEnd;
        subscription.mercadopagoTransactionId = transaction.providerTransactionId;
        subscription.metadata = {
          ...subscription.metadata,
          lastActivatedFrom: transaction._id.toString(),
          lastActivatedAt: now.toISOString(),
        };
      }

      await subscription.save();

      // Actualizar usuario
      user.subscription.status = 'premium';
      user.subscription.plan = plan;
      user.subscription.subscriptionStartDate = now;
      user.subscription.subscriptionEndDate = periodEnd;
      await user.save();

      // Registrar evento de auditoría
      await paymentAuditService.logEvent('SUBSCRIPTION_ACTIVATED', {
        transactionId: transaction._id.toString(),
        subscriptionId: subscription._id.toString(),
        userId: userIdString,
        userEmail: user.email,
        userName: user.name || user.username,
        plan,
        periodStart: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
      }, userIdString, transaction._id.toString());

      console.log(`✅ Suscripción activada para usuario ${userIdString} (${user.email}) - Plan: ${plan}`);

      return {
        success: true,
        subscriptionId: subscription._id.toString(),
        userId: userIdString,
        plan,
        periodStart: now,
        periodEnd: periodEnd,
      };
    } catch (error) {
      console.error('❌ Error activando suscripción desde pago:', error);
      
      // Registrar error en auditoría
      if (transaction && transaction.userId) {
        const userId = transaction.userId._id || transaction.userId;
        await paymentAuditService.logEvent('SUBSCRIPTION_ACTIVATION_FAILED', {
          transactionId: transaction._id?.toString(),
          userId: userId.toString(),
          plan: transaction.plan,
          error: error.message,
        }, userId.toString(), transaction._id?.toString());
      }
      
      throw error;
    }
  }
}

export default new PaymentServiceMercadoPago();

