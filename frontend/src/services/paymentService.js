/**
 * Servicio de Pagos
 * 
 * Gestiona todas las operaciones relacionadas con pagos y suscripciones
 * usando StoreKit en iOS y Mercado Pago en Android.
 * 
 * @author AntoApp Team
 */

import { Platform, Linking } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import {
  normalizeClientAppleReceipt,
  isPlausibleAppleReceiptBase64,
  MIN_APP_STORE_RECEIPT_BASE64_LENGTH,
} from '../utils/appleReceiptNormalize';
import storeKitService from './storeKitService';
import { subscriptionLooksCurrentlyUsable } from '../utils/subscriptionAccess';

const TRIAL_INFO_CLIENT_CACHE_MS = 60 * 1000;
let trialInfoClientCache = null;
let trialInfoClientCacheExpiresAt = 0;
let trialInfoInFlight = null;

/** Caché corta en memoria para no duplicar GET /subscription-status en el mismo foco de chat. */
const SUBSCRIPTION_STATUS_CLIENT_CACHE_MS = 20 * 1000;
let subscriptionStatusClientCache = null;
let subscriptionStatusClientCacheExpiresAt = 0;
let subscriptionStatusInFlight = null;

export function clearTrialInfoClientCache() {
  trialInfoClientCache = null;
  trialInfoClientCacheExpiresAt = 0;
  trialInfoInFlight = null;
}

export function clearSubscriptionStatusClientCache() {
  subscriptionStatusClientCache = null;
  subscriptionStatusClientCacheExpiresAt = 0;
  subscriptionStatusInFlight = null;
}

function mapValidatedSubscriptionToClientStatus(validationSubscription) {
  if (!validationSubscription || typeof validationSubscription !== 'object') {
    return null;
  }
  const status = String(validationSubscription.status || '').toLowerCase();
  const isPremiumLike = status === 'premium' || status === 'active';
  if (!isPremiumLike && validationSubscription.isActive !== true) {
    return null;
  }
  const startDate =
    validationSubscription.startDate ||
    validationSubscription.subscriptionStartDate ||
    validationSubscription.currentPeriodStart ||
    null;
  const endDate =
    validationSubscription.endDate ||
    validationSubscription.subscriptionEndDate ||
    validationSubscription.currentPeriodEnd ||
    null;
  return {
    success: true,
    hasSubscription: true,
    status: validationSubscription.status || 'premium',
    plan: validationSubscription.plan,
    isActive: validationSubscription.isActive !== false,
    isInTrial: false,
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
    currentPeriodStart: startDate,
    currentPeriodEnd: endDate,
    trialStartDate: null,
    trialEndDate: null,
  };
}

/**
 * Tras validate-receipt exitoso, sembrar caché cliente para que la UI refleje premium de inmediato.
 * @param {object|null|undefined} validationSubscription
 * @returns {boolean}
 */
export function applyValidatedSubscriptionToClientCache(validationSubscription) {
  const mapped = mapValidatedSubscriptionToClientStatus(validationSubscription);
  if (!mapped) return false;

  subscriptionStatusClientCache = mapped;
  subscriptionStatusClientCacheExpiresAt = Date.now() + SUBSCRIPTION_STATUS_CLIENT_CACHE_MS;

  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { success: _success, ...persistable } = mapped;
    void AsyncStorage.setItem('subscription_status_cache', JSON.stringify(persistable)).catch(() => {});
  } catch (_) {
    /* no crítico */
  }

  return true;
}

function notifySubscriptionStatusChanged(validationSubscription = null) {
  clearSubscriptionStatusClientCache();
  clearTrialInfoClientCache();
  if (validationSubscription) {
    applyValidatedSubscriptionToClientCache(validationSubscription);
  }
  if (typeof subscriptionStatusChangeHandler === 'function') {
    try {
      subscriptionStatusChangeHandler(validationSubscription);
    } catch (handlerError) {
      console.warn('[PaymentService] Error en subscriptionStatusChangeHandler:', handlerError);
    }
  }
}

