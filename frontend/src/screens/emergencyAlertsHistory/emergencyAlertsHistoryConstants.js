/**
 * Constantes para EmergencyAlertsHistoryScreen
 */
import { Dimensions } from 'react-native';
import { lightColors } from '../../styles/themePalettes';

const { width } = Dimensions.get('window');

function rgbaFromHex(hex, alpha = 1) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.min(1, Math.max(0, Number(alpha) === Number(alpha) ? alpha : 1));
  return `rgba(${r},${g},${b},${a})`;
}

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
  ERROR_UNKNOWN: 'Error desconocido. Comprueba la conexión e inténtalo de nuevo.',
  DATE_UNAVAILABLE: '—',
  TAB_STATS_FAILED: 'No pudimos cargar las estadísticas.',
  TAB_PATTERNS_FAILED: 'No pudimos cargar los patrones.',
  RETRY_SECTION: 'Reintentar esta sección',
  SUMMARY_HINT_WITH_STATS:
    'El total corresponde a los últimos 30 días. La lista muestra hasta 100 alertas más recientes.',
  SUMMARY_HINT_LIST_ONLY:
    'Lista de hasta 100 alertas recientes. No se pudieron cargar las estadísticas de 30 días.',
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
  TAB_ERROR_HINT: 'Esta sección no cargó. Ábrela y pulsa reintentar.',
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
  /** Pestaña Estadísticas: mismo periodo que el endpoint (30 días). */
  STATS_TAB_SUMMARY_HINT:
    'Período: últimos 30 días. Solo alertas reales (las de prueba no cuentan).',
  STATS_TAB_EMPTY_TITLE: 'Sin datos para gráficos',
  STATS_TAB_EMPTY_MESSAGE:
    'En este periodo no hay alertas registradas. Cuando se envíen, verás aquí el desglose por riesgo, estado, canal y día.',
  /** Pestaña Patrones: mismo periodo que el endpoint (90 días). */
  PATTERNS_TAB_SUMMARY_TITLE: 'Alertas analizadas',
  PATTERNS_TAB_SUMMARY_HINT:
    'Periodo: últimos 90 días. Solo alertas reales (las de prueba no cuentan).',
  PATTERNS_TAB_EMPTY_TITLE: 'Datos insuficientes para patrones',
  PATTERNS_TAB_EMPTY_MESSAGE:
    'Se necesitan al menos 2 alertas en este periodo para comparar tendencias (frecuencia, riesgo y horarios). Si aparece un aviso abajo, también te orienta.',
  PATTERNS_WEEKEND_VS_WEEKDAY: 'Fin de semana vs días laborables',
};

export function createEmergencyChartConfig(colors) {
  const surface = colors.surface ?? colors.cardBackground ?? colors.background;
  return {
    backgroundColor: surface,
    backgroundGradientFrom: surface,
    backgroundGradientTo: surface,
    decimalPlaces: 0,
    color: (opacity = 1) => rgbaFromHex(colors.primary, opacity),
    labelColor: (opacity = 1) => rgbaFromHex(colors.text, opacity),
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: colors.primary },
  };
}

export function createEmergencyPieChartConfig(colors) {
  const surface = colors.surface ?? colors.cardBackground ?? colors.background;
  return {
    backgroundColor: surface,
    backgroundGradientFrom: surface,
    backgroundGradientTo: surface,
    color: (opacity = 1) => rgbaFromHex(colors.primary, opacity),
    labelColor: (opacity = 1) => rgbaFromHex(colors.text, opacity),
    decimalPlaces: 0,
    style: { borderRadius: 16 },
  };
}

/** Compatibilidad: tema claro de paleta. */
export const CHART_CONFIG = createEmergencyChartConfig(lightColors);
export const PIE_CHART_CONFIG = createEmergencyPieChartConfig(lightColors);

export const TABS = {
  HISTORY: 'history',
  STATS: 'stats',
  PATTERNS: 'patterns',
};

/** Límite de caracteres del detalle en pantalla de error global. */
export const EMERGENCY_ERROR_DETAIL_MAX_LEN = 280;

export function createStatusColors(colors) {
  return {
    sent: colors.success,
    partial: colors.warning,
    failed: colors.error,
  };
}

export function createRiskColors(colors) {
  return {
    MEDIUM: colors.warning,
    HIGH: colors.error,
  };
}

export const STATUS_COLORS = createStatusColors(lightColors);
export const RISK_COLORS = createRiskColors(lightColors);
