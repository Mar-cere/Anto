/**
 * Mensajes de API de engagement de notificaciones (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitUpdate:
      'Demasiadas actualizaciones. Por favor, intente más tarde.',
    engagementStatsError: 'Error obteniendo estadísticas de engagement',
    overallStatsError: 'Error obteniendo estadísticas generales',
    historyError: 'Error obteniendo historial de notificaciones',
    invalidStatus: 'Estado inválido',
    notificationNotFound: 'Notificación no encontrada',
    updateStatusError: 'Error actualizando estado de notificación',
  },
  en: {
    rateLimitUpdate: 'Too many updates. Please try again later.',
    engagementStatsError: 'Could not load engagement statistics',
    overallStatsError: 'Could not load overall statistics',
    historyError: 'Could not load notification history',
    invalidStatus: 'Invalid status',
    notificationNotFound: 'Notification not found',
    updateStatusError: 'Could not update notification status',
  },
};

export function notificationEngagementApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
