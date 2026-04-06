/**
 * Consulta REST a Mercado Pago (v1/payments) para validar montos en webhooks.
 */
import logger from './logger.js';

/**
 * @param {string} paymentId
 * @returns {Promise<{ id: string, status: string, transaction_amount: number, currency_id?: string } | null>}
 */
export async function fetchMercadoPagoPaymentById(paymentId) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || !paymentId) {
    return null;
  }

  try {
    const url = `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      logger.warn('[MercadoPagoPaymentApi] Error HTTP obteniendo pago', {
        paymentId,
        status: res.status
      });
      return null;
    }

    const data = await res.json();
    return {
      id: String(data.id),
      status: data.status,
      transaction_amount: typeof data.transaction_amount === 'number' ? data.transaction_amount : parseFloat(data.transaction_amount),
      currency_id: data.currency_id
    };
  } catch (err) {
    logger.error('[MercadoPagoPaymentApi] Fallo fetch pago', {
      paymentId,
      error: err.message
    });
    return null;
  }
}
