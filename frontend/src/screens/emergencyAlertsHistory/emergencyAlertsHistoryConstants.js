/**
 * Constantes para EmergencyAlertsHistoryScreen
 */
import { Dimensions } from 'react-native';
import { useMemo } from 'react';
import { useSectionTranslations } from '../../hooks/useTranslations';
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
  TAB_A11Y_MORE_THAN_99_ALERTS: 'más de 99 alertas',
  TAB_A11Y_ONE_ALERT: 'una alerta',
  TAB_A11Y_ZERO_ALERTS: 'sin alertas',
  TAB_A11Y_ALERTS_SUFFIX: '{count} alertas',
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
  ALERTS_LABEL: 'alertas',
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

export function useEmergencyAlertsHistoryTexts() {
  const translated = useSectionTranslations('PROFILE');
  return useMemo(
    () => ({
      ...TEXTS,
      TITLE: translated?.EMERGENCY_ALERTS_TITLE || TEXTS.TITLE,
      LOADING: translated?.EMERGENCY_ALERTS_LOADING || TEXTS.LOADING,
      ERROR: translated?.EMERGENCY_ALERTS_ERROR || TEXTS.ERROR,
      ERROR_UNKNOWN:
        translated?.EMERGENCY_ALERTS_ERROR_UNKNOWN || TEXTS.ERROR_UNKNOWN,
      DATE_UNAVAILABLE:
        translated?.EMERGENCY_ALERTS_DATE_UNAVAILABLE || TEXTS.DATE_UNAVAILABLE,
      TAB_STATS_FAILED:
        translated?.EMERGENCY_ALERTS_TAB_STATS_FAILED || TEXTS.TAB_STATS_FAILED,
      TAB_PATTERNS_FAILED:
        translated?.EMERGENCY_ALERTS_TAB_PATTERNS_FAILED ||
        TEXTS.TAB_PATTERNS_FAILED,
      RETRY_SECTION:
        translated?.EMERGENCY_ALERTS_RETRY_SECTION || TEXTS.RETRY_SECTION,
      SUMMARY_HINT_WITH_STATS:
        translated?.EMERGENCY_ALERTS_SUMMARY_HINT_WITH_STATS ||
        TEXTS.SUMMARY_HINT_WITH_STATS,
      SUMMARY_HINT_LIST_ONLY:
        translated?.EMERGENCY_ALERTS_SUMMARY_HINT_LIST_ONLY ||
        TEXTS.SUMMARY_HINT_LIST_ONLY,
      RETRY: translated?.EMERGENCY_ALERTS_RETRY || TEXTS.RETRY,
      NO_ALERTS: translated?.EMERGENCY_ALERTS_EMPTY_TITLE || TEXTS.NO_ALERTS,
      NO_ALERTS_MESSAGE:
        translated?.EMERGENCY_ALERTS_EMPTY_MESSAGE || TEXTS.NO_ALERTS_MESSAGE,
      CONFIGURE_CONTACTS:
        translated?.EMERGENCY_ALERTS_CONFIGURE_CONTACTS ||
        TEXTS.CONFIGURE_CONTACTS,
      TAB_HISTORY:
        translated?.EMERGENCY_ALERTS_TAB_HISTORY || TEXTS.TAB_HISTORY,
      TAB_STATS: translated?.EMERGENCY_ALERTS_TAB_STATS || TEXTS.TAB_STATS,
      TAB_PATTERNS:
        translated?.EMERGENCY_ALERTS_TAB_PATTERNS || TEXTS.TAB_PATTERNS,
      TAB_ERROR_HINT:
        translated?.EMERGENCY_ALERTS_TAB_ERROR_HINT || TEXTS.TAB_ERROR_HINT,
      TAB_A11Y_MORE_THAN_99_ALERTS:
        translated?.EMERGENCY_ALERTS_TAB_A11Y_MORE_THAN_99_ALERTS ||
        TEXTS.TAB_A11Y_MORE_THAN_99_ALERTS,
      TAB_A11Y_ONE_ALERT:
        translated?.EMERGENCY_ALERTS_TAB_A11Y_ONE_ALERT ||
        TEXTS.TAB_A11Y_ONE_ALERT,
      TAB_A11Y_ZERO_ALERTS:
        translated?.EMERGENCY_ALERTS_TAB_A11Y_ZERO_ALERTS ||
        TEXTS.TAB_A11Y_ZERO_ALERTS,
      TAB_A11Y_ALERTS_SUFFIX:
        translated?.EMERGENCY_ALERTS_TAB_A11Y_ALERTS_SUFFIX ||
        TEXTS.TAB_A11Y_ALERTS_SUFFIX,
      TOTAL_ALERTS:
        translated?.EMERGENCY_ALERTS_TOTAL_ALERTS || TEXTS.TOTAL_ALERTS,
      BY_RISK_LEVEL:
        translated?.EMERGENCY_ALERTS_BY_RISK_LEVEL || TEXTS.BY_RISK_LEVEL,
      BY_STATUS: translated?.EMERGENCY_ALERTS_BY_STATUS || TEXTS.BY_STATUS,
      BY_CHANNEL: translated?.EMERGENCY_ALERTS_BY_CHANNEL || TEXTS.BY_CHANNEL,
      BY_CONTACT: translated?.EMERGENCY_ALERTS_BY_CONTACT || TEXTS.BY_CONTACT,
      BY_DAY: translated?.EMERGENCY_ALERTS_BY_DAY || TEXTS.BY_DAY,
      MEDIUM: translated?.EMERGENCY_ALERTS_MEDIUM || TEXTS.MEDIUM,
      HIGH: translated?.EMERGENCY_ALERTS_HIGH || TEXTS.HIGH,
      SENT: translated?.EMERGENCY_ALERTS_SENT || TEXTS.SENT,
      PARTIAL: translated?.EMERGENCY_ALERTS_PARTIAL || TEXTS.PARTIAL,
      FAILED: translated?.EMERGENCY_ALERTS_FAILED || TEXTS.FAILED,
      EMAIL: translated?.EMERGENCY_ALERTS_EMAIL || TEXTS.EMAIL,
      WHATSAPP: translated?.EMERGENCY_ALERTS_WHATSAPP || TEXTS.WHATSAPP,
      CONTACT: translated?.EMERGENCY_ALERTS_CONTACT || TEXTS.CONTACT,
      RISK_LEVEL:
        translated?.EMERGENCY_ALERTS_RISK_LEVEL || TEXTS.RISK_LEVEL,
      CHANNELS: translated?.EMERGENCY_ALERTS_CHANNELS || TEXTS.CHANNELS,
      TEST_ALERT:
        translated?.EMERGENCY_ALERTS_TEST_ALERT || TEXTS.TEST_ALERT,
      FREQUENCY: translated?.EMERGENCY_ALERTS_FREQUENCY || TEXTS.FREQUENCY,
      RISK_TREND:
        translated?.EMERGENCY_ALERTS_RISK_TREND || TEXTS.RISK_TREND,
      TIME_PATTERNS:
        translated?.EMERGENCY_ALERTS_TIME_PATTERNS || TEXTS.TIME_PATTERNS,
      CONTACT_RELIABILITY:
        translated?.EMERGENCY_ALERTS_CONTACT_RELIABILITY ||
        TEXTS.CONTACT_RELIABILITY,
      RECOMMENDATIONS:
        translated?.EMERGENCY_ALERTS_RECOMMENDATIONS || TEXTS.RECOMMENDATIONS,
      INCREASING:
        translated?.EMERGENCY_ALERTS_INCREASING || TEXTS.INCREASING,
      DECREASING:
        translated?.EMERGENCY_ALERTS_DECREASING || TEXTS.DECREASING,
      STABLE: translated?.EMERGENCY_ALERTS_STABLE || TEXTS.STABLE,
      ESCALATING:
        translated?.EMERGENCY_ALERTS_ESCALATING || TEXTS.ESCALATING,
      IMPROVING:
        translated?.EMERGENCY_ALERTS_IMPROVING || TEXTS.IMPROVING,
      MOST_COMMON_DAYS:
        translated?.EMERGENCY_ALERTS_MOST_COMMON_DAYS ||
        TEXTS.MOST_COMMON_DAYS,
      MOST_COMMON_HOURS:
        translated?.EMERGENCY_ALERTS_MOST_COMMON_HOURS ||
        TEXTS.MOST_COMMON_HOURS,
      WEEKEND: translated?.EMERGENCY_ALERTS_WEEKEND || TEXTS.WEEKEND,
      WEEKDAY: translated?.EMERGENCY_ALERTS_WEEKDAY || TEXTS.WEEKDAY,
      SUCCESS_RATE:
        translated?.EMERGENCY_ALERTS_SUCCESS_RATE || TEXTS.SUCCESS_RATE,
      TOTAL: translated?.EMERGENCY_ALERTS_TOTAL || TEXTS.TOTAL,
      SUCCESSFUL:
        translated?.EMERGENCY_ALERTS_SUCCESSFUL || TEXTS.SUCCESSFUL,
      FAILED_LABEL:
        translated?.EMERGENCY_ALERTS_FAILED_LABEL || TEXTS.FAILED_LABEL,
      ALERTS_LABEL:
        translated?.EMERGENCY_ALERTS_ALERTS_LABEL || TEXTS.ALERTS_LABEL,
      NO_CHANNELS:
        translated?.EMERGENCY_ALERTS_NO_CHANNELS || TEXTS.NO_CHANNELS,
      STATS_TAB_SUMMARY_HINT:
        translated?.EMERGENCY_ALERTS_STATS_SUMMARY_HINT ||
        TEXTS.STATS_TAB_SUMMARY_HINT,
      STATS_TAB_EMPTY_TITLE:
        translated?.EMERGENCY_ALERTS_STATS_EMPTY_TITLE ||
        TEXTS.STATS_TAB_EMPTY_TITLE,
      STATS_TAB_EMPTY_MESSAGE:
        translated?.EMERGENCY_ALERTS_STATS_EMPTY_MESSAGE ||
        TEXTS.STATS_TAB_EMPTY_MESSAGE,
      PATTERNS_TAB_SUMMARY_TITLE:
        translated?.EMERGENCY_ALERTS_PATTERNS_SUMMARY_TITLE ||
        TEXTS.PATTERNS_TAB_SUMMARY_TITLE,
      PATTERNS_TAB_SUMMARY_HINT:
        translated?.EMERGENCY_ALERTS_PATTERNS_SUMMARY_HINT ||
        TEXTS.PATTERNS_TAB_SUMMARY_HINT,
      PATTERNS_TAB_EMPTY_TITLE:
        translated?.EMERGENCY_ALERTS_PATTERNS_EMPTY_TITLE ||
        TEXTS.PATTERNS_TAB_EMPTY_TITLE,
      PATTERNS_TAB_EMPTY_MESSAGE:
        translated?.EMERGENCY_ALERTS_PATTERNS_EMPTY_MESSAGE ||
        TEXTS.PATTERNS_TAB_EMPTY_MESSAGE,
      PATTERNS_WEEKEND_VS_WEEKDAY:
        translated?.EMERGENCY_ALERTS_PATTERNS_WEEKEND_VS_WEEKDAY ||
        TEXTS.PATTERNS_WEEKEND_VS_WEEKDAY,
    }),
    [translated],
  );
}

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
