/**
 * Mensajes de API del dashboard de crisis (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const EMOTION_LABELS = {
  es: {
    tristeza: 'tristeza',
    ansiedad: 'ansiedad',
    enojo: 'enojo',
    miedo: 'miedo',
    verguenza: 'vergüenza',
    neutral: 'neutral',
  },
  en: {
    tristeza: 'sadness',
    ansiedad: 'anxiety',
    enojo: 'anger',
    miedo: 'fear',
    verguenza: 'shame',
    neutral: 'neutral',
  },
};

const COPY = {
  es: {
    invalidQueryParams: 'Parámetros de consulta inválidos',
    summaryError: 'Error al obtener resumen de crisis',
    trendsError: 'Error al obtener tendencias emocionales',
    byMonthError: 'Error al obtener crisis por mes',
    historyError: 'Error al obtener historial de crisis',
    alertsStatsError: 'Error al obtener estadísticas de alertas',
    followupStatsError: 'Error al obtener estadísticas de seguimiento',
    emotionDistributionError: 'Error al obtener distribución de emociones',
    comparePeriodsError: 'Error al comparar períodos',
    exportError: 'Error al obtener datos para exportación',
    recommendationsError: 'Error al obtener recomendaciones de técnicas',
    techniqueEffectivenessError: 'Error al analizar efectividad de técnicas',
    emotionReason: (emotion) =>
      `Basada en tu emoción más frecuente en crisis: ${emotion}`,
    effectiveReason: (score) =>
      `Técnica que te ha funcionado bien (efectividad: ${score}/5)`,
  },
  en: {
    invalidQueryParams: 'Invalid query parameters',
    summaryError: 'Could not load crisis summary',
    trendsError: 'Could not load emotional trends',
    byMonthError: 'Could not load crises by month',
    historyError: 'Could not load crisis history',
    alertsStatsError: 'Could not load alert statistics',
    followupStatsError: 'Could not load follow-up statistics',
    emotionDistributionError: 'Could not load emotion distribution',
    comparePeriodsError: 'Could not compare periods',
    exportError: 'Could not load export data',
    recommendationsError: 'Could not load technique recommendations',
    techniqueEffectivenessError: 'Could not analyze technique effectiveness',
    emotionReason: (emotion) =>
      `Based on your most frequent emotion during crises: ${emotion}`,
    effectiveReason: (score) =>
      `A technique that has worked well for you (effectiveness: ${score}/5)`,
  },
};

export function crisisApiCopy(language) {
  const lang = normalizeApiLanguage(language);
  return {
    ...COPY[lang],
    emotionLabel: (emotionKey) =>
      EMOTION_LABELS[lang][emotionKey] || emotionKey,
  };
}
