/**
 * Consulta REST a Mercado Pago (v1/payments) para validar montos en webhooks.
 */
import logger from './logger.js';

/**
 * @param {string} paymentId
 * @returns {Promise<{
 *   id: string,
 *   status: string,
 *   transaction_amount: number,
 *   currency_id?: string,
 *   preference_id?: string|null,
 *   preapproval_id?: string|null,
 *   preapproval_plan_id?: string|null,
 *   payer?: { email?: string|null }|null,
 *   external_reference?: string|null,
 * } | null>}
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
    const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
    return {
      id: String(data.id),
      status: data.status,
      transaction_amount:
        typeof data.transaction_amount === 'number'
          ? data.transaction_amount
          : parseFloat(data.transaction_amount),
      currency_id: data.currency_id,
      preference_id: data.preference_id || metadata.preference_id || null,
      preapproval_id:
        data.preapproval_id || metadata.preapproval_id || data.point_of_interaction?.transaction_data?.subscription_id || null,
      preapproval_plan_id: data.preapproval_plan_id || metadata.preapproval_plan_id || null,
      payer: data.payer ? { email: data.payer.email || null } : null,
      external_reference: data.external_reference || metadata.external_reference || null,
    };
  } catch (err) {
    logger.error('[MercadoPagoPaymentApi] Fallo fetch pago', {
      paymentId,
      error: err.message
    });
    return null;
  }
}

/**
 * @param {string} preapprovalId
 * @returns {Promise<{ id: string, status?: string, payer_email?: string, preapproval_plan_id?: string } | null>}
 */
export async function fetchMercadoPagoPreapprovalById(preapprovalId) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || !preapprovalId) {
    return null;
  }

  try {
    const url = `https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      logger.warn('[MercadoPagoPaymentApi] Error HTTP obteniendo preapproval', {
        preapprovalId,
        status: res.status,
      });
      return null;
    }

    const data = await res.json();
    return {
      id: String(data.id),
      status: data.status,
      payer_email: data.payer_email || data.payer?.email || null,
      preapproval_plan_id: data.preapproval_plan_id || null,
    };
  } catch (err) {
    logger.error('[MercadoPagoPaymentApi] Fallo fetch preapproval', {
      preapprovalId,
      error: err.message,
    });
    return null;
  }
}