let subscriptionStatusChangeHandler = null;

/**
 * Registra un callback global (SubscriptionContext) para propagar cambios tras validate-receipt.
 * @param {((validationSubscription: object|null) => void)|null} handler
 */
export function setSubscriptionStatusChangeHandler(handler) {
  subscriptionStatusChangeHandler = typeof handler === 'function' ? handler : null;
}

function classifyStoreKitError(result) {
  if (!result || typeof result !== 'object') return 'GENERIC_ERROR';
  if (result.cancelled) return 'PURCHASE_CANCELLED';

  const rawCode = String(result.code || '').toUpperCase();
  const codeMap = {
    VALIDATION_NETWORK: 'VALIDATION_NETWORK',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
    APPSTORE_UNAVAILABLE: 'APPSTORE_UNAVAILABLE',
    TECHNICAL_ERROR: 'TECHNICAL_ERROR',
    PURCHASE_CANCELLED: 'PURCHASE_CANCELLED',
    PURCHASE_IN_PROGRESS: 'APPSTORE_UNAVAILABLE',
    MODULE_UNAVAILABLE: 'APPSTORE_UNAVAILABLE',
    PURCHASE_FN_UNAVAILABLE: 'APPSTORE_UNAVAILABLE',
    PURCHASE_CONFIG_UNAVAILABLE: 'APPSTORE_UNAVAILABLE',
    STOREKIT_UNAVAILABLE: 'APPSTORE_UNAVAILABLE',
    INITIALIZATION_FAILED: 'APPSTORE_UNAVAILABLE',
    PRODUCTS_NOT_READY: 'PRODUCT_UNAVAILABLE',
    PRODUCTS_FETCH_FAILED: 'PRODUCT_UNAVAILABLE',
    PRODUCTS_LOAD_ERROR: 'PRODUCT_UNAVAILABLE',
    PRODUCT_IDS_INVALID: 'PRODUCT_UNAVAILABLE',
    APPSTORE_NO_RESPONSE: 'APPSTORE_UNAVAILABLE',
    APPSTORE_INVALID_RESPONSE: 'APPSTORE_UNAVAILABLE',
    PURCHASE_FAILED: 'GENERIC_ERROR',
    PURCHASE_EXCEPTION: 'GENERIC_ERROR',
    INVALID_PLAN: 'GENERIC_ERROR',
  };
  if (rawCode && codeMap[rawCode]) {
    return codeMap[rawCode];
  }

  const rawMessage =
    typeof result.error === 'string' ? result.error : String(result.error || '');
  const normalized = rawMessage.toLowerCase();

  if (result.validationError) {
    if (
      normalized.includes('conectar') ||
      normalized.includes('servidor') ||
      normalized.includes('network')
    ) {
      return 'VALIDATION_NETWORK';
    }
    return 'VALIDATION_ERROR';
  }

  if (
    normalized.includes('producto') ||
    normalized.includes('no está disponible') ||
    rawCode.includes('PRODUCT')
  ) {
    return 'PRODUCT_UNAVAILABLE';
  }

  if (
    normalized.includes('app store') ||
    normalized.includes('storekit') ||
    rawCode.includes('CONNECTION')
  ) {
    return 'APPSTORE_UNAVAILABLE';
  }

  if (normalized.includes('undefined is not a function')) {
    return 'TECHNICAL_ERROR';
  }

  return 'GENERIC_ERROR';
}

