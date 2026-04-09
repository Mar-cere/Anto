/**
 * Constantes para CrisisDashboardScreen y subcomponentes
 */
import { colors } from '../../styles/globalStyles';

export const TEXTS = {
  TITLE: 'Dashboard de Crisis',
  SUPPORT_TITLE: '¿Necesitas apoyo ahora?',
  SUPPORT_SUBTITLE:
    'Anto no sustituye la ayuda profesional ni los servicios de emergencia. Si estás en peligro, contacta servicios locales de urgencia.',
  SUPPORT_CONTACTS_CTA: 'Contactos de emergencia',
  SUPPORT_CONTACTS_HINT: 'En Perfil puedes revisar o añadir contactos',
  SUPPORT_CHAT_CTA: 'Hablar con Anto',
  SUPPORT_CHAT_HINT: 'Conversación de apoyo en la app',
  LOADING: 'Cargando métricas...',
  ERROR: 'No pudimos cargar las métricas. Por favor, intenta de nuevo.',
  ERROR_UNKNOWN: 'Error desconocido. Comprueba la conexión e inténtalo de nuevo.',
  DATE_UNAVAILABLE: '—',
  RETRY: 'Reintentar',
  REFRESHING: 'Actualizando...',
  SUMMARY: 'Resumen',
  /** Ventana temporal del endpoint de resumen (días) */
  SUMMARY_PERIOD_NOTE: 'Basado en los últimos 30 días',
  TRENDS: 'Tendencias Emocionales',
  TRENDS_PERIOD_HINT: 'Intensidad según el periodo seleccionado abajo',
  CRISIS_BY_MONTH: 'Crisis por Mes',
  CRISIS_BY_MONTH_PERIOD: 'Últimos 6 meses',
  EMOTION_DISTRIBUTION: 'Distribución de Emociones',
  EMOTION_DISTRIBUTION_PERIOD: 'En crisis detectadas (últimos 30 días)',
  HISTORY: 'Historial de Crisis',
  HISTORY_RECENT_NOTE: 'Últimas 5 entradas',
  TOTAL_CRISES: 'Total de Crisis',
  THIS_MONTH: 'Este Mes',
  RECENT: 'Recientes (7 días)',
  RESOLUTION_RATE: 'Tasa de Resolución',
  ALERTS_SENT: 'Alertas Enviadas',
  FOLLOWUPS_COMPLETED: 'Seguimientos Completados',
  AVERAGE_RISK: 'Riesgo Promedio',
  PERIOD_7D: '7 días',
  PERIOD_30D: '30 días',
  PERIOD_90D: '90 días',
  VIEW_ALL: 'Ver Todo',
  NO_CRISIS: 'No hay crisis registradas',
  NO_CRISIS_MESSAGE: '¡Excelente! No se han detectado crisis en este período.',
  EMPTY_TRENDS: 'No hay datos de intensidad en este periodo. Prueba otro intervalo o vuelve más adelante.',
  EMPTY_MONTHLY_CHART: 'No hay crisis agrupadas por mes en este rango.',
  EMPTY_EMOTION_DISTRIBUTION: 'No hay emociones registradas en crisis de este periodo.',
  EMPTY_HISTORY_RECENT: 'No hay entradas recientes aquí. Puedes ver el historial completo abajo.',
  LOW: 'Bajo',
  WARNING: 'Advertencia',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  TREND_IMPROVING: 'Mejorando',
  TREND_DECLINING: 'Deteriorando',
  TREND_STABLE: 'Estable',
  TREND_LABEL: 'Tendencia: ',
};

export const CHART_HEIGHT = 220;

export const CHART_CONFIG = {
  backgroundColor: '#1D2B5F',
  backgroundGradientFrom: '#1D2B5F',
  backgroundGradientTo: '#1D2B5F',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#1ADDDB',
  },
};

export const PIE_CHART_CONFIG = {
  backgroundColor: '#1D2B5F',
  backgroundGradientFrom: '#1D2B5F',
  backgroundGradientTo: '#1D2B5F',
  color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  decimalPlaces: 0,
  style: { borderRadius: 16 },
};

export const EMOTION_COLORS = {
  tristeza: '#FF6B6B',
  ansiedad: '#FFA500',
  enojo: '#FF4444',
  miedo: '#9B59B6',
  alegria: '#4ECDC4',
  esperanza: '#95E1D3',
  neutral: '#95A5A6',
  verguenza: '#E74C3C',
  culpa: '#C0392B',
};

export const RISK_LEVEL_COLORS = {
  LOW: '#4ECDC4',
  WARNING: '#FFA500',
  MEDIUM: '#FF6B6B',
  HIGH: '#E74C3C',
};

export const RISK_LEVEL_TEXTS = {
  LOW: TEXTS.LOW,
  WARNING: TEXTS.WARNING,
  MEDIUM: TEXTS.MEDIUM,
  HIGH: TEXTS.HIGH,
};

export const TREND_PERIODS = ['7d', '30d', '90d'];

/** Límite de caracteres del detalle de error en pantalla (evita textos enormes del backend). */
export const CRISIS_ERROR_DETAIL_MAX_LEN = 280;
