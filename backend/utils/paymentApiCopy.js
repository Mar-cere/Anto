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
    cancelNotFound: 'No encontramos una suscripción de pago activa para cancelar.',
    cancelTrialNoPaid:
      'Estás en el periodo de prueba. No hay una suscripción de pago que cancelar; el acceso termina automáticamente al finalizar la prueba.',
    cancelViaAppStore:
      'Tu suscripción se gestiona con App Store. Cancélala desde Ajustes de Apple > tu nombre > Suscripciones.',
    cancelNotCancellable:
      'No se puede cancelar esta suscripción desde la app. Si pagaste con App Store, adminístrala desde tu cuenta de Apple.',
    paymentMethodError: 'Error al actualizar método de pago',
    transactionsError: 'Error al obtener transacciones',
    statsError: 'Error al obtener estadísticas',
    receiptRestored: 'Compras restauradas correctamente',
    receiptActivated: 'Suscripción activada correctamente',
    appleOwnershipConflict:
      'Esta compra de Apple ya está vinculada a otra cuenta de Anto. Inicia sesión con esa cuenta o contacta soporte.',
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
    cancelNotFound: 'We could not find an active paid subscription to cancel.',
    cancelTrialNoPaid:
      'You are on a free trial. There is no paid subscription to cancel; access ends automatically when the trial finishes.',
    cancelViaAppStore:
      'Your subscription is managed by the App Store. Cancel it in Apple Settings > your name > Subscriptions.',
    cancelNotCancellable:
      'This subscription cannot be cancelled from the app. If you paid with the App Store, manage it from your Apple account.',
    paymentMethodError: 'Could not update payment method',
    transactionsError: 'Could not load transactions',
    statsError: 'Could not load statistics',
    receiptRestored: 'Purchases restored successfully',
    receiptActivated: 'Subscription activated successfully',
    appleOwnershipConflict:
      'This Apple purchase is already linked to another Anto account. Sign in with that account or contact support.',
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