function classifyRestoreError(result) {
  if (!result || typeof result !== 'object') return 'RESTORE_GENERIC_ERROR';
  const rawCode = String(result.code || '').toUpperCase();
  if (rawCode === 'RESTORE_CANCELLED') return 'RESTORE_CANCELLED';
  if (
    rawCode === 'STOREKIT_UNAVAILABLE' ||
    rawCode === 'MODULE_UNAVAILABLE' ||
    rawCode === 'INITIALIZATION_FAILED'
  ) {
    return 'RESTORE_UNAVAILABLE';
  }
  if (
    rawCode === 'APPSTORE_NO_RESPONSE' ||
    rawCode === 'APPSTORE_INVALID_RESPONSE' ||
    rawCode === 'RESTORE_FAILED' ||
    rawCode === 'RESTORE_EXCEPTION'
  ) {
    return 'RESTORE_FAILED';
  }
  if (rawCode === 'RESTORE_NO_VALID_RECEIPT') {
    return 'RESTORE_NO_VALID_RECEIPT';
  }
  if (rawCode === 'RESTORE_VALIDATION_FAILED') {
    return 'RESTORE_VALIDATION_FAILED';
  }
  if (rawCode === 'RESTORE_VALIDATION_EXCEPTION') {
    return 'RESTORE_VALIDATION_EXCEPTION';
  }
  return 'RESTORE_GENERIC_ERROR';
}

function resolveServiceErrorCode(error, fallbackCode) {
  const backendCode =
    typeof error?.response?.data?.code === 'string'
      ? error.response.data.code.trim()
      : '';
  if (backendCode) return backendCode.toUpperCase();

  const rawCode = typeof error?.code === 'string' ? error.code.trim().toUpperCase() : '';
  if (rawCode === 'ECONNABORTED' || rawCode === 'ETIMEDOUT') return 'TIMEOUT';
  if (rawCode) return rawCode;

  const status = Number(error?.response?.status);
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMIT';
  if (Number.isFinite(status) && status >= 500) return 'SERVER_ERROR';

  const normalizedMessage = String(error?.message || '').toLowerCase();
  if (normalizedMessage.includes('timeout')) return 'TIMEOUT';
  if (normalizedMessage.includes('network') || normalizedMessage.includes('red')) {
    return 'NETWORK_ERROR';
  }

  return fallbackCode;
}

