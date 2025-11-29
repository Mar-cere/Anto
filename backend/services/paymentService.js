/**
 * Servicio de Pagos
 * 
 * Gestiona todas las operaciones relacionadas con pagos usando Mercado Pago.
 * 
 * @author AntoApp Team
 */

import paymentServiceMercadoPago from './paymentServiceMercadoPago.js';
import { isMercadoPagoConfigured } from '../config/mercadopago.js';
import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

class PaymentService {
  /**
   * Crear sesión de checkout para suscripción
   * @param {string} userId - ID del usuario
   * @param {string} plan - Plan seleccionado ('monthly' o 'yearly')
   * @param {string} successUrl - URL de éxito
   * @param {string} cancelUrl - URL de cancelación
   * @returns {Promise<Object>} - Sesión de checkout
   */
  async createCheckoutSession(userId, plan, successUrl = null, cancelUrl = null) {
    if (!isMercadoPagoConfigured()) {
      throw new Error('Mercado Pago no está configurado correctamente');
    }

    return await paymentServiceMercadoPago.createCheckoutSession(userId, plan, successUrl, cancelUrl);
  }

  /**
   * Cancelar suscripción
   * @param {string} userId - ID del usuario
   * @param {boolean} cancelImmediately - Si cancelar inmediatamente o al final del período
   * @returns {Promise<Object>} - Suscripción cancelada
   */
  async cancelSubscription(userId, cancelImmediately = false) {
    return await paymentServiceMercadoPago.cancelSubscription(userId, cancelImmediately);
  }

  /**
   * Actualizar método de pago
   * @param {string} userId - ID del usuario
   * @param {string} cardToken - Nuevo token de tarjeta
   * @returns {Promise<Object>} - Resultado de la actualización
   */
  async updatePaymentMethod(userId, cardToken) {
    return await paymentServiceMercadoPago.updatePaymentMethod(userId, cardToken);
  }

  /**
   * Obtener estado de suscripción
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Estado de la suscripción
   */
  async getSubscriptionStatus(userId) {
    return await paymentServiceMercadoPago.getSubscriptionStatus(userId);
  }

  /**
   * Procesar webhook de Mercado Pago
   * @param {Object} payload - Payload del webhook
   * @param {string} signature - Firma del webhook (opcional)
   * @returns {Promise<Object>} - Evento procesado
   */
  async handleWebhook(payload, signature = null) {
    if (!isMercadoPagoConfigured()) {
      throw new Error('Mercado Pago no está configurado correctamente');
    }

    return await paymentServiceMercadoPago.handleWebhook(payload, signature);
  }
}

export default new PaymentService();
