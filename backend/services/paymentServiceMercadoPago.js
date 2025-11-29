/**
 * Servicio de Pagos con Mercado Pago
 * 
 * Gestiona todas las operaciones relacionadas con pagos usando Mercado Pago,
 * incluyendo creación de preferencias de pago, suscripciones,
 * y procesamiento de webhooks (notificaciones IPN).
 * 
 * @author AntoApp Team
 */

import { preferenceClient, subscriptionClient, MERCADOPAGO_CONFIG, getPlanPrice, isMercadoPagoConfigured } from '../config/mercadopago.js';
import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

class PaymentServiceMercadoPago {
  /**
   * Crear preferencia de pago para suscripción
   * @param {string} userId - ID del usuario
   * @param {string} plan - Plan seleccionado ('monthly' o 'yearly')
   * @param {string} successUrl - URL de éxito
   * @param {string} cancelUrl - URL de cancelación
   * @returns {Promise<Object>} - Preferencia de pago de Mercado Pago
   */
  async createCheckoutSession(userId, plan, successUrl = null, cancelUrl = null) {
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

    // Crear preferencia de pago
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            title: `Suscripción Premium ${plan === 'monthly' ? 'Mensual' : 'Anual'} - AntoApp`,
            description: `Plan Premium ${plan === 'monthly' ? 'Mensual' : 'Anual'} con acceso completo a todas las funcionalidades`,
            quantity: 1,
            unit_price: price,
            currency_id: MERCADOPAGO_CONFIG.currency,
          },
        ],
        payer: {
          name: user.name || user.username,
          email: user.email,
        },
        back_urls: {
          success: successUrl || MERCADOPAGO_CONFIG.successUrl,
          failure: cancelUrl || MERCADOPAGO_CONFIG.cancelUrl,
          pending: MERCADOPAGO_CONFIG.pendingUrl,
        },
        auto_return: 'approved',
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || `${process.env.API_URL}/api/payments/webhook`,
        statement_descriptor: 'ANTOAPP PREMIUM',
        metadata: {
          userId: userId.toString(),
          plan: plan,
          username: user.username,
        },
        // Configuración para suscripciones recurrentes
        // Nota: Mercado Pago maneja suscripciones de forma diferente
        // Para suscripciones recurrentes, se usa Preapproval
      },
    });

    // Registrar transacción pendiente
    await Transaction.create({
      userId: userId,
      type: 'subscription',
      amount: price,
      currency: MERCADOPAGO_CONFIG.currency.toLowerCase(),
      status: 'pending',
      paymentProvider: 'mercadopago',
      providerTransactionId: preference.id,
      plan: plan,
      description: `Suscripción ${plan} - Preferencia creada`,
      metadata: {
        preferenceId: preference.id,
        plan: plan,
        initPoint: preference.init_point,
      },
    });

    return {
      sessionId: preference.id,
      url: preference.init_point, // URL de pago
      preferenceId: preference.id,
    };
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

    const { type, data: notificationData } = data;

    try {
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
          console.log(`Tipo de notificación no manejado: ${type}`);
      }

      return { received: true, type };
    } catch (error) {
      console.error('Error procesando notificación de Mercado Pago:', error);
      throw error;
    }
  }

  // Handlers de notificaciones
  async handlePaymentNotification(paymentData) {
    const paymentId = paymentData.id;
    const preferenceId = paymentData.preference_id;

    // Buscar transacción por preference ID
    const transaction = await Transaction.findOne({
      providerTransactionId: preferenceId,
    });

    if (!transaction) {
      console.warn(`Transacción no encontrada para preference: ${preferenceId}`);
      return;
    }

    // Actualizar estado según el estado del pago
    const statusMap = {
      approved: 'completed',
      pending: 'processing',
      rejected: 'failed',
      cancelled: 'canceled',
      refunded: 'refunded',
    };

    transaction.status = statusMap[paymentData.status] || 'pending';
    transaction.providerTransactionId = paymentId; // Actualizar con payment ID
    transaction.processedAt = new Date();
    transaction.metadata = {
      ...transaction.metadata,
      paymentId: paymentId,
      paymentStatus: paymentData.status,
    };

    await transaction.save();

    // Si el pago fue aprobado, activar suscripción
    if (paymentData.status === 'approved') {
      await this.activateSubscriptionFromPayment(transaction);
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
    // Manejar notificaciones de preapproval
    console.log('Preapproval notification:', preapprovalData);
  }

  async activateSubscriptionFromPayment(transaction) {
    const userId = transaction.userId;
    const plan = transaction.plan;

    // Buscar o crear suscripción
    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: plan,
        status: 'active',
      });
    }

    // Calcular fechas del período
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    subscription.status = 'active';
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = periodEnd;
    subscription.mercadopagoTransactionId = transaction.providerTransactionId;

    await subscription.save();

    // Actualizar usuario
    const user = await User.findById(userId);
    if (user) {
      user.subscription.status = 'premium';
      user.subscription.plan = plan;
      user.subscription.subscriptionStartDate = now;
      user.subscription.subscriptionEndDate = periodEnd;
      await user.save();
    }
  }
}

export default new PaymentServiceMercadoPago();

