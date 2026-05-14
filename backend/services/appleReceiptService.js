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
import { normalizeAppleReceiptPayload } from '../utils/appleReceiptNormalize.js';

// URLs de verificación de Apple
const APPLE_VERIFY_URL_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_URL_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';

// Mapeo de Product IDs a planes
export const PRODUCT_ID_TO_PLAN = {
  'com.anto.app.monthly': 'monthly',
  'com.anto.app.quarterly': 'quarterly',
  'com.anto.app.semestral': 'semestral',
  'com.anto.app.yearly': 'yearly',
};

// Mapeo de planes a duración en días
export const PLAN_DURATION_DAYS = {
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
   * @param {boolean} [fromProd21002Retry] - Interno: evita bucle al reintentar en sandbox tras 21002 en producción
   * @returns {Promise<Object>} - Respuesta de Apple
   */
  async validateReceiptWithApple(receiptData, isSandbox = false, fromProd21002Retry = false) {
    const startTime = Date.now();
    const normalized = normalizeAppleReceiptPayload(receiptData);
    if (!normalized.ok) {
      logger.error('[AppleReceipt] Recibo inválido antes de llamar a Apple', { error: normalized.error });
      return {
        status: 21002,
        'is-retryable': false,
        environment: isSandbox ? 'Sandbox' : 'Production',
      };
    }
    const receiptPayload = normalized.receipt;

    const verifyUrl = isSandbox ? APPLE_VERIFY_URL_SANDBOX : APPLE_VERIFY_URL_PRODUCTION;
    
    logger.externalService('Apple', 'Validando recibo', {
      isSandbox,
      url: verifyUrl,
      receiptLength: receiptPayload ? receiptPayload.length : 0,
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
      'receipt-data': receiptPayload,
      password: sharedSecret, // Shared secret para suscripciones auto-renovables
      'exclude-old-transactions': true,
    };

    try {
      const preview =
        typeof receiptPayload === 'string' && receiptPayload.length > 0
          ? {
              length: receiptPayload.length,
              first20: receiptPayload.substring(0, Math.min(20, receiptPayload.length)),
              last20: receiptPayload.substring(Math.max(0, receiptPayload.length - 20)),
            }
          : { length: 0, first20: '', last20: '' };
      // Winston en desarrollo solo imprime `message` (printf); el meta no aparece en consola/Render.
      logger.payment(
        `[AppleReceipt] Receipt preview antes de Apple ${JSON.stringify(preview)}`,
      );

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
        return this.validateReceiptWithApple(receiptPayload, true, false);
      }

      // En algunos builds (p. ej. TestFlight) Apple puede responder 21002 en producción; un intento en sandbox evita falsos negativos.
      if (data.status === 21002 && !isSandbox && !fromProd21002Retry) {
        logger.payment(
          '[AppleReceipt] status 21002 en producción; reintento único contra sandbox (entorno de prueba / recibo de sandbox)',
        );
        return this.validateReceiptWithApple(receiptPayload, true, true);
      }

      // Recibo de producción enviado al endpoint sandbox (p. ej. NODE_ENV=development en servidor)
      if (data.status === 21008 && isSandbox) {
        logger.warn('[AppleReceipt] Recibo de producción detectado en sandbox, revalidando con producción', {
          originalStatus: data.status,
        });
        return this.validateReceiptWithApple(receiptPayload, false, false);
      }

      if (data.status !== 0) {
        const errTxt = this.getStatusErrorMessage(data.status);
        logger.warn(
          `[AppleReceipt] Recibo rechazado por Apple — status=${data.status} — ${errTxt}`,
          {
            isSandbox,
            appleStatus: data.status,
            errorMessage: errTxt,
          }
        );
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
      
      // Elegir la fila de derecho vigente: entre varias del mismo product_id (renovaciones),
      // priorizar la que **caduca más tarde** (expires_date_ms), no solo la última compra.
      const sameProduct = latestReceiptInfo.filter(t => t.product_id === productId);
      const transaction = sameProduct.sort((a, b) => {
        const expA = a.expires_date_ms ? parseInt(a.expires_date_ms, 10) : 0;
        const expB = b.expires_date_ms ? parseInt(b.expires_date_ms, 10) : 0;
        if (expA !== expB) {
          return expB - expA;
        }
        const purA = a.purchase_date_ms ? parseInt(a.purchase_date_ms, 10) : 0;
        const purB = b.purchase_date_ms ? parseInt(b.purchase_date_ms, 10) : 0;
        return purB - purA;
      })[0];

      if (!transaction) {
        logger.payment('AppleReceiptService.processSubscription: transacción no encontrada', {
          userId: userId.toString(),
          productId,
          transactionId: transactionId || 'no proporcionado',
          availableProductIds: latestReceiptInfo.map(t => t.product_id),
          latestReceiptInfoCount: latestReceiptInfo.length,
        });
        
        // Si hay transacciones pero ninguna coincide con el productId, proporcionar más información
        if (latestReceiptInfo.length > 0) {
          return {
            success: false,
            error: `No se encontró la transacción para el producto ${productId} en el recibo. Productos disponibles: ${latestReceiptInfo.map(t => t.product_id).join(', ')}`,
            availableProductIds: latestReceiptInfo.map(t => t.product_id),
          };
        }
        
        return {
          success: false,
          error: 'No se encontró ninguna transacción en el recibo',
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

      const appleTransactionId = String(transaction.transaction_id);
      if (transactionId && String(transactionId) !== appleTransactionId) {
        logger.warn('[AppleReceipt] transactionId del cliente difiere del recibo; usando transaction_id de Apple', {
          userId: userId.toString(),
          clientTransactionId: String(transactionId),
          receiptTransactionId: appleTransactionId,
        });
      }

      const existingAppleTxn = await Transaction.findOne({
        userId,
        paymentProvider: 'apple',
        providerTransactionId: appleTransactionId,
      })
        .select('_id')
        .lean();
      const skipDuplicateSideEffects = !!existingAppleTxn;

      if (skipDuplicateSideEffects) {
        logger.payment('[AppleReceipt] Revalidación idempotente: misma transacción Apple ya registrada; omitiendo alta duplicada', {
          userId: userId.toString(),
          appleTransactionId,
          productId,
        });
      }

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
        
      }

      // Verificar si la suscripción está activa
      const now = new Date();
      const isActive = expiresDate > now;

      logger.debug('[AppleReceipt] Fechas calculadas', {
        userId: userId.toString(),
        purchaseDate: purchaseDate.toISOString(),
        expiresDate: expiresDate.toISOString(),
        now: now.toISOString(),
        isActive,
        daysUntilExpiry: Math.floor((expiresDate - now) / (1000 * 60 * 60 * 24)),
      });

      // Obtener o crear usuario
      const userFindStartTime = Date.now();
      logger.payment('AppleReceiptService.processSubscription: Buscando usuario', {
        userId: userId.toString(),
        productId,
        timestamp: new Date().toISOString(),
      });

      const user = await User.findById(userId);
      const userFindDuration = Date.now() - userFindStartTime;

      if (!user) {
        logger.payment('AppleReceiptService.processSubscription: ❌ ERROR - usuario no encontrado', {
          userId: userId.toString(),
          productId,
          findDuration: `${userFindDuration}ms`,
          totalDuration: Date.now() - startTime,
        });
        return {
          success: false,
          error: 'Usuario no encontrado',
        };
      }

      logger.payment('[AppleReceipt] ✅ Usuario encontrado', {
        userId: userId.toString(),
        userEmail: user.email,
        currentSubscriptionStatus: user.subscription?.status,
        currentSubscriptionPlan: user.subscription?.plan,
        currentSubscriptionProvider: user.subscription?.provider,
        findDuration: `${userFindDuration}ms`,
      });

      // Actualizar suscripción del usuario
      const userUpdateStartTime = Date.now();
      logger.payment('[AppleReceipt] 🔄 Actualizando suscripción del usuario', {
        userId: userId.toString(),
        oldStatus: user.subscription?.status,
        oldPlan: user.subscription?.plan,
        newStatus: isActive ? 'premium' : 'expired',
        newPlan: plan,
        purchaseDate: purchaseDate.toISOString(),
        expiresDate: expiresDate.toISOString(),
        isActive,
        timestamp: new Date().toISOString(),
      });

      const oldUserSubscription = {
        status: user.subscription?.status,
        plan: user.subscription?.plan,
        provider: user.subscription?.provider,
      };

      const trialGrantedAtPreserve = user.subscription?.trialGrantedAt;
      user.subscription = {
        status: isActive ? 'premium' : 'expired',
        plan: plan,
        subscriptionStartDate: purchaseDate,
        subscriptionEndDate: expiresDate,
        trialStartDate: null,
        trialEndDate: null,
        trialGrantedAt: trialGrantedAtPreserve || user.subscription?.trialGrantedAt || null,
        provider: 'apple',
        appleTransactionId,
        appleOriginalTransactionId: transaction.original_transaction_id,
      };

      const userSaveStartTime = Date.now();
      await user.save();
      const userSaveDuration = Date.now() - userSaveStartTime;

      logger.payment('[AppleReceipt] ✅ Usuario actualizado con nueva suscripción', {
        userId: userId.toString(),
        oldSubscription: oldUserSubscription,
        newSubscription: {
          status: user.subscription.status,
          plan: user.subscription.plan,
          provider: user.subscription.provider,
        },
        saveDuration: `${userSaveDuration}ms`,
        updateDuration: Date.now() - userUpdateStartTime,
      });

      // Crear o actualizar registro en modelo Subscription
      const subscriptionFindStartTime = Date.now();
      logger.payment('[AppleReceipt] 🔍 Buscando registro de suscripción', {
        userId: userId.toString(),
        plan,
        timestamp: new Date().toISOString(),
      });

      let subscription = await Subscription.findOne({ userId });
      const subscriptionFindDuration = Date.now() - subscriptionFindStartTime;
      const isNewSubscription = !subscription;
      
      if (!subscription) {
        logger.payment('[AppleReceipt] ➕ Creando nuevo registro de suscripción', {
          userId: userId.toString(),
          plan,
          isActive,
          findDuration: `${subscriptionFindDuration}ms`,
          timestamp: new Date().toISOString(),
        });
        subscription = new Subscription({
          userId,
          plan,
          status: isActive ? 'active' : 'expired',
          currentPeriodStart: purchaseDate,
          currentPeriodEnd: expiresDate,
          trialStart: null,
          trialEnd: null,
          metadata: {
            provider: 'apple',
            appleTransactionId,
            appleOriginalTransactionId: transaction.original_transaction_id,
            productId,
          },
        });
      } else {
        logger.payment('[AppleReceipt] 🔄 Actualizando registro de suscripción existente', {
          userId: userId.toString(),
          oldPlan: subscription.plan,
          oldStatus: subscription.status,
          oldIsActive: subscription.isActive,
          newPlan: plan,
          newStatus: isActive ? 'active' : 'expired',
          newIsActive: isActive,
          findDuration: `${subscriptionFindDuration}ms`,
          timestamp: new Date().toISOString(),
        });
        subscription.plan = plan;
        subscription.status = isActive ? 'active' : 'expired';
        subscription.currentPeriodStart = purchaseDate;
        subscription.currentPeriodEnd = expiresDate;
        subscription.trialStart = null;
        subscription.trialEnd = null;
        subscription.metadata = {
          ...subscription.metadata,
          provider: 'apple',
          appleTransactionId,
          appleOriginalTransactionId: transaction.original_transaction_id,
          productId,
        };
      }

      const subscriptionSaveStartTime = Date.now();
      logger.payment('[AppleReceipt] 💾 Guardando registro de suscripción', {
        userId: userId.toString(),
        isNew: isNewSubscription,
        plan,
        status: subscription.status,
        isActive: subscription.isActive,
        startDate: purchaseDate.toISOString(),
        endDate: expiresDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      await subscription.save();
      const subscriptionSaveDuration = Date.now() - subscriptionSaveStartTime;
      
      logger.payment(`[AppleReceipt] ✅ ${isNewSubscription ? 'Nueva suscripción creada' : 'Suscripción actualizada'}`, {
        userId: userId.toString(),
        subscriptionId: subscription._id.toString(),
        plan,
        status: subscription.status,
        isActive: subscription.isActive,
        saveDuration: `${subscriptionSaveDuration}ms`,
      });

      if (!skipDuplicateSideEffects) {
        const transactionCreateStartTime = Date.now();
        logger.payment('[AppleReceipt] 📝 Creando registro de transacción', {
          userId: userId.toString(),
          productId,
          plan,
          appleTransactionId,
          amount: parseFloat(transaction.price || 0),
          currency: transaction.currency || 'USD',
          status: isActive ? 'completed' : 'expired',
          timestamp: new Date().toISOString(),
        });

        const transactionRecord = new Transaction({
          userId,
          type: 'subscription',
          paymentProvider: 'apple',
          paymentMethod: 'other',
          amount: parseFloat(transaction.price || 0),
          currency: (transaction.currency || 'USD').toUpperCase(),
          status: isActive ? 'completed' : 'expired',
          providerTransactionId: appleTransactionId,
          metadata: {
            productId,
            plan,
            purchaseDate,
            expiresDate,
            originalTransactionId: transaction.original_transaction_id,
          },
        });

        const transactionSaveStartTime = Date.now();
        await transactionRecord.save();
        const transactionSaveDuration = Date.now() - transactionSaveStartTime;

        logger.payment('[AppleReceipt] ✅ Transacción creada', {
          userId: userId.toString(),
          transactionRecordId: transactionRecord._id.toString(),
          amount: transactionRecord.amount,
          currency: transactionRecord.currency,
          status: transactionRecord.status,
          saveDuration: `${transactionSaveDuration}ms`,
          createDuration: Date.now() - transactionCreateStartTime,
        });

        await paymentAuditService.logEvent(
          'APPLE_SUBSCRIPTION_ACTIVATED',
          {
            userId: userId.toString(),
            productId,
            plan,
            transactionId: appleTransactionId,
            originalTransactionId: transaction.original_transaction_id,
            purchaseDate,
            expiresDate,
            isActive,
          },
          userId.toString(),
        );
      }

      // Correo de agradecimiento: primera activación, o reintento en idempotencia si nunca se marcó envío
      if (isActive && user.email) {
        const persistThankYouEmailFlag = async () => {
          await Transaction.updateOne(
            { userId, paymentProvider: 'apple', providerTransactionId: appleTransactionId },
            { $set: { 'metadata.thankYouEmailSentAt': new Date() } }
          );
        };

        const sendThankYouEmail = async (reasonLabel) => {
          const emailStartTime = Date.now();
          logger.payment(`[AppleReceipt] 📧 ${reasonLabel}`, {
            userId: userId.toString(),
            userEmail: user.email,
            plan,
            productId,
            idempotentReplay: skipDuplicateSideEffects,
            timestamp: new Date().toISOString(),
          });

          try {
            const mailer = (await import('../config/mailer.js')).default;
            const username = user.name || user.username || 'Usuario';
            const priceRaw = transaction.price;
            const parsedPrice =
              priceRaw != null && priceRaw !== '' ? parseFloat(priceRaw) : NaN;
            const receipt = {
              purchaseDate,
              amount: Number.isFinite(parsedPrice) ? parsedPrice : null,
              currency: transaction.currency || 'USD',
              providerLabel: 'App Store (Apple)',
              reference: appleTransactionId,
            };

            const sent = await mailer.sendSubscriptionThankYouEmail(
              user.email,
              username,
              plan,
              expiresDate,
              receipt,
              'Confirmación de compra / suscripción (Apple)'
            );

            const emailDuration = Date.now() - emailStartTime;
            if (sent) {
              await persistThankYouEmailFlag();
              logger.payment('[AppleReceipt] ✅ Correo de agradecimiento enviado', {
                userId: userId.toString(),
                userEmail: user.email,
                plan,
                productId,
                emailDuration: `${emailDuration}ms`,
              });
            } else {
              logger.warn('[AppleReceipt] ⚠️ Correo de agradecimiento no enviado (mailer devolvió false)', {
                userId: userId.toString(),
                userEmail: user.email,
                plan,
                productId,
                emailDuration: `${emailDuration}ms`,
              });
            }
          } catch (emailError) {
            const emailDuration = Date.now() - emailStartTime;
            logger.error('[AppleReceipt] ❌ Error enviando correo de agradecimiento', {
              userId: userId.toString(),
              userEmail: user.email,
              plan,
              productId,
              error: emailError.message,
              errorType: emailError.constructor?.name,
              stack: emailError.stack,
              emailDuration: `${emailDuration}ms`,
            });
          }
        };

        if (!skipDuplicateSideEffects) {
          await sendThankYouEmail('Enviando correo de agradecimiento');
        } else {
          const txnForEmail = await Transaction.findOne({
            userId,
            paymentProvider: 'apple',
            providerTransactionId: appleTransactionId,
          })
            .select('metadata')
            .lean();
          const alreadySent = txnForEmail?.metadata?.thankYouEmailSentAt;
          if (!alreadySent) {
            await sendThankYouEmail(
              'Reintento: correo de agradecimiento (activación previa sin constancia de envío)'
            );
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.payment('[AppleReceipt] 🎉 PROCESAMIENTO COMPLETADO EXITOSAMENTE', {
        userId: userId.toString(),
        productId,
        plan,
        appleTransactionId,
        idempotentReplay: skipDuplicateSideEffects,
        isActive,
        totalDuration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
      logger.payment('AppleReceiptService.processSubscription completado exitosamente', {
        userId: userId.toString(),
        productId,
        plan,
        appleTransactionId,
        idempotentReplay: skipDuplicateSideEffects,
        isActive,
        duration,
      });

      return {
        success: true,
        idempotentReplay: skipDuplicateSideEffects,
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
   * Sincroniza User, Subscription y opcionalmente Transaction desde un JWS de transacción StoreKit 2
   * verificado (p. ej. App Store Server Notifications V2).
   *
   * @param {import('mongoose').Types.ObjectId|string} userId
   * @param {Object} tx - Payload decodificado (JWSTransactionDecodedPayload, camelCase)
   * @param {Object} [options]
   * @param {boolean} [options.forceExpired]
   * @param {boolean} [options.createTransactionRecord]
   * @param {string} [options.source]
   */
  async syncSubscriptionFromStoreKit2Transaction(userId, tx, options = {}) {
    const {
      forceExpired = false,
      createTransactionRecord = true,
      source = 'storekit2',
    } = options;

    const productId = tx.productId;
    const appleTransactionId = String(tx.transactionId || '');
    const originalTransactionId = String(tx.originalTransactionId || '');

    const plan = PRODUCT_ID_TO_PLAN[productId];
    if (!plan) {
      logger.warn('[AppleReceipt] StoreKit2 sync: producto no reconocido', {
        userId: String(userId),
        productId,
      });
      return { success: false, error: `Product ID no reconocido: ${productId}` };
    }

    const purchaseDate = tx.purchaseDate ? new Date(tx.purchaseDate) : new Date();
    let expiresDate = tx.expiresDate ? new Date(tx.expiresDate) : null;
    if (!expiresDate) {
      const durationMs = PLAN_DURATION_DAYS[plan] * 24 * 60 * 60 * 1000;
      expiresDate = new Date(purchaseDate.getTime() + durationMs);
    }

    const now = new Date();
    let isActive = !forceExpired && expiresDate > now;
    if (tx.revocationDate) {
      const rev = new Date(tx.revocationDate);
      isActive = false;
      if (!forceExpired && rev.getTime() < expiresDate.getTime()) {
        expiresDate = rev;
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const trialGrantedAtPreserve = user.subscription?.trialGrantedAt;
    user.subscription = {
      status: isActive ? 'premium' : 'expired',
      plan,
      subscriptionStartDate: purchaseDate,
      subscriptionEndDate: expiresDate,
      trialStartDate: null,
      trialEndDate: null,
      trialGrantedAt: trialGrantedAtPreserve || user.subscription?.trialGrantedAt || null,
      provider: 'apple',
      appleTransactionId: appleTransactionId || user.subscription?.appleTransactionId,
      appleOriginalTransactionId:
        originalTransactionId || user.subscription?.appleOriginalTransactionId,
    };
    await user.save();

    let subscription = await Subscription.findOne({ userId });
    const isNewSubscription = !subscription;
    if (!subscription) {
      subscription = new Subscription({
        userId,
        plan,
        status: isActive ? 'active' : 'expired',
        currentPeriodStart: purchaseDate,
        currentPeriodEnd: expiresDate,
        trialStart: null,
        trialEnd: null,
        metadata: {
          provider: 'apple',
          appleTransactionId,
          appleOriginalTransactionId: originalTransactionId,
          productId,
          storeKit2SyncSource: source,
        },
      });
    } else {
      subscription.plan = plan;
      subscription.status = isActive ? 'active' : 'expired';
      subscription.currentPeriodStart = purchaseDate;
      subscription.currentPeriodEnd = expiresDate;
      subscription.trialStart = null;
      subscription.trialEnd = null;
      subscription.metadata = {
        ...subscription.metadata,
        provider: 'apple',
        appleTransactionId,
        appleOriginalTransactionId: originalTransactionId,
        productId,
        storeKit2SyncSource: source,
        lastStoreKit2SyncAt: new Date(),
      };
    }
    await subscription.save();

    let transactionCreated = false;
    if (createTransactionRecord && appleTransactionId) {
      const existing = await Transaction.findOne({
        userId,
        paymentProvider: 'apple',
        providerTransactionId: appleTransactionId,
      })
        .select('_id')
        .lean();
      if (!existing) {
        const priceMilli = tx.price;
        const amount =
          priceMilli != null && Number.isFinite(Number(priceMilli))
            ? Number(priceMilli) / 1000
            : 0;
        const currency = (tx.currency || 'USD').toUpperCase();
        const transactionRecord = new Transaction({
          userId,
          type: 'subscription',
          paymentProvider: 'apple',
          paymentMethod: 'other',
          amount,
          currency,
          status: isActive ? 'completed' : 'expired',
          providerTransactionId: appleTransactionId,
          metadata: {
            productId,
            plan,
            purchaseDate,
            expiresDate,
            originalTransactionId,
            source,
          },
        });
        await transactionRecord.save();
        transactionCreated = true;
      }
    }

    logger.payment('[AppleReceipt] StoreKit2 sync aplicado', {
      userId: String(userId),
      plan,
      isActive,
      newSubscription: isNewSubscription,
      transactionCreated,
      source,
      appleTransactionId,
    });

    return {
      success: true,
      isActive,
      plan,
      subscriptionId: subscription._id,
      transactionCreated,
    };
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

