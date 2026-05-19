/**
 * Constantes para CrisisDashboardScreen y subcomponentes
 */
import { useMemo } from 'react';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { lightColors } from '../../styles/themePalettes';

function rgbaFromHex(hex, alpha = 1) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.min(1, Math.max(0, Number(alpha) === Number(alpha) ? alpha : 1));
  return `rgba(${r},${g},${b},${a})`;
}

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

export function useCrisisDashboardTexts() {
  const translated = useSectionTranslations('PROFILE');
  return useMemo(
    () => ({
      ...TEXTS,
      TITLE: translated?.CRISIS_TITLE || TEXTS.TITLE,
      SUPPORT_TITLE: translated?.CRISIS_SUPPORT_TITLE || TEXTS.SUPPORT_TITLE,
      SUPPORT_SUBTITLE:
        translated?.CRISIS_SUPPORT_SUBTITLE || TEXTS.SUPPORT_SUBTITLE,
      SUPPORT_CONTACTS_CTA:
        translated?.CRISIS_SUPPORT_CONTACTS_CTA || TEXTS.SUPPORT_CONTACTS_CTA,
      SUPPORT_CONTACTS_HINT:
        translated?.CRISIS_SUPPORT_CONTACTS_HINT || TEXTS.SUPPORT_CONTACTS_HINT,
      SUPPORT_CHAT_CTA:
        translated?.CRISIS_SUPPORT_CHAT_CTA || TEXTS.SUPPORT_CHAT_CTA,
      SUPPORT_CHAT_HINT:
        translated?.CRISIS_SUPPORT_CHAT_HINT || TEXTS.SUPPORT_CHAT_HINT,
      LOADING: translated?.CRISIS_LOADING || TEXTS.LOADING,
      ERROR: translated?.CRISIS_ERROR || TEXTS.ERROR,
      ERROR_UNKNOWN: translated?.CRISIS_ERROR_UNKNOWN || TEXTS.ERROR_UNKNOWN,
      DATE_UNAVAILABLE:
        translated?.CRISIS_DATE_UNAVAILABLE || TEXTS.DATE_UNAVAILABLE,
      RETRY: translated?.CRISIS_RETRY || TEXTS.RETRY,
      REFRESHING: translated?.CRISIS_REFRESHING || TEXTS.REFRESHING,
      SUMMARY: translated?.CRISIS_SUMMARY || TEXTS.SUMMARY,
      SUMMARY_PERIOD_NOTE:
        translated?.CRISIS_SUMMARY_PERIOD_NOTE || TEXTS.SUMMARY_PERIOD_NOTE,
      TRENDS: translated?.CRISIS_TRENDS || TEXTS.TRENDS,
      TRENDS_PERIOD_HINT:
        translated?.CRISIS_TRENDS_PERIOD_HINT || TEXTS.TRENDS_PERIOD_HINT,
      CRISIS_BY_MONTH:
        translated?.CRISIS_BY_MONTH_TITLE || TEXTS.CRISIS_BY_MONTH,
      CRISIS_BY_MONTH_PERIOD:
        translated?.CRISIS_BY_MONTH_PERIOD || TEXTS.CRISIS_BY_MONTH_PERIOD,
      EMOTION_DISTRIBUTION:
        translated?.CRISIS_EMOTION_DISTRIBUTION ||
        TEXTS.EMOTION_DISTRIBUTION,
      EMOTION_DISTRIBUTION_PERIOD:
        translated?.CRISIS_EMOTION_DISTRIBUTION_PERIOD ||
        TEXTS.EMOTION_DISTRIBUTION_PERIOD,
      HISTORY: translated?.CRISIS_HISTORY || TEXTS.HISTORY,
      HISTORY_RECENT_NOTE:
        translated?.CRISIS_HISTORY_RECENT_NOTE || TEXTS.HISTORY_RECENT_NOTE,
      TOTAL_CRISES: translated?.CRISIS_TOTAL || TEXTS.TOTAL_CRISES,
      THIS_MONTH: translated?.CRISIS_THIS_MONTH || TEXTS.THIS_MONTH,
      RECENT: translated?.CRISIS_RECENT || TEXTS.RECENT,
      RESOLUTION_RATE:
        translated?.CRISIS_RESOLUTION_RATE || TEXTS.RESOLUTION_RATE,
      ALERTS_SENT: translated?.CRISIS_ALERTS_SENT || TEXTS.ALERTS_SENT,
      FOLLOWUPS_COMPLETED:
        translated?.CRISIS_FOLLOWUPS_COMPLETED || TEXTS.FOLLOWUPS_COMPLETED,
      AVERAGE_RISK: translated?.CRISIS_AVERAGE_RISK || TEXTS.AVERAGE_RISK,
      PERIOD_7D: translated?.CRISIS_PERIOD_7D || TEXTS.PERIOD_7D,
      PERIOD_30D: translated?.CRISIS_PERIOD_30D || TEXTS.PERIOD_30D,
      PERIOD_90D: translated?.CRISIS_PERIOD_90D || TEXTS.PERIOD_90D,
      VIEW_ALL: translated?.CRISIS_VIEW_ALL || TEXTS.VIEW_ALL,
      NO_CRISIS: translated?.CRISIS_NO_DATA_TITLE || TEXTS.NO_CRISIS,
      NO_CRISIS_MESSAGE:
        translated?.CRISIS_NO_DATA_MESSAGE || TEXTS.NO_CRISIS_MESSAGE,
      EMPTY_TRENDS: translated?.CRISIS_EMPTY_TRENDS || TEXTS.EMPTY_TRENDS,
      EMPTY_MONTHLY_CHART:
        translated?.CRISIS_EMPTY_MONTHLY || TEXTS.EMPTY_MONTHLY_CHART,
      EMPTY_EMOTION_DISTRIBUTION:
        translated?.CRISIS_EMPTY_EMOTION_DISTRIBUTION ||
        TEXTS.EMPTY_EMOTION_DISTRIBUTION,
      EMPTY_HISTORY_RECENT:
        translated?.CRISIS_EMPTY_HISTORY_RECENT || TEXTS.EMPTY_HISTORY_RECENT,
      LOW: translated?.CRISIS_RISK_LOW || TEXTS.LOW,
      WARNING: translated?.CRISIS_RISK_WARNING || TEXTS.WARNING,
      MEDIUM: translated?.CRISIS_RISK_MEDIUM || TEXTS.MEDIUM,
      HIGH: translated?.CRISIS_RISK_HIGH || TEXTS.HIGH,
      TREND_IMPROVING:
        translated?.CRISIS_TREND_IMPROVING || TEXTS.TREND_IMPROVING,
      TREND_DECLINING:
        translated?.CRISIS_TREND_DECLINING || TEXTS.TREND_DECLINING,
      TREND_STABLE: translated?.CRISIS_TREND_STABLE || TEXTS.TREND_STABLE,
      TREND_LABEL: translated?.CRISIS_TREND_LABEL || TEXTS.TREND_LABEL,
    }),
    [translated],
  );
}

