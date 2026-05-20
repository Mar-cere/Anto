/**
 * Mensajes de API de pagos y suscripción (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitCheckout: 'Demasiados intentos de checkout. Por favor, intente más tarde.',
    rateLimitPayment: 'Demasiadas operaciones de pago. Por favor, intente más tarde.',
    rateLimitWebhook: 'Demasiadas solicitudes de webhook',
    plansError: 'Error al obtener planes',
    invalidData: 'Datos inválidos',
    checkoutError: 'Error al crear sesión de checkout',
    trialError: 'Error al obtener información del trial',
    subscriptionStatusError: 'Error al obtener estado de suscripción',
    cancelError: 'Error al cancelar suscripción',
    paymentMethodError: 'Error al actualizar método de pago',
    transactionsError: 'Error al obtener transacciones',
    statsError: 'Error al obtener estadísticas',
    receiptRestored: 'Compras restauradas correctamente',
    receiptActivated: 'Suscripción activada correctamente',
    validateReceiptError: 'Error al validar el recibo',
    webhookInternalError: 'Error interno',
    webhookInvalidStructure: 'Invalid webhook structure',
    notAuthenticated: 'Usuario no autenticado',
    adminDenied: 'Acceso denegado. Se requiere rol de administrador.',
    paymentMetricsError: 'Error al obtener métricas de pagos',
    unactivatedPaymentsError: 'Error al obtener pagos no activados',
    recentUnactivatedIssue: (count) =>
      `${count} pago(s) completado(s) en las últimas 24h sin activar suscripción`,
    noPaymentActivity: 'No hay actividad reciente en el sistema de pagos',
    paymentHealthCheckError: 'Error al verificar salud del sistema',
    paymentIntegrityError: 'Error al obtener integridad de pagos',
    activateSubscriptionError: 'Error al activar suscripción',
    processUnactivatedError: 'Error al procesar pagos no activados',
  },
  en: {
    rateLimitCheckout: 'Too many checkout attempts. Please try again later.',
    rateLimitPayment: 'Too many payment operations. Please try again later.',
    rateLimitWebhook: 'Too many webhook requests',
    plansError: 'Could not load plans',
    invalidData: 'Invalid data',
    checkoutError: 'Could not create checkout session',
    trialError: 'Could not load trial information',
    subscriptionStatusError: 'Could not load subscription status',
    cancelError: 'Could not cancel subscription',
    paymentMethodError: 'Could not update payment method',
    transactionsError: 'Could not load transactions',
    statsError: 'Could not load statistics',
    receiptRestored: 'Purchases restored successfully',
    receiptActivated: 'Subscription activated successfully',
    validateReceiptError: 'Could not validate receipt',
    webhookInternalError: 'Internal error',
    webhookInvalidStructure: 'Invalid webhook structure',
    notAuthenticated: 'User not authenticated',
    adminDenied: 'Access denied. Administrator role required.',
    paymentMetricsError: 'Could not load payment metrics',
    unactivatedPaymentsError: 'Could not load unactivated payments',
    recentUnactivatedIssue: (count) =>
      `${count} payment(s) completed in the last 24h without activating subscription`,
    noPaymentActivity: 'No recent activity in the payment system',
    paymentHealthCheckError: 'Could not verify system health',
    paymentIntegrityError: 'Could not load payment integrity',
    activateSubscriptionError: 'Could not activate subscription',
    processUnactivatedError: 'Could not process unactivated payments',
  },
};

export function paymentApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
