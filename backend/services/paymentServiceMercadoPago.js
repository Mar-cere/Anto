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
import logger from '../utils/logger.js';
import { fetchMercadoPagoPaymentById, fetchMercadoPagoPreapprovalById } from '../utils/mercadopagoPaymentApi.js';

/** En producción, por defecto exige coincidencia de email pagador vs usuario. */
function mercadoPagoStrictPayerEmail() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.MERCADOPAGO_STRICT_PAYER_EMAIL !== 'false';
  }
  return process.env.MERCADOPAGO_STRICT_PAYER_EMAIL === 'true';
}

class PaymentServiceMercadoPago {
  async cancelMercadoPagoPreapproval(preapprovalId) {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }
    if (!preapprovalId) {
      throw new Error('ID de suscripción de Mercado Pago inválido');
    }

    const url = `https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_) {
      payload = null;
    }

    if (!response.ok) {
      const providerError =
        payload?.message ||
        payload?.error ||
        `HTTP ${response.status}`;
      throw new Error(`Mercado Pago rechazó la cancelación: ${providerError}`);
    }

    return payload;
  }

  async resolveTransactionForPaymentWebhook({ paymentId, preferenceId, payerEmail }) {
    const payIdStr = paymentId != null ? String(paymentId) : null;
    const prefIdStr = preferenceId != null ? String(preferenceId) : null;
    const normalizedPayerEmail = payerEmail?.toLowerCase().trim() || null;

    // 1) Coincidencias fuertes por IDs de pago ya persistidos (únicos por pago).
    if (payIdStr) {
      const byPaymentId = await Transaction.findOne({
        $or: [
          { providerTransactionId: payIdStr },
          { 'metadata.paymentId': payIdStr },
          { 'metadata.mercadopagoPaymentId': payIdStr },
        ],
      })
        .sort({ createdAt: -1 })
        .populate('userId', 'email username name');

      if (byPaymentId) {
        return byPaymentId;
      }
    }

    // 2) Fallback por reference/preapprovalPlanId (no único): acotar por estado y email del payer.
    if (prefIdStr) {
      const candidates = await Transaction.find({
        $or: [
          { providerTransactionId: prefIdStr },
          { 'metadata.preapprovalPlanId': prefIdStr },
          { 'metadata.preapprovalProviderReferenceId': prefIdStr },
        ],
        paymentProvider: 'mercadopago',
        type: 'subscription',
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'email username name');

      if (candidates.length === 1) {
        return candidates[0];
      }

      if (candidates.length > 1) {
        const emailMatches = normalizedPayerEmail
          ? candidates.filter((tx) => tx.userId?.email?.toLowerCase().trim() === normalizedPayerEmail)
          : [];
        if (emailMatches.length > 0) {
          return emailMatches[0];
        }

        const pendingMatches = candidates.filter((tx) => tx.status === 'pending' || tx.status === 'processing');
        if (pendingMatches.length > 0) {
          return pendingMatches[0];
        }

        return candidates[0];
      }
    }

    return null;
  }

  async resolveTransactionForPreapprovalWebhook({ planId, preapprovalId, payerEmail }) {
    const planIdStr = planId != null ? String(planId) : null;
    const preapprovalIdStr = preapprovalId != null ? String(preapprovalId) : null;
    const normalizedPayerEmail = payerEmail?.toLowerCase().trim() || null;

    // 1) Coincidencia por preapprovalId guardado en metadata (si ya existe).
    if (preapprovalIdStr) {
      const byPreapprovalId = await Transaction.findOne({ 'metadata.preapprovalId': preapprovalIdStr })
        .sort({ createdAt: -1 })
        .populate('userId', 'email username name');
      if (byPreapprovalId) {
        return byPreapprovalId;
      }
    }

    if (!planIdStr) return null;

    // 2) Fallback por planId: acotar por email/status.
    const candidates = await Transaction.find({
      $or: [
        { providerTransactionId: planIdStr },
        { 'metadata.preapprovalPlanId': planIdStr },
      ],
      paymentProvider: 'mercadopago',
      type: 'subscription',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email username name');

    if (candidates.length === 1) {
      return candidates[0];
    }

    if (candidates.length > 1) {
      const emailMatches = normalizedPayerEmail
        ? candidates.filter((tx) => tx.userId?.email?.toLowerCase().trim() === normalizedPayerEmail)
        : [];
      if (emailMatches.length > 0) {
        return emailMatches[0];
      }

      const pendingMatches = candidates.filter((tx) => tx.status === 'pending' || tx.status === 'processing');
      if (pendingMatches.length > 0) {
        return pendingMatches[0];
      }

      return candidates[0];
    }

    return null;
  }

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
      const validPlans = ['monthly', 'quarterly', 'semestral', 'yearly'];
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
      const finalSuccessUrl = successUrl || MERCADOPAGO_CONFIG.successUrl;
      const finalCancelUrl = cancelUrl || MERCADOPAGO_CONFIG.cancelUrl;
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
            successUrl: finalSuccessUrl,
            cancelUrl: finalCancelUrl,
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
        logger.error('Error creando transacción en la base de datos', {
          userId: userIdString,
          userEmail: user.email,
          plan,
          error: dbError.message,
          stack: dbError.stack,
        });
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
      logger.error('Error en createCheckoutSession', {
        userId: userId?.toString(),
        plan,
        error: error.message,
        stack: error.stack,
      });
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

    // Si tiene ID de suscripción de Mercado Pago, cancelarla en el proveedor
    // para evitar renovaciones futuras no deseadas.
    if (subscription.mercadopagoSubscriptionId) {
      const providerResult = await this.cancelMercadoPagoPreapproval(subscription.mercadopagoSubscriptionId);
      subscription.metadata = {
        ...subscription.metadata,
        mercadopagoCancellation: {
          requestedAt: new Date().toISOString(),
          providerStatus: providerResult?.status || 'cancelled',
          providerId: providerResult?.id || subscription.mercadopagoSubscriptionId,
        },
      };
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
      mercadopagoSubscriptionId: subscription.mercadopagoSubscriptionId || null,
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
    const now = new Date();
    const subscription = await Subscription.findOne({ userId }).lean();
    const user = await User.findById(userId)
      .select('subscription')
      .lean();
    const userSub = user?.subscription;

    if (!subscription && !userSub) {
      return {
        hasSubscription: false,
        status: 'free',
      };
    }

    // Premium vigente en User (Apple / Mercado Pago): prioridad sobre Subscription desactualizada
    // (evita mostrar "trial" si el documento Subscription sigue en trialing tras un pago en iOS).
    if (
      userSub &&
      userSub.status === 'premium' &&
      userSub.subscriptionEndDate &&
      new Date(userSub.subscriptionEndDate) >= now
    ) {
      const end = new Date(userSub.subscriptionEndDate);
      const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        hasSubscription: true,
        status: 'premium',
        plan: userSub.plan,
        isActive: true,
        isInTrial: false,
        currentPeriodStart: userSub.subscriptionStartDate,
        currentPeriodEnd: userSub.subscriptionEndDate,
        subscriptionStartDate: userSub.subscriptionStartDate,
        subscriptionEndDate: userSub.subscriptionEndDate,
        trialStartDate: null,
        trialEndDate: null,
        daysRemaining,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      };
    }

    if (subscription) {
      const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
      const daysRemaining = periodEnd
        ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const isInTrial =
        subscription.status === 'trialing' &&
        subscription.trialStart &&
        subscription.trialEnd &&
        now >= new Date(subscription.trialStart) &&
        now <= new Date(subscription.trialEnd);
      const isActive =
        !!periodEnd &&
        periodEnd >= now &&
        (subscription.status === 'active' || subscription.status === 'trialing');

      return {
        hasSubscription: true,
        status: subscription.status,
        plan: subscription.plan,
        isActive,
        isInTrial,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialStartDate: subscription.trialStart ?? null,
        trialEndDate: subscription.trialEnd ?? null,
        subscriptionStartDate: subscription.currentPeriodStart,
        subscriptionEndDate: subscription.currentPeriodEnd,
        daysRemaining,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
      };
    }

    const userSubscription = userSub;
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
          logger.warn('[WEBHOOK] Tipo de notificación no manejado', {
            type,
            dataKeys: data ? Object.keys(data) : [],
            dataPreview: data ? JSON.stringify(data).substring(0, 500) : null,
          });
          await paymentAuditService.logEvent('WEBHOOK_UNKNOWN_TYPE', {
            type,
            data: JSON.stringify(data).substring(0, 500), // Limitar tamaño
          }, null);
      }

      return { received: true, type, processed: true };
    } catch (error) {
      logger.error('[WEBHOOK] Error procesando notificación de Mercado Pago', {
        error: error.message,
        stack: error.stack,
        type: data?.type || 'unknown',
      });
      await paymentAuditService.logEvent('WEBHOOK_PROCESSING_ERROR', {
        error: error.message,
        stack: error.stack?.substring(0, 500),
      }, null);
      throw error;
    }
  }

  // Handlers de notificaciones
  async handlePaymentNotification(paymentData) {
    const startTime = Date.now();
    try {
      const paymentId = paymentData.id;
      let effectivePaymentData = paymentData;
      if (paymentId && (!paymentData.status || !paymentData.preference_id)) {
        const remotePayment = await fetchMercadoPagoPaymentById(String(paymentId));
        if (remotePayment) {
          effectivePaymentData = {
            ...paymentData,
            status: paymentData.status || remotePayment.status,
            transaction_amount: paymentData.transaction_amount || remotePayment.transaction_amount,
            currency_id: paymentData.currency_id || remotePayment.currency_id,
          };
        }
      }
      const preferenceId = effectivePaymentData.preference_id || effectivePaymentData.preapproval_plan_id;

      logger.payment('PAYMENT_WEBHOOK: Notificación de pago recibida', {
        paymentId,
        preferenceId,
        status: effectivePaymentData.status,
        paymentDataKeys: Object.keys(paymentData),
      });

      if (!paymentId) {
        logger.warn('[PAYMENT_WEBHOOK] Payment ID no encontrado en notificación', {
          paymentData: JSON.stringify(paymentData).substring(0, 500),
        });
        return;
      }

      // Resolver transacción de manera determinística.
      let transaction = await this.resolveTransactionForPaymentWebhook({
        paymentId,
        preferenceId,
        payerEmail: paymentData?.payer?.email,
      });

      if (!transaction) {
        logger.payment('PAYMENT_WEBHOOK: Transacción no encontrada (orphan)', {
          paymentId,
          preferenceId,
          status: paymentData.status,
        });
        await paymentAuditService.logEvent('PAYMENT_NOTIFICATION_ORPHAN', {
          paymentId,
          preferenceId,
          status: paymentData.status,
        }, null);
        return;
      }

      logger.payment('PAYMENT_WEBHOOK: Transacción encontrada', {
        transactionId: transaction._id.toString(),
        userId: transaction.userId?._id?.toString() || transaction.userId?.toString(),
        currentStatus: transaction.status,
        plan: transaction.plan,
        paymentStatus: effectivePaymentData.status,
      });

      const userId = transaction.userId._id || transaction.userId;
      const userIdString = userId.toString();
      const payIdStr = String(paymentId);

      if (effectivePaymentData.status === 'approved' && transaction.metadata?.subscriptionActivatedForPaymentId === payIdStr) {
        logger.payment('PAYMENT_WEBHOOK: idempotente — ya activado para este paymentId', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          paymentId: payIdStr,
        });
        transaction.metadata = {
          ...transaction.metadata,
          lastWebhookReceivedAt: new Date().toISOString(),
          lastWebhookPaymentStatus: effectivePaymentData.status,
        };
        await transaction.save();
        return;
      }

      logger.debug('[PAYMENT_WEBHOOK] Validando datos del pago', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        userEmail: transaction.userId?.email,
        payerEmail: paymentData.payer?.email,
      });

      let activationBlocked = false;
      let activationBlockedReason = null;

      if (effectivePaymentData.payer?.email && transaction.userId.email) {
        const payerEmail = effectivePaymentData.payer.email.toLowerCase().trim();
        const userEmail = transaction.userId.email.toLowerCase().trim();
        if (payerEmail !== userEmail) {
          logger.warn('[PAYMENT_WEBHOOK] Email del payer no coincide', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            payerEmail: effectivePaymentData.payer.email,
            userEmail: transaction.userId.email,
            paymentId,
            status: effectivePaymentData.status,
          });
          await paymentAuditService.logEvent('PAYMENT_EMAIL_MISMATCH', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            payerEmail: effectivePaymentData.payer.email,
            userEmail: transaction.userId.email,
            paymentId,
            status: effectivePaymentData.status,
          }, userIdString, transaction._id.toString());
          if (mercadoPagoStrictPayerEmail() && effectivePaymentData.status === 'approved') {
            activationBlocked = true;
            activationBlockedReason = 'email_mismatch';
          }
        }
      }

      if (effectivePaymentData.status === 'approved' && !activationBlocked) {
        const remote = await fetchMercadoPagoPaymentById(payIdStr);
        if (remote && Number.isFinite(remote.transaction_amount) && Number.isFinite(transaction.amount)) {
          const diff = Math.abs(remote.transaction_amount - transaction.amount);
          if (diff > 1) {
            activationBlocked = true;
            activationBlockedReason = 'amount_mismatch';
            logger.error('[PAYMENT_WEBHOOK] Monto del pago no coincide con la transacción', {
              transactionId: transaction._id.toString(),
              userId: userIdString,
              expectedAmount: transaction.amount,
              mpAmount: remote.transaction_amount,
              paymentId: payIdStr,
            });
            await paymentAuditService.logEvent('PAYMENT_AMOUNT_MISMATCH', {
              transactionId: transaction._id.toString(),
              userId: userIdString,
              expectedAmount: transaction.amount,
              mpAmount: remote.transaction_amount,
              paymentId: payIdStr,
            }, userIdString, transaction._id.toString());
          }
        } else if (!remote) {
          logger.warn('[PAYMENT_WEBHOOK] No se pudo verificar monto en API MP (se continúa sin bloquear)', {
            transactionId: transaction._id.toString(),
            paymentId: payIdStr,
          });
        }
      }

      const originalProviderRef = transaction.providerTransactionId;

      // Actualizar estado según el estado del pago
      const statusMap = {
        approved: 'completed',
        pending: 'processing',
        rejected: 'failed',
        cancelled: 'canceled',
        refunded: 'refunded',
      };

      const oldStatus = transaction.status;
      const newStatus = statusMap[effectivePaymentData.status] || 'pending';
      transaction.status = newStatus;
      transaction.providerTransactionId = paymentId;
      transaction.processedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        preapprovalPlanId: transaction.metadata.preapprovalPlanId || preferenceId,
        preapprovalProviderReferenceId:
          transaction.metadata.preapprovalProviderReferenceId || originalProviderRef,
        mercadopagoPaymentId: payIdStr,
        paymentId: payIdStr,
        paymentStatus: effectivePaymentData.status,
        notificationReceivedAt: new Date().toISOString(),
        previousStatus: oldStatus,
        ...(activationBlockedReason
          ? { activationBlockedReason, subscriptionActivationBlockedAt: new Date().toISOString() }
          : {}),
      };

      logger.payment('PAYMENT_WEBHOOK: Actualizando estado de transacción', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        oldStatus,
        newStatus,
        paymentStatus: effectivePaymentData.status,
        plan: transaction.plan,
      });

      await transaction.save();
      
      logger.database('Transacción actualizada con nuevo estado', {
        transactionId: transaction._id.toString(),
        status: transaction.status,
      });

      // Registrar notificación recibida
      await paymentAuditService.logEvent('PAYMENT_NOTIFICATION_RECEIVED', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        userEmail: transaction.userId.email,
        paymentId,
        status: effectivePaymentData.status,
        oldStatus,
        newStatus: transaction.status,
      }, userIdString, transaction._id.toString());

      // Si el pago fue aprobado, activar suscripción (salvo bloqueos de validación)
      if (effectivePaymentData.status === 'approved') {
        if (activationBlocked) {
          logger.warn('[PAYMENT_WEBHOOK] Activación bloqueada por validación', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            reason: activationBlockedReason,
            paymentId: payIdStr,
          });
          await paymentAuditService.logEvent('SUBSCRIPTION_ACTIVATION_BLOCKED', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            reason: activationBlockedReason,
            paymentId: payIdStr,
          }, userIdString, transaction._id.toString());
        } else {
        logger.payment('PAYMENT_WEBHOOK: ✅ Pago APROBADO, iniciando activación de suscripción', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          plan: transaction.plan,
          paymentId,
        });

        try {
          const activationStartTime = Date.now();
          const activationResult = await this.activateSubscriptionFromPayment(transaction, {
            source: 'payment',
            externalId: payIdStr,
          });
          const activationDuration = Date.now() - activationStartTime;
          
          logger.payment('PAYMENT_WEBHOOK: Resultado de activación de suscripción', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            success: activationResult?.success,
            alreadyActive: activationResult?.alreadyActive,
            idempotent: activationResult?.idempotent,
            subscriptionId: activationResult?.subscriptionId,
            duration: activationDuration,
          });
          
          // Verificar integridad después de activar
          if (
            activationResult &&
            activationResult.success &&
            !activationResult.alreadyActive &&
            !activationResult.idempotent
          ) {
            logger.debug('[PAYMENT_WEBHOOK] Verificando integridad de suscripción', {
              transactionId: transaction._id.toString(),
              userId: userIdString,
            });

            const integrityCheck = await paymentAuditService.verifyTransactionIntegrity(transaction._id);
            if (!integrityCheck.valid) {
              logger.error('[PAYMENT_WEBHOOK] Error de integridad después de activar suscripción', {
                transactionId: transaction._id.toString(),
                userId: userIdString,
                integrityCheck,
              });
              
              await paymentAuditService.logEvent('SUBSCRIPTION_INTEGRITY_CHECK_FAILED', {
                transactionId: transaction._id.toString(),
                userId: userIdString,
                error: integrityCheck.error,
                requiresActivation: integrityCheck.requiresActivation,
              }, userIdString, transaction._id.toString());
              
              // Si requiere activación, intentar recuperar
              if (integrityCheck.requiresActivation) {
                logger.warn('[PAYMENT_WEBHOOK] Intentando recuperación automática de suscripción', {
                  transactionId: transaction._id.toString(),
                  userId: userIdString,
                });

                const paymentRecoveryService = (await import('./paymentRecoveryService.js')).default;
                await paymentRecoveryService.activateFromTransaction(transaction._id.toString()).catch(err => {
                  logger.error('[PAYMENT_WEBHOOK] Error en recuperación automática', {
                    transactionId: transaction._id.toString(),
                    userId: userIdString,
                    error: err.message,
                    stack: err.stack,
                  });
                });
              }
            } else {
              logger.payment('PAYMENT_WEBHOOK: ✅ Verificación de integridad exitosa', {
                transactionId: transaction._id.toString(),
                userId: userIdString,
              });
            }
          }
        } catch (activationError) {
          const duration = Date.now() - startTime;
          logger.error('[PAYMENT_WEBHOOK] Error activando suscripción', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            plan: transaction.plan,
            error: activationError.message,
            stack: activationError.stack,
            duration,
          });
          // El error ya se registra en activateSubscriptionFromPayment
          throw activationError;
        }
        }
      } else {
        logger.payment('PAYMENT_WEBHOOK: Pago no aprobado, no se activa suscripción', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          paymentStatus: effectivePaymentData.status,
          plan: transaction.plan,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[PAYMENT_WEBHOOK] Error procesando notificación de pago', {
        error: error.message,
        stack: error.stack,
        duration,
        paymentData: paymentData ? { id: paymentData.id, status: paymentData.status } : null,
      });
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
      let effectivePreapprovalData = preapprovalData;
      if (preapprovalId && (!preapprovalData.status || !preapprovalData.preapproval_plan_id)) {
        const remotePreapproval = await fetchMercadoPagoPreapprovalById(String(preapprovalId));
        if (remotePreapproval) {
          effectivePreapprovalData = {
            ...preapprovalData,
            ...remotePreapproval,
          };
        }
      }
      const status = effectivePreapprovalData.status;
      const payerEmail = effectivePreapprovalData.payer_email;
      const planId = effectivePreapprovalData.preapproval_plan_id;

      logger.payment('[PREAPPROVAL_WEBHOOK] Notificación recibida', {
        preapprovalId,
        status,
        payerEmail,
        planId,
      });

      // Resolver transacción considerando que planId no es único entre usuarios.
      const transaction = await this.resolveTransactionForPreapprovalWebhook({
        planId,
        preapprovalId,
        payerEmail,
      });

      if (!transaction) {
        logger.warn('[PREAPPROVAL_WEBHOOK] Transacción no encontrada', {
          planId,
          preapprovalId,
          payerEmail,
        });
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
      const preapprovalIdStr = preapprovalId != null ? String(preapprovalId) : null;

      let preapprovalEmailBlocked = false;
      if (payerEmail && transaction.userId.email && payerEmail.toLowerCase() !== transaction.userId.email.toLowerCase()) {
        logger.warn('[PREAPPROVAL_WEBHOOK] Email del payer no coincide', {
          transactionId: transaction._id.toString(),
          payerEmail,
          userEmail: transaction.userId.email,
        });
        await paymentAuditService.logEvent('PREAPPROVAL_EMAIL_MISMATCH', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          payerEmail,
          userEmail: transaction.userId.email,
        }, userIdString, transaction._id.toString());
        if (mercadoPagoStrictPayerEmail() && status === 'authorized') {
          preapprovalEmailBlocked = true;
        }
      }

      transaction.metadata = {
        ...transaction.metadata,
        preapprovalId,
        preapprovalStatus: status,
        payerEmail,
        preapprovalNotificationReceivedAt: new Date().toISOString(),
      };

      if (status === 'authorized') {
        if (preapprovalIdStr && transaction.metadata?.subscriptionActivatedForPreapprovalId === preapprovalIdStr) {
          logger.payment('[PREAPPROVAL_WEBHOOK] idempotente — ya activado para este preapprovalId', {
            transactionId: transaction._id.toString(),
            preapprovalId: preapprovalIdStr,
          });
          await transaction.save();
        } else if (preapprovalEmailBlocked) {
          transaction.metadata = {
            ...transaction.metadata,
            activationBlockedReason: 'email_mismatch_preapproval',
            subscriptionActivationBlockedAt: new Date().toISOString(),
          };
          await transaction.save();
          await paymentAuditService.logEvent('SUBSCRIPTION_ACTIVATION_BLOCKED', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            reason: 'email_mismatch_preapproval',
            preapprovalId: preapprovalIdStr,
          }, userIdString, transaction._id.toString());
        } else {
          transaction.status = 'completed';
          transaction.processedAt = new Date();
          await transaction.save();

          try {
            await this.activateSubscriptionFromPayment(transaction, {
              source: 'preapproval',
              externalId: preapprovalIdStr,
            });
          } catch (activationError) {
            logger.error('[PREAPPROVAL_WEBHOOK] Error activando suscripción', {
              transactionId: transaction._id.toString(),
              userId: transaction.userId._id.toString(),
              error: activationError.message,
              stack: activationError.stack,
            });
            throw activationError;
          }
        }
      } else if (status === 'cancelled' || status === 'paused') {
        transaction.status = 'canceled';
        await transaction.save();
      } else {
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
      logger.error('[PREAPPROVAL_WEBHOOK] Error procesando notificación', {
        error: error.message,
        stack: error.stack,
        preapprovalData: preapprovalData ? { id: preapprovalData.id, status: preapprovalData.status } : null,
      });
      throw error;
    }
  }

  /**
   * Tras el checkout en navegador: MP redirige a return/success?preapproval_id=...
   * Reutiliza la misma lógica que el webhook de preapproval y fuerza invalidación de caché
   * (evita que subscription-status siga devolviendo trial desde Redis/memoria).
   */
  async syncAfterBrowserReturn(preapprovalId) {
    if (!preapprovalId || !isMercadoPagoConfigured()) {
      return { ok: false, reason: 'skip' };
    }
    const id = String(preapprovalId);
    logger.payment('[BROWSER_RETURN] Sincronizando preapproval', { preapprovalId: id });
    try {
      await this.handlePreapprovalNotification({ id });
    } catch (e) {
      logger.error('[BROWSER_RETURN] Error en handlePreapprovalNotification', {
        preapprovalId: id,
        error: e.message,
        stack: e.stack,
      });
    }

    let userIdStr = null;
    try {
      const tx = await Transaction.findOne({
        $or: [{ 'metadata.preapprovalId': id }, { providerTransactionId: id }],
        paymentProvider: 'mercadopago',
      })
        .sort({ updatedAt: -1 })
        .select('userId');
      const uid = tx?.userId;
      if (uid) {
        userIdStr = uid._id ? uid._id.toString() : uid.toString();
      }
    } catch (lookupErr) {
      logger.warn('[BROWSER_RETURN] Error buscando transacción', {
        preapprovalId: id,
        error: lookupErr.message,
      });
    }

    if (userIdStr) {
      try {
        const cacheService = (await import('./cacheService.js')).default;
        await cacheService.invalidateUserCache(userIdStr);
        logger.payment('[BROWSER_RETURN] Caché de usuario invalidada', {
          userId: userIdStr,
          preapprovalId: id,
        });
      } catch (cacheErr) {
        logger.warn('[BROWSER_RETURN] Error invalidando caché', {
          userId: userIdStr,
          error: cacheErr?.message,
        });
      }
    } else {
      logger.warn('[BROWSER_RETURN] Sin transacción para invalidar caché', { preapprovalId: id });
    }

    return { ok: true, userId: userIdStr };
  }

  async activateSubscriptionFromPayment(transaction, context = {}) {
    const {
      source = 'unknown',
      externalId = null,
      skipIdempotency = false
    } = context;
    const startTime = Date.now();
    try {
      logger.payment('activateSubscriptionFromPayment: Iniciando activación', {
        transactionId: transaction._id?.toString(),
        hasUserId: !!transaction.userId,
        plan: transaction.plan,
        transactionStatus: transaction.status,
        source,
        externalId,
        skipIdempotency,
      });

      const metaEarly = transaction.metadata || {};
      if (!skipIdempotency) {
        if (source === 'payment' && externalId && metaEarly.subscriptionActivatedForPaymentId === String(externalId)) {
          logger.payment('activateSubscriptionFromPayment: idempotente (payment)', {
            transactionId: transaction._id?.toString(),
            externalId,
          });
          return { success: true, alreadyActive: true, idempotent: true };
        }
        if (source === 'preapproval' && externalId && metaEarly.subscriptionActivatedForPreapprovalId === String(externalId)) {
          logger.payment('activateSubscriptionFromPayment: idempotente (preapproval)', {
            transactionId: transaction._id?.toString(),
            externalId,
          });
          return { success: true, alreadyActive: true, idempotent: true };
        }
      }

      // Validar transacción
      if (!transaction || !transaction.userId) {
        logger.error('activateSubscriptionFromPayment: Transacción inválida', {
          transactionId: transaction._id?.toString(),
          hasTransaction: !!transaction,
          hasUserId: !!transaction?.userId,
        });
        throw new Error('Transacción inválida: falta userId');
      }

      const userId = transaction.userId._id || transaction.userId;
      const userIdString = userId.toString();
      const plan = transaction.plan;
      const mercadopagoSubscriptionId =
        source === 'preapproval' && externalId ? String(externalId) : null;

      if (!plan) {
        logger.error('activateSubscriptionFromPayment: Plan no encontrado en transacción', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          transactionKeys: Object.keys(transaction),
        });
        throw new Error('Transacción inválida: falta plan');
      }

      logger.debug('[activateSubscriptionFromPayment] Datos validados', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        plan,
      });

      // Validar que el usuario existe
      const user = await User.findById(userIdString).select('email username name subscription');
      if (!user) {
        logger.error('activateSubscriptionFromPayment: Usuario no encontrado', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          plan,
        });
        throw new Error(`Usuario no encontrado: ${userIdString}`);
      }

      logger.debug('[activateSubscriptionFromPayment] Usuario encontrado', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        userEmail: user.email,
        currentSubscriptionStatus: user.subscription?.status,
        currentSubscriptionPlan: user.subscription?.plan,
      });

      // Calcular fechas del período según el plan
      const now = new Date();
      const periodEnd = new Date(now);
      
      const planDurations = {
        monthly: () => periodEnd.setMonth(periodEnd.getMonth() + 1),
        quarterly: () => periodEnd.setMonth(periodEnd.getMonth() + 3),
        semestral: () => periodEnd.setMonth(periodEnd.getMonth() + 6),
        yearly: () => periodEnd.setFullYear(periodEnd.getFullYear() + 1),
      };

      if (planDurations[plan]) {
        planDurations[plan]();
        logger.debug('[activateSubscriptionFromPayment] Fechas calculadas', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          plan,
          periodStart: now.toISOString(),
          periodEnd: periodEnd.toISOString(),
          daysDuration: Math.floor((periodEnd - now) / (1000 * 60 * 60 * 24)),
        });
      } else {
        logger.error('activateSubscriptionFromPayment: Plan inválido', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          plan,
          validPlans: Object.keys(planDurations),
        });
        throw new Error(`Plan inválido: ${plan}`);
      }

      // Buscar suscripción existente
      let subscription = await Subscription.findOne({ userId: userIdString });

      logger.debug('[activateSubscriptionFromPayment] Suscripción existente', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        hasExistingSubscription: !!subscription,
        existingSubscriptionStatus: subscription?.status,
        existingSubscriptionPlan: subscription?.plan,
        existingPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
      });

      // Validar que no haya una suscripción activa duplicada
      if (subscription && subscription.status === 'active' && subscription.currentPeriodEnd >= now) {
        // Ya hay una suscripción activa, verificar si es la misma transacción
        const existingTransactionId = subscription.metadata?.lastActivatedFrom || subscription.metadata?.activatedFrom;
        if (existingTransactionId && existingTransactionId !== transaction._id.toString()) {
          logger.warn('[activateSubscriptionFromPayment] Intento de activación duplicada', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            existingTransactionId,
            subscriptionId: subscription._id.toString(),
            plan,
          });

          await paymentAuditService.logEvent('SUBSCRIPTION_DUPLICATE_ACTIVATION_ATTEMPT', {
            transactionId: transaction._id.toString(),
            existingTransactionId,
            subscriptionId: subscription._id.toString(),
            userId: userIdString,
            plan,
          }, userIdString, transaction._id.toString());
          
          // Actualizar la transacción existente con referencia a la nueva
          subscription.metadata = {
            ...subscription.metadata,
            duplicateTransactionAttempts: [
              ...(subscription.metadata.duplicateTransactionAttempts || []),
              {
                transactionId: transaction._id.toString(),
                attemptedAt: now.toISOString(),
              }
            ],
          };
          await subscription.save();
          
          // Retornar éxito pero indicar que ya estaba activa
          return {
            success: true,
            alreadyActive: true,
            subscriptionId: subscription._id.toString(),
            userId: userIdString,
            plan,
            periodStart: subscription.currentPeriodStart,
            periodEnd: subscription.currentPeriodEnd,
          };
        }
      }

      const isNewSubscription = !subscription;
      
      if (!subscription) {
        logger.debug('[activateSubscriptionFromPayment] Creando nueva suscripción', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          plan,
          periodStart: now.toISOString(),
          periodEnd: periodEnd.toISOString(),
        });

        subscription = new Subscription({
          userId: userIdString,
          plan: plan,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialStart: null,
          trialEnd: null,
          mercadopagoTransactionId: transaction.providerTransactionId,
          mercadopagoSubscriptionId: mercadopagoSubscriptionId || null,
          metadata: {
            activatedFrom: transaction._id.toString(),
            activatedAt: now.toISOString(),
            userEmail: user.email,
            userName: user.name || user.username,
          },
        });
      } else {
        logger.debug('[activateSubscriptionFromPayment] Actualizando suscripción existente', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          subscriptionId: subscription._id.toString(),
          oldPlan: subscription.plan,
          newPlan: plan,
          oldStatus: subscription.status,
          oldPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
          newPeriodEnd: periodEnd.toISOString(),
        });

        subscription.status = 'active';
        subscription.plan = plan;
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = periodEnd;
        subscription.trialStart = null;
        subscription.trialEnd = null;
        subscription.mercadopagoTransactionId = transaction.providerTransactionId;
        if (mercadopagoSubscriptionId) {
          subscription.mercadopagoSubscriptionId = mercadopagoSubscriptionId;
        }
        subscription.metadata = {
          ...subscription.metadata,
          lastActivatedFrom: transaction._id.toString(),
          lastActivatedAt: now.toISOString(),
        };
      }

      await subscription.save();
      
      logger.database(isNewSubscription ? 'Nueva suscripción creada' : 'Suscripción actualizada', {
        transactionId: transaction._id.toString(),
        subscriptionId: subscription._id.toString(),
        userId: userIdString,
        plan,
        status: subscription.status,
      });

      // Actualizar usuario
      logger.debug('[activateSubscriptionFromPayment] Actualizando usuario', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        oldStatus: user.subscription?.status,
        newStatus: 'premium',
        oldPlan: user.subscription?.plan,
        newPlan: plan,
      });

      const trialGrantedAt = user.subscription?.trialGrantedAt;
      user.subscription.status = 'premium';
      user.subscription.plan = plan;
      user.subscription.subscriptionStartDate = now;
      user.subscription.subscriptionEndDate = periodEnd;
      user.subscription.trialStartDate = null;
      user.subscription.trialEndDate = null;
      if (trialGrantedAt) {
        user.subscription.trialGrantedAt = trialGrantedAt;
      }
      await user.save();

      const txPersist = await Transaction.findById(transaction._id);
      if (txPersist) {
        const meta = { ...txPersist.metadata, lastActivationSource: source };
        if (!skipIdempotency && externalId) {
          if (source === 'payment') {
            meta.subscriptionActivatedForPaymentId = String(externalId);
            meta.subscriptionActivatedAt = new Date().toISOString();
          } else if (source === 'preapproval') {
            meta.subscriptionActivatedForPreapprovalId = String(externalId);
            meta.subscriptionPreapprovalActivatedAt = new Date().toISOString();
          }
        } else if (skipIdempotency) {
          meta.lastRecoveryAt = new Date().toISOString();
        }
        txPersist.metadata = meta;
        await txPersist.save();
      }

      try {
        const cacheService = (await import('./cacheService.js')).default;
        await cacheService.invalidateUserCache(userIdString);
      } catch (cacheErr) {
        logger.warn('activateSubscriptionFromPayment: error invalidando caché', {
          userId: userIdString,
          error: cacheErr?.message,
        });
      }

      logger.database('Usuario actualizado con suscripción premium', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        subscriptionStatus: user.subscription.status,
        subscriptionPlan: user.subscription.plan,
      });

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

      // Enviar correo de confirmación de compra / agradecimiento por suscripción
      try {
        const mailer = (await import('../config/mailer.js')).default;
        const username = user.name || user.username || 'Usuario';
        const txRef =
          transaction.providerTransactionId || transaction._id?.toString() || '—';
        const receipt = {
          purchaseDate: now,
          amount: typeof transaction.amount === 'number' ? transaction.amount : null,
          currency: transaction.currency || 'CLP',
          providerLabel: 'Mercado Pago',
          reference: txRef,
        };
        const mpMailSent = await mailer.sendSubscriptionThankYouEmail(
          user.email,
          username,
          plan,
          periodEnd,
          receipt,
          'Confirmación de compra / suscripción (Mercado Pago)'
        );

        if (mpMailSent) {
          logger.payment('Correo de agradecimiento por suscripción enviado', {
            userId: userIdString,
            userEmail: user.email,
            plan,
          });
        } else {
          logger.warn('Correo de agradecimiento por suscripción no enviado (mailer devolvió false)', {
            userId: userIdString,
            userEmail: user.email,
            plan,
          });
        }
      } catch (emailError) {
        // No fallar la activación si el correo falla, solo loguear el error
        logger.error('Error enviando correo de agradecimiento por suscripción', {
          userId: userIdString,
          userEmail: user.email,
          error: emailError.message,
          stack: emailError.stack,
        });
      }

      const duration = Date.now() - startTime;
      logger.payment('✅ Suscripción activada exitosamente', {
        transactionId: transaction._id.toString(),
        subscriptionId: subscription._id.toString(),
        userId: userIdString,
        userEmail: user.email,
        plan,
        periodStart: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
        duration,
      });

      return {
        success: true,
        subscriptionId: subscription._id.toString(),
        userId: userIdString,
        plan,
        periodStart: now,
        periodEnd: periodEnd,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('❌ Error activando suscripción desde pago', {
        transactionId: transaction._id?.toString(),
        userId: transaction.userId?._id?.toString() || transaction.userId?.toString(),
        plan: transaction.plan,
        error: error.message,
        stack: error.stack,
        duration,
      });
      
      // Registrar error en auditoría
      if (transaction && transaction.userId) {
        const userId = transaction.userId._id || transaction.userId;
        await paymentAuditService.logEvent('SUBSCRIPTION_ACTIVATION_FAILED', {
          transactionId: transaction._id?.toString(),
          userId: userId.toString(),
          plan: transaction.plan,
          error: error.message,
          stack: error.stack,
        }, userId.toString(), transaction._id?.toString());
      }
      
      throw error;
    }
  }
}

export default new PaymentServiceMercadoPago();

