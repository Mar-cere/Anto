/**
 * Mensajes de API de métricas (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    notAuthenticated: 'Usuario no autenticado',
    adminDenied: 'Acceso denegado. Se requiere rol de administrador.',
    systemMetricsError: 'Error al obtener métricas del sistema',
    healthStatsError: 'Error al obtener estadísticas de salud',
    invalidData: 'Datos inválidos',
    recordMetricError: 'Error al registrar métrica',
    userMetricsError: 'Error al obtener métricas del usuario',
    metricsByTypeError: 'Error al obtener métricas por tipo',
  },
  en: {
    notAuthenticated: 'User not authenticated',
    adminDenied: 'Access denied. Administrator role required.',
    systemMetricsError: 'Could not load system metrics',
    healthStatsError: 'Could not load health statistics',
    invalidData: 'Invalid data',
    recordMetricError: 'Could not record metric',
    userMetricsError: 'Could not load user metrics',
    metricsByTypeError: 'Could not load metrics by type',
  },
};

export function metricsApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
