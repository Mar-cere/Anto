/**
 * Mensajes de API del resumen semanal/mensual y foco (es/en).
 */
import { normalizeApiLanguage, resolveRequestLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    lastSessionError: 'Error al obtener la continuidad del chat',
    focusError: 'Error al generar el foco del panel',
    periodRequired: 'Query period es requerido: week o month',
    invalidDate: 'Parámetro date inválido; use YYYY-MM-DD',
    invalidMonth: 'Parámetros year (2000–2100) y month (1–12) inválidos',
    summaryError: 'Error al generar el resumen',
  },
  en: {
    lastSessionError: 'Could not load chat continuity',
    focusError: 'Could not generate dashboard focus',
    periodRequired: 'Query period is required: week or month',
    invalidDate: 'Invalid date parameter; use YYYY-MM-DD',
    invalidMonth: 'Invalid year (2000–2100) and month (1–12) parameters',
    summaryError: 'Could not generate summary',
  },
};

export function summaryApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}

export function resolveSummaryRequestLanguage(req) {
  return resolveRequestLanguage(req);
}
