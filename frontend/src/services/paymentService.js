/**
 * Servicio de Pagos
 * 
 * Gestiona todas las operaciones relacionadas con pagos y suscripciones
 * usando Mercado Pago.
 * 
 * @author AntoApp Team
 */

import { api, ENDPOINTS } from '../config/api';
import { Linking } from 'react-native';

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
   * @param {string} plan - Plan seleccionado ('weekly', 'monthly', 'quarterly', 'semestral', 'yearly')
   * @param {string} successUrl - URL de éxito (opcional)
   * @param {string} cancelUrl - URL de cancelación (opcional)
   * @returns {Promise<Object>} - Sesión de checkout
   */
  async createCheckoutSession(plan, successUrl = null, cancelUrl = null) {
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

