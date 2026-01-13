/**
 * Servicio de Pagos
 * 
 * Gestiona todas las operaciones relacionadas con pagos y suscripciones
 * usando StoreKit en iOS y Mercado Pago en Android.
 * 
 * @author AntoApp Team
 */

import { Platform } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { Linking } from 'react-native';
import storeKitService from './storeKitService';

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
      };
    }
  }

  /**
   * Crear sesión de checkout
   * En iOS usa StoreKit, en Android usa Mercado Pago
   * @param {string} plan - Plan seleccionado ('weekly', 'monthly', 'quarterly', 'semestral', 'yearly')
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
      };
    }

    // Función para validar el recibo con el backend
    const validateReceipt = async (receiptData) => {
      try {
        // Validar que receiptData tenga los datos necesarios
        if (!receiptData || !receiptData.transactionReceipt) {
          return {
            success: false,
            error: 'Datos de recibo incompletos',
          };
        }
        
        // Validar que receiptData tenga todos los campos necesarios
        if (!receiptData.transactionReceipt) {
          return {
            success: false,
            error: 'Datos de recibo incompletos: falta transactionReceipt',
          };
        }

        if (!receiptData.productId) {
          return {
            success: false,
            error: 'Datos de recibo incompletos: falta productId',
          };
        }

        const payload = {
          receipt: receiptData.transactionReceipt,
          productId: receiptData.productId,
        };

        // Agregar campos opcionales solo si existen
        if (receiptData.transactionId) {
          payload.transactionId = receiptData.transactionId;
        }
        if (receiptData.originalTransactionIdentifierIOS) {
          payload.originalTransactionIdentifierIOS = receiptData.originalTransactionIdentifierIOS;
        }

        const response = await api.post(ENDPOINTS.PAYMENT_VALIDATE_RECEIPT, payload);

        // Validar que la respuesta sea válida
        if (!response || typeof response !== 'object') {
          console.error('[PaymentService] Respuesta inválida de validación:', response);
          return {
            success: false,
            error: 'No se recibió respuesta válida del servidor',
          };
        }

        // Validar que response tenga la propiedad success
        if (typeof response.success !== 'boolean') {
          console.error('[PaymentService] Respuesta sin propiedad success:', response);
          return {
            success: false,
            error: response.error || 'Respuesta inválida del servidor',
          };
        }

        return {
          success: response.success,
          error: response.error || null,
          subscription: response.subscription || null,
        };
      } catch (error) {
        console.error('Error validando recibo:', error);
        return {
          success: false,
          error: error?.message || error?.response?.data?.error || 'Error al validar la compra',
        };
      }
    };

    return await storeKitService.purchaseSubscription(plan, validateReceipt);
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
        purchases: [],
      };
    }

    const result = await storeKitService.restorePurchases();
    
    if (result.success && result.purchases && result.purchases.length > 0) {
      // Validar cada compra con el backend
      const validationPromises = result.purchases
        .filter(p => p && p.transactionReceipt && p.productId) // Filtrar compras válidas
        .map(async (purchase) => {
          try {
            const response = await api.post(ENDPOINTS.PAYMENT_VALIDATE_RECEIPT, {
              receipt: purchase.transactionReceipt,
              productId: purchase.productId,
              transactionId: purchase.transactionId || null,
              originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS || null,
              restore: true,
            });
            
            return {
              success: true,
              purchase,
              validation: response,
            };
          } catch (error) {
            console.error('[PaymentService] Error validando compra restaurada:', error);
            return {
              success: false,
              purchase,
              error: error?.message || error?.response?.data?.error || 'Error al validar compra',
            };
          }
        });

      // Esperar a que todas las validaciones terminen
      const validationResults = await Promise.all(validationPromises);
      
      // Contar validaciones exitosas
      const successfulValidations = validationResults.filter(r => r.success).length;
      
      console.log('[PaymentService] Validaciones de compras restauradas:', {
        total: validationResults.length,
        successful: successfulValidations,
        failed: validationResults.length - successfulValidations,
      });

      // Si todas las validaciones fallaron, retornar error
      if (successfulValidations === 0 && validationResults.length > 0) {
        return {
          success: false,
          error: 'No se pudieron validar las compras restauradas con el servidor',
          purchases: result.purchases,
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
   * @returns {Promise<Object>} - Información del trial
   */
  async getTrialInfo() {
    try {
      const response = await api.get(ENDPOINTS.PAYMENT_TRIAL_INFO);
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Error obteniendo info de trial:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener información del trial',
        isInTrial: false,
        daysRemaining: 0,
      };
    }
  }

  /**
   * Obtener estado de suscripción
   * @returns {Promise<Object>} - Estado de la suscripción
   */
  async getSubscriptionStatus() {
    try {
      const response = await api.get(ENDPOINTS.PAYMENT_SUBSCRIPTION_STATUS);
      
      // Si la respuesta es 304 Not Modified, usar datos del caché local si existen
      if (response.notModified) {
        // Intentar obtener del caché local (AsyncStorage)
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const cached = await AsyncStorage.getItem('subscription_status_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            return {
              success: true,
              ...parsed,
              fromCache: true
            };
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
      
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('Error obteniendo estado de suscripción:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estado de suscripción',
      };
    }
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
      return {
        success: false,
        error: error.message || 'Error al cancelar suscripción',
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
        stats: {},
      };
    }
  }
}

export default new PaymentService();

