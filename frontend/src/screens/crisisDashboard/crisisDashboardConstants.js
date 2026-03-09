/**
 * Constantes para CrisisDashboardScreen y subcomponentes
 */
import { colors } from '../../styles/globalStyles';

export const TEXTS = {
  TITLE: 'Dashboard de Crisis',
  LOADING: 'Cargando métricas...',
  ERROR: 'No pudimos cargar las métricas. Por favor, intenta de nuevo.',
  RETRY: 'Reintentar',
  REFRESHING: 'Actualizando...',
  SUMMARY: 'Resumen',
  TRENDS: 'Tendencias Emocionales',
  CRISIS_BY_MONTH: 'Crisis por Mes',
  EMOTION_DISTRIBUTION: 'Distribución de Emociones',
  HISTORY: 'Historial de Crisis',
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
