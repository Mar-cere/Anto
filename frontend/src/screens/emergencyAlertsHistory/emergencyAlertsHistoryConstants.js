/**
 * Constantes para EmergencyAlertsHistoryScreen
 */
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const CHART_WIDTH = width - 40;
export const CHART_HEIGHT = 220;

export const FLATLIST = {
  INITIAL_NUM_TO_RENDER: 10,
  WINDOW_SIZE: 10,
  MAX_TO_RENDER_PER_BATCH: 10,
};

export const TEXTS = {
  TITLE: 'Historial de Alertas',
  LOADING: 'Cargando historial...',
  ERROR: 'No pudimos cargar el historial. Por favor, intenta de nuevo.',
  RETRY: 'Reintentar',
  NO_ALERTS: 'No hay alertas registradas',
  NO_ALERTS_MESSAGE: 'Aún no se han enviado alertas a tus contactos de emergencia.',
  CONFIGURE_CONTACTS: 'Configurar contactos de emergencia',
  STATISTICS: 'Estadísticas',
  PATTERNS: 'Patrones Detectados',
  HISTORY: 'Historial',
  TAB_HISTORY: 'Historial',
  TAB_STATS: 'Estadísticas',
  TAB_PATTERNS: 'Patrones',
  TOTAL_ALERTS: 'Total de Alertas',
  BY_RISK_LEVEL: 'Por Nivel de Riesgo',
  BY_STATUS: 'Por Estado',
  BY_CHANNEL: 'Por Canal',
  BY_CONTACT: 'Por Contacto',
  BY_DAY: 'Por Día',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  SENT: 'Enviada',
  PARTIAL: 'Parcial',
  FAILED: 'Fallida',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  DATE: 'Fecha',
  CONTACT: 'Contacto',
  RISK_LEVEL: 'Nivel de Riesgo',
  STATUS: 'Estado',
  CHANNELS: 'Canales',
  TEST_ALERT: 'Alerta de Prueba',
  REAL_ALERT: 'Alerta Real',
  FREQUENCY: 'Frecuencia',
  RISK_TREND: 'Tendencia de Riesgo',
  TIME_PATTERNS: 'Patrones Temporales',
  CONTACT_RELIABILITY: 'Confiabilidad de Contactos',
  RECOMMENDATIONS: 'Recomendaciones',
  INCREASING: 'Aumentando',
  DECREASING: 'Disminuyendo',
  STABLE: 'Estable',
  ESCALATING: 'Escalando',
  IMPROVING: 'Mejorando',
  MOST_COMMON_DAYS: 'Días Más Comunes',
  MOST_COMMON_HOURS: 'Horas Más Comunes',
  WEEKEND: 'Fin de Semana',
  WEEKDAY: 'Día de Semana',
  SUCCESS_RATE: 'Tasa de Éxito',
  TOTAL: 'Total',
  SUCCESSFUL: 'Exitosas',
  FAILED_LABEL: 'Fallidas',
  NO_CHANNELS: 'Ningún canal exitoso',
};

export const CHART_CONFIG = {
  backgroundColor: '#1D2B5F',
  backgroundGradientFrom: '#1D2B5F',
  backgroundGradientTo: '#1D2B5F',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: '#1ADDDB' },
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

export const TABS = {
  HISTORY: 'history',
  STATS: 'stats',
  PATTERNS: 'patterns',
};

export const STATUS_COLORS = {
  sent: '#4ECDC4',
  partial: '#FFA500',
  failed: '#FF6B6B',
};

export const RISK_COLORS = {
  MEDIUM: '#FFA500',
  HIGH: '#FF6B6B',
};
