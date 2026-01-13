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

    // Si tiene ID de suscripción de Mercado Pago, cancelarla
    if (subscription.mercadopagoSubscriptionId) {
      try {
        // Cancelar en Mercado Pago
        // Nota: Esto requiere el endpoint de cancelación de suscripciones
        // Por ahora, solo actualizamos en nuestra base de datos
      } catch (error) {
        logger.error('Error cancelando suscripción en Mercado Pago', {
          userId: userId.toString(),
          subscriptionId: subscription.mercadopagoSubscriptionId,
          error: error.message,
          stack: error.stack,
        });
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
      const preferenceId = paymentData.preference_id || paymentData.preapproval_plan_id;

      logger.payment('PAYMENT_WEBHOOK: Notificación de pago recibida', {
        paymentId,
        preferenceId,
        status: paymentData.status,
        paymentDataKeys: Object.keys(paymentData),
      });

      if (!paymentId) {
        logger.warn('[PAYMENT_WEBHOOK] Payment ID no encontrado en notificación', {
          paymentData: JSON.stringify(paymentData).substring(0, 500),
        });
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
        paymentStatus: paymentData.status,
      });

      const userId = transaction.userId._id || transaction.userId;
      const userIdString = userId.toString();

      logger.debug('[PAYMENT_WEBHOOK] Validando datos del pago', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        userEmail: transaction.userId?.email,
        payerEmail: paymentData.payer?.email,
      });

      // Validar que el email del payer coincida con el usuario (si está disponible)
      if (paymentData.payer?.email && transaction.userId.email) {
        const payerEmail = paymentData.payer.email.toLowerCase().trim();
        const userEmail = transaction.userId.email.toLowerCase().trim();
        if (payerEmail !== userEmail) {
          logger.warn('[PAYMENT_WEBHOOK] Email del payer no coincide', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            payerEmail: paymentData.payer.email,
            userEmail: transaction.userId.email,
            paymentId,
            status: paymentData.status,
          });
          await paymentAuditService.logEvent('PAYMENT_EMAIL_MISMATCH', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            payerEmail: paymentData.payer.email,
            userEmail: transaction.userId.email,
            paymentId,
            status: paymentData.status,
          }, userIdString, transaction._id.toString());
        }
      }

      // Actualizar estado según el estado del pago
      const statusMap = {
        approved: 'completed',
        pending: 'processing',
        rejected: 'failed',
        cancelled: 'canceled',
        refunded: 'refunded',
      };

      const oldStatus = transaction.status;
      const newStatus = statusMap[paymentData.status] || 'pending';
      transaction.status = newStatus;
      transaction.providerTransactionId = paymentId; // Actualizar con payment ID
      transaction.processedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        paymentId: paymentId,
        paymentStatus: paymentData.status,
        notificationReceivedAt: new Date().toISOString(),
        previousStatus: oldStatus,
      };

      logger.payment('PAYMENT_WEBHOOK: Actualizando estado de transacción', {
        transactionId: transaction._id.toString(),
        userId: userIdString,
        oldStatus,
        newStatus,
        paymentStatus: paymentData.status,
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
        status: paymentData.status,
        oldStatus,
        newStatus: transaction.status,
      }, userIdString, transaction._id.toString());

      // Si el pago fue aprobado, activar suscripción
      if (paymentData.status === 'approved') {
        logger.payment('PAYMENT_WEBHOOK: ✅ Pago APROBADO, iniciando activación de suscripción', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          plan: transaction.plan,
          paymentId,
        });

        try {
          const activationStartTime = Date.now();
          const activationResult = await this.activateSubscriptionFromPayment(transaction);
          const activationDuration = Date.now() - activationStartTime;
          
          logger.payment('PAYMENT_WEBHOOK: Resultado de activación de suscripción', {
            transactionId: transaction._id.toString(),
            userId: userIdString,
            success: activationResult?.success,
            alreadyActive: activationResult?.alreadyActive,
            subscriptionId: activationResult?.subscriptionId,
            duration: activationDuration,
          });
          
          // Verificar integridad después de activar
          if (activationResult && activationResult.success && !activationResult.alreadyActive) {
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
      } else {
        logger.payment('PAYMENT_WEBHOOK: Pago no aprobado, no se activa suscripción', {
          transactionId: transaction._id.toString(),
          userId: userIdString,
          paymentStatus: paymentData.status,
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
      const status = preapprovalData.status;
      const payerEmail = preapprovalData.payer_email;
      const planId = preapprovalData.preapproval_plan_id;

      logger.payment('[PREAPPROVAL_WEBHOOK] Notificación recibida', {
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

      // Validar que el email del payer coincida con el usuario
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
          logger.error('[PREAPPROVAL_WEBHOOK] Error activando suscripción', {
            transactionId: transaction._id.toString(),
            userId: transaction.userId._id.toString(),
            error: activationError.message,
            stack: activationError.stack,
          });
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
      logger.error('[PREAPPROVAL_WEBHOOK] Error procesando notificación', {
        error: error.message,
        stack: error.stack,
        preapprovalData: preapprovalData ? { id: preapprovalData.id, status: preapprovalData.status } : null,
      });
      throw error;
    }
  }

  async activateSubscriptionFromPayment(transaction) {
    const startTime = Date.now();
    try {
      logger.payment('activateSubscriptionFromPayment: Iniciando activación', {
        transactionId: transaction._id?.toString(),
        hasUserId: !!transaction.userId,
        plan: transaction.plan,
        transactionStatus: transaction.status,
      });

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
        weekly: () => periodEnd.setDate(periodEnd.getDate() + 7),
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
          mercadopagoTransactionId: transaction.providerTransactionId,
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
        subscription.mercadopagoTransactionId = transaction.providerTransactionId;
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

      user.subscription.status = 'premium';
      user.subscription.plan = plan;
      user.subscription.subscriptionStartDate = now;
      user.subscription.subscriptionEndDate = periodEnd;
      await user.save();

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

      // Enviar correo de agradecimiento por suscripción
      try {
        const mailer = (await import('../config/mailer.js')).default;
        const username = user.name || user.username || 'Usuario';
        const emailTemplate = mailer.emailTemplates.subscriptionThankYouEmail(username, plan, periodEnd);
        
        await mailer.sendEmail(
          user.email,
          emailTemplate,
          'Correo de agradecimiento por suscripción'
        );
        
        logger.payment('Correo de agradecimiento por suscripción enviado', {
          userId: userIdString,
          userEmail: user.email,
          plan,
        });
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