class PaymentService {
  /**
   * Obtener planes disponibles
   * @returns {Promise<Object>} - Planes disponibles
   */
  async getPlans() {
    try {
      const response = await api.get(ENDPOINTS.PAYMENT_PLANS);
      return {
        success: true,
        plans: response.plans,
        provider: response.provider,
      };
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener planes',
        errorCode: resolveServiceErrorCode(error, 'PLANS_FETCH_ERROR'),
      };
    }
  }

  /**
   * Crear sesión de checkout
   * En iOS usa StoreKit, en Android usa Mercado Pago
   * @param {string} plan - Plan seleccionado ('monthly', 'quarterly', 'semestral', 'yearly')
   * @param {string} successUrl - URL de éxito (opcional, solo Android)
   * @param {string} cancelUrl - URL de cancelación (opcional, solo Android)
   * @returns {Promise<Object>} - Sesión de checkout o resultado de compra
   */
  async createCheckoutSession(plan, successUrl = null, cancelUrl = null) {
    // En iOS, usar StoreKit directamente
    if (Platform.OS === 'ios' && storeKitService.isAvailable()) {
      // StoreKit maneja la compra directamente, no necesita "sesión de checkout"
      // Retornamos un objeto especial que indica que se debe usar StoreKit
      return {
        success: true,
        useStoreKit: true,
        plan,
      };
    }

    // En Android, usar Mercado Pago (comportamiento original)
    try {
      // Construir el payload, omitiendo null/undefined
      const payload = { plan };
      if (successUrl) payload.successUrl = successUrl;
      if (cancelUrl) payload.cancelUrl = cancelUrl;
      
      const response = await api.post(ENDPOINTS.PAYMENT_CREATE_CHECKOUT, payload);

      return {
        success: true,
        sessionId: response.sessionId || response.preferenceId,
        url: response.url || response.initPoint,
        preferenceId: response.preferenceId,
        useStoreKit: false,
      };
    } catch (error) {
      console.error('Error creando sesión de checkout:', error);
      return {
        success: false,
        error: error.message || 'Error al crear sesión de checkout',
        errorCode: resolveServiceErrorCode(error, 'CHECKOUT_CREATE_ERROR'),
      };
    }
  }

  /**
   * Comprar suscripción usando StoreKit (iOS)
   * @param {string} plan - Plan a comprar
   * @returns {Promise<Object>} - Resultado de la compra
   */
  async purchaseWithStoreKit(plan) {
    if (!storeKitService.isAvailable()) {
      return {
        success: false,
        error: 'StoreKit no está disponible en esta plataforma',
        errorCode: 'APPSTORE_UNAVAILABLE',
      };
    }

    // Función para validar el recibo con el backend
    const validateReceipt = async (receiptData) => {
      const validationStartTime = Date.now();
      try {
        console.log('[PaymentService] 🔐 Iniciando validación de recibo', {
          hasReceiptData: !!receiptData,
          hasTransactionReceipt: !!receiptData?.transactionReceipt,
          hasProductId: !!receiptData?.productId,
          productId: receiptData?.productId,
          timestamp: new Date().toISOString(),
        });

        // Validar que receiptData tenga los datos necesarios
        if (!receiptData || !receiptData.transactionReceipt) {
          console.error('[PaymentService] ❌ ERROR: Datos de recibo incompletos (validación inicial)', {
            hasReceiptData: !!receiptData,
            hasTransactionReceipt: !!receiptData?.transactionReceipt,
          });
          return {
            success: false,
            error: 'Datos de recibo incompletos',
          };
        }
        
        // Validar que receiptData tenga todos los campos necesarios
        if (!receiptData.transactionReceipt) {
          console.error('[PaymentService] ❌ ERROR: Falta transactionReceipt', {
            receiptDataKeys: Object.keys(receiptData || {}),
          });
          return {
            success: false,
            error: 'Datos de recibo incompletos: falta transactionReceipt',
          };
        }

        if (!receiptData.productId) {
          console.error('[PaymentService] ❌ ERROR: Falta productId', {
            receiptDataKeys: Object.keys(receiptData || {}),
          });
          return {
            success: false,
            error: 'Datos de recibo incompletos: falta productId',
          };
        }

        const receiptPayload = normalizeClientAppleReceipt(receiptData.transactionReceipt);
        if (
          receiptPayload.length < MIN_APP_STORE_RECEIPT_BASE64_LENGTH ||
          !isPlausibleAppleReceiptBase64(receiptPayload)
        ) {
          console.error('[PaymentService] ❌ ERROR: Recibo inválido o vacío tras normalizar', {
            length: receiptPayload.length,
            productId: receiptData.productId,
          });
          return {
            success: false,
            error:
              'El recibo no es válido para validar con Apple (vacío o no es el recibo de la app). Probá «Restaurar compras» o reiniciar la app.',
          };
        }

        const payload = {
          receipt: receiptPayload,
          productId: receiptData.productId,
        };

        // Agregar campos opcionales solo si existen
        if (receiptData.transactionId) {
          payload.transactionId = receiptData.transactionId;
        }
        if (receiptData.originalTransactionIdentifierIOS) {
          payload.originalTransactionIdentifierIOS = receiptData.originalTransactionIdentifierIOS;
        }

        console.log('[PaymentService] 📤 Enviando validación al backend', {
          productId: payload.productId,
          hasReceipt: !!payload.receipt,
          receiptLength: payload.receipt?.length || 0,
          hasTransactionId: !!payload.transactionId,
          hasOriginalTransactionId: !!payload.originalTransactionIdentifierIOS,
        });

        if (__DEV__) {
          const rp = receiptPayload;
          console.log('[PaymentService] 🔍 Receipt a enviar (TEMP):', {
            length: rp.length,
            first20: rp.substring(0, Math.min(20, rp.length)),
            last20: rp.substring(Math.max(0, rp.length - 20)),
            productId: receiptData.productId,
          });
        }

        const requestStartTime = Date.now();
        const response = await api.post(ENDPOINTS.PAYMENT_VALIDATE_RECEIPT, payload);
        const requestDuration = Date.now() - requestStartTime;

        console.log('[PaymentService] 📥 Respuesta del backend recibida', {
          productId: receiptData.productId,
          hasResponse: !!response,
          success: response?.success,
          hasError: !!response?.error,
          hasSubscription: !!response?.subscription,
          responseTime: `${requestDuration}ms`,
          timestamp: new Date().toISOString(),
        });

        // Validar que la respuesta sea válida
        if (!response || typeof response !== 'object') {
          console.error('[PaymentService] ❌ ERROR: Respuesta inválida de validación', {
            productId: receiptData.productId,
            responseType: typeof response,
            response: response,
            totalDuration: Date.now() - validationStartTime,
          });
          return {
            success: false,
            error: 'No se recibió respuesta válida del servidor',
          };
        }

        // Validar que response tenga la propiedad success
        if (typeof response.success !== 'boolean') {
          console.error('[PaymentService] ❌ ERROR: Respuesta sin propiedad success', {
            productId: receiptData.productId,
            responseKeys: Object.keys(response || {}),
            response: response,
            totalDuration: Date.now() - validationStartTime,
          });
          return {
            success: false,
            error: response.error || 'Respuesta inválida del servidor',
          };
        }

        const totalDuration = Date.now() - validationStartTime;
        if (response.success) {
          notifySubscriptionStatusChanged(response.subscription || null);
          console.log('[PaymentService] ✅ Validación exitosa', {
            productId: receiptData.productId,
            hasSubscription: !!response.subscription,
            subscriptionStatus: response.subscription?.status,
            subscriptionPlan: response.subscription?.plan,
            totalDuration: `${totalDuration}ms`,
          });
        } else {
          console.error('[PaymentService] ❌ Validación falló', {
            productId: receiptData.productId,
            error: response.error,
            totalDuration: `${totalDuration}ms`,
          });
        }

        return {
          success: response.success,
          error: response.error || null,
          subscription: response.subscription || null,
          appleStatus: response.appleStatus ?? response.status ?? null,
        };
      } catch (error) {
        const totalDuration = Date.now() - validationStartTime;
        console.error('[PaymentService] ❌ EXCEPCIÓN en validación de recibo', {
          productId: receiptData?.productId,
          error: error?.message,
          errorType: error?.constructor?.name,
          hasResponse: !!error?.response,
          responseStatus: error?.response?.status,
          responseData: error?.response?.data,
          stack: error?.stack,
          totalDuration: `${totalDuration}ms`,
        });
        return {
          success: false,
          error: error?.message || error?.response?.data?.error || 'Error al validar la compra',
          appleStatus: error?.response?.data?.appleStatus ?? error?.response?.data?.status ?? null,
        };
      }
    };

    const result = await storeKitService.purchaseSubscription(plan, validateReceipt);
    if (!result || typeof result !== 'object') {
      return {
        success: false,
        error: 'Respuesta inválida de StoreKit',
        errorCode: 'GENERIC_ERROR',
      };
    }
    if (result.success) {
      return {
        ...result,
        subscription: result.subscription ?? null,
      };
    }
    return {
      ...result,
      errorCode: classifyStoreKitError(result),
    };
  }

  /**
   * Restaurar compras (iOS)
   * @returns {Promise<Object>} - Compras restauradas
   */
  async restorePurchases() {
    if (!storeKitService.isAvailable()) {
      return {
        success: false,
        error: 'StoreKit no está disponible en esta plataforma',
        errorCode: 'RESTORE_UNAVAILABLE',
        purchases: [],
      };
    }

    const result = await storeKitService.restorePurchases();
    if (!result || typeof result !== 'object') {
      return {
        success: false,
        error: 'Respuesta inválida de StoreKit',
        errorCode: 'RESTORE_GENERIC_ERROR',
        purchases: [],
      };
    }
    if (!result.success) {
      return {
        ...result,
        errorCode: classifyRestoreError(result),
      };
    }
    
    if (result.success && result.purchases && result.purchases.length > 0) {
      const withPayload = result.purchases
        .filter((p) => p && p.transactionReceipt && p.productId)
        .map((p) => ({
          ...p,
          _receiptNorm: normalizeClientAppleReceipt(p.transactionReceipt),
        }));

      const plausible = withPayload.filter(
        (p) =>
          p._receiptNorm.length >= MIN_APP_STORE_RECEIPT_BASE64_LENGTH &&
          isPlausibleAppleReceiptBase64(p._receiptNorm),
      );

      if (plausible.length === 0) {
        return {
          success: false,
          error:
            'No hay ningún recibo de la app válido entre las compras restauradas. En el simulador suele faltar el archivo de recibo (utilice un dispositivo físico o un archivo .storekit). En dispositivo físico, intente reiniciar la aplicación o ejecutar de nuevo «Restaurar compras».',
          errorCode: 'RESTORE_NO_VALID_RECEIPT',
          purchases: result.purchases,
        };
      }

      plausible.sort((a, b) => (b.purchaseTime || 0) - (a.purchaseTime || 0));
      const latest = plausible[0];
      const receiptPayload = latest._receiptNorm;

      try {
        if (__DEV__) {
          const rp = receiptPayload;
          console.log('[PaymentService] 🔍 Receipt a enviar (TEMP, restore):', {
            length: rp.length,
            first20: rp.substring(0, Math.min(20, rp.length)),
            last20: rp.substring(Math.max(0, rp.length - 20)),
            productId: latest.productId,
          });
        }

        const response = await api.post(ENDPOINTS.PAYMENT_VALIDATE_RECEIPT, {
          receipt: receiptPayload,
          productId: latest.productId,
          transactionId: latest.transactionId || latest.orderId || null,
          originalTransactionIdentifierIOS:
            latest.originalTransactionIdentifierIOS || latest.originalOrderId || null,
          restore: true,
        });
        if (response && typeof response === 'object' && response.success === false) {
          const msg = response.error || 'El servidor rechazó la validación del recibo';
          console.warn('[PaymentService] validate-receipt respondió sin éxito (restore):', msg);
          return {
            success: false,
            error: msg,
            errorCode: 'RESTORE_VALIDATION_FAILED',
            purchases: result.purchases,
            validationErrors: [msg],
          };
        }
        notifySubscriptionStatusChanged(response?.subscription || null);
        console.log('[PaymentService] Compra restaurada validada:', {
          productId: latest.productId,
        });
        return {
          success: true,
          purchases: result.purchases,
          validation: response,
          subscription: response?.subscription || null,
        };
      } catch (error) {
        const msg =
          error?.message ||
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Error al validar compra';
        console.error('[PaymentService] Error validando compra restaurada:', error);
        return {
          success: false,
          error: msg,
          errorCode: 'RESTORE_VALIDATION_EXCEPTION',
          purchases: result.purchases,
          validationErrors: [msg],
        };
      }
    }

    return result;
  }

  /**
   * Abrir URL de pago en el navegador
   * @param {string} url - URL de Mercado Pago
   * @returns {Promise<boolean>} - Si se abrió correctamente
   */
  async openPaymentUrl(url) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error abriendo URL de pago:', error);
      return false;
    }
  }

  /**
   * Obtener información del trial
   * @param {{ forceRefresh?: boolean }} [opts]
   * @returns {Promise<Object>} - Información del trial
   */
  async getTrialInfo(opts = {}) {
    const forceRefresh = opts.forceRefresh === true;
    const now = Date.now();

    if (
      !forceRefresh &&
      trialInfoClientCache &&
      now < trialInfoClientCacheExpiresAt
    ) {
      return trialInfoClientCache;
    }

    if (!forceRefresh && trialInfoInFlight) {
      return trialInfoInFlight;
    }

    const request = (async () => {
      try {
        const response = await api.get(ENDPOINTS.PAYMENT_TRIAL_INFO);
        const result = {
          success: true,
          ...response,
        };
        trialInfoClientCache = result;
        trialInfoClientCacheExpiresAt = Date.now() + TRIAL_INFO_CLIENT_CACHE_MS;
        return result;
      } catch (error) {
        const isRateLimit = error?.response?.status === 429;
        if (isRateLimit && trialInfoClientCache) {
          return trialInfoClientCache;
        }
        if (!isRateLimit) {
          console.error('Error obteniendo info de trial:', error);
        }
        return {
          success: false,
          error: error.message || 'Error al obtener información del trial',
          errorCode: resolveServiceErrorCode(error, 'TRIAL_INFO_ERROR'),
          isInTrial: false,
          daysRemaining: 0,
        };
      } finally {
        trialInfoInFlight = null;
      }
    })();

    trialInfoInFlight = request;
    return request;
  }

  /**
   * Refrescar estado de suscripción tras compra o restauración (limpia caché y consulta API).
   * @param {{ validationSubscription?: object|null, maxAttempts?: number }} [opts]
   * @returns {Promise<Object>}
   */
  async refreshSubscriptionStatusAfterPayment(opts = {}) {
    const validationSubscription = opts.validationSubscription || null;
    const maxAttempts = Number.isFinite(opts.maxAttempts) ? opts.maxAttempts : 5;

    if (validationSubscription) {
      applyValidatedSubscriptionToClientCache(validationSubscription);
    } else {
      clearSubscriptionStatusClientCache();
    }
    clearTrialInfoClientCache();

    let latestStatus = null;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      latestStatus = await this.getSubscriptionStatus({ forceRefresh: true });
      if (subscriptionLooksCurrentlyUsable(latestStatus)) {
        return latestStatus;
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (validationSubscription) {
      const optimistic = mapValidatedSubscriptionToClientStatus(validationSubscription);
      if (optimistic) {
        applyValidatedSubscriptionToClientCache(validationSubscription);
        return optimistic;
      }
    }

    return (
      latestStatus || {
        success: false,
        error: 'No se pudo actualizar el estado de suscripción',
        errorCode: 'SUBSCRIPTION_STATUS_ERROR',
      }
    );
  }

  /**
   * Obtener estado de suscripción
   * @param {{ forceRefresh?: boolean }} [opts]
   * @returns {Promise<Object>} - Estado de la suscripción
   */
  async getSubscriptionStatus(opts = {}) {
    const forceRefresh = opts.forceRefresh === true;
    const now = Date.now();

    if (
      !forceRefresh &&
      subscriptionStatusClientCache &&
      now < subscriptionStatusClientCacheExpiresAt
    ) {
      return subscriptionStatusClientCache;
    }

    if (!forceRefresh && subscriptionStatusInFlight) {
      return subscriptionStatusInFlight;
    }

    const request = (async () => {
    try {
      if (forceRefresh) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem('subscription_status_cache');
        } catch (cacheError) {
          console.warn('[PaymentService] Error limpiando caché local de suscripción:', cacheError);
        }
        clearSubscriptionStatusClientCache();
      }

      const response = forceRefresh
        ? await api.get(ENDPOINTS.PAYMENT_SUBSCRIPTION_STATUS, { _t: String(Date.now()) })
        : await api.get(ENDPOINTS.PAYMENT_SUBSCRIPTION_STATUS);
      
      // Si la respuesta es 304 Not Modified, usar datos del caché local si existen
      if (response.notModified) {
        // Intentar obtener del caché local (AsyncStorage)
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const cached = await AsyncStorage.getItem('subscription_status_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const result = {
              success: true,
              ...parsed,
              fromCache: true
            };
            subscriptionStatusClientCache = result;
            subscriptionStatusClientCacheExpiresAt = Date.now() + SUBSCRIPTION_STATUS_CLIENT_CACHE_MS;
            return result;
          }
        } catch (cacheError) {
          console.warn('[PaymentService] Error leyendo caché local:', cacheError);
        }
        
        // Si no hay caché local, devolver un objeto indicando que no hay cambios
        return {
          success: true,
          notModified: true,
          message: 'Estado de suscripción no ha cambiado'
        };
      }
      
      // Guardar en caché local para futuras solicitudes 304
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('subscription_status_cache', JSON.stringify(response));
      } catch (cacheError) {
        // No es crítico si falla el guardado del caché
        console.warn('[PaymentService] Error guardando caché local:', cacheError);
      }
      
      const result = {
        success: true,
        ...response,
      };
      subscriptionStatusClientCache = result;
      subscriptionStatusClientCacheExpiresAt = Date.now() + SUBSCRIPTION_STATUS_CLIENT_CACHE_MS;
      return result;
    } catch (error) {
      console.error('Error obteniendo estado de suscripción:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estado de suscripción',
        errorCode: resolveServiceErrorCode(error, 'SUBSCRIPTION_STATUS_ERROR'),
      };
    } finally {
      subscriptionStatusInFlight = null;
    }
    })();

    if (!forceRefresh) {
      subscriptionStatusInFlight = request;
    }
    return request;
  }

  /**
   * Cancelar suscripción
   * @param {boolean} cancelImmediately - Si cancelar inmediatamente
   * @returns {Promise<Object>} - Resultado de la cancelación
   */
  async cancelSubscription(cancelImmediately = false) {
    try {
      const response = await api.post(ENDPOINTS.PAYMENT_CANCEL_SUBSCRIPTION, {
        cancelImmediately,
      });
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      const backendError =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Error al cancelar suscripción';
      return {
        success: false,
        error: backendError,
        errorCode: resolveServiceErrorCode(error, 'SUBSCRIPTION_CANCEL_ERROR'),
        code: error?.response?.data?.code || undefined,
      };
    }
  }

  /**
   * Actualizar método de pago
   * @param {string} paymentMethodId - ID del método de pago
   * @returns {Promise<Object>} - Resultado de la actualización
   */
  async updatePaymentMethod(paymentMethodId) {
    try {
      const response = await api.post(ENDPOINTS.PAYMENT_UPDATE_METHOD, {
        paymentMethodId,
      });
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Error actualizando método de pago:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar método de pago',
        errorCode: resolveServiceErrorCode(error, 'PAYMENT_METHOD_UPDATE_ERROR'),
      };
    }
  }

  /**
   * Obtener historial de transacciones
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Object>} - Historial de transacciones
   */
  async getTransactions(options = {}) {
    try {
      const { limit = 50, skip = 0, status, type } = options;
      const response = await api.get(ENDPOINTS.PAYMENT_TRANSACTIONS, {
        limit,
        skip,
        status,
        type,
      });
      return {
        success: true,
        transactions: response.transactions || [],
        count: response.count || 0,
        total: response.total || 0,
      };
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener transacciones',
        errorCode: resolveServiceErrorCode(error, 'TRANSACTIONS_FETCH_ERROR'),
        transactions: [],
      };
    }
  }

  /**
   * Obtener estadísticas de transacciones
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Object>} - Estadísticas de transacciones
   */
  async getTransactionStats(options = {}) {
    try {
      const { startDate, endDate } = options;
      const response = await api.get(ENDPOINTS.PAYMENT_TRANSACTIONS_STATS, {
        startDate,
        endDate,
      });
      return {
        success: true,
        stats: response.stats || {},
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estadísticas',
        errorCode: resolveServiceErrorCode(error, 'TRANSACTION_STATS_FETCH_ERROR'),
        stats: {},
      };
    }
  }
}

export default new PaymentService();