export const CHART_HEIGHT = 220;

export function createChartConfig(colors) {
  const surface = colors.surface ?? colors.cardBackground ?? colors.background;
  return {
    backgroundColor: surface,
    backgroundGradientFrom: surface,
    backgroundGradientTo: surface,
    decimalPlaces: 1,
    color: (opacity = 1) => rgbaFromHex(colors.primary, opacity),
    labelColor: (opacity = 1) => rgbaFromHex(colors.text, opacity),
    style: { borderRadius: 16 },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };
}

export function createPieChartConfig(colors) {
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

/** Colores por emoción alineados con tokens del tema (claro/oscuro). */
export function createEmotionColors(colors) {
  return {
    tristeza: colors.error,
    ansiedad: colors.warning,
    enojo: colors.error,
    miedo: colors.info,
    alegria: colors.success,
    esperanza: colors.success,
    neutral: colors.textSecondary,
    verguenza: colors.error,
    culpa: colors.error,
  };
}

export function createRiskLevelColors(colors) {
  return {
    LOW: colors.success,
    WARNING: colors.warning,
    MEDIUM: colors.error,
    HIGH: colors.error,
  };
}

/** Compatibilidad legacy (tema claro de paleta). */
export const EMOTION_COLORS = createEmotionColors(lightColors);

export const RISK_LEVEL_COLORS = createRiskLevelColors(lightColors);

export const RISK_LEVEL_TEXTS = {
  LOW: TEXTS.LOW,
  WARNING: TEXTS.WARNING,
  MEDIUM: TEXTS.MEDIUM,
  HIGH: TEXTS.HIGH,
};

export function createRiskLevelTexts(texts) {
  return {
    LOW: texts.LOW,
    WARNING: texts.WARNING,
    MEDIUM: texts.MEDIUM,
    HIGH: texts.HIGH,
  };
}

export const TREND_PERIODS = ['7d', '30d', '90d'];

/** Límite de caracteres del detalle de error en pantalla (evita textos enormes del backend). */
export const CRISIS_ERROR_DETAIL_MAX_LEN = 280;

/** Compatibilidad legacy (tema claro) para código no migrado. */
export const CHART_CONFIG = createChartConfig(lightColors);
export const PIE_CHART_CONFIG = createPieChartConfig(lightColors);
