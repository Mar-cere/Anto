/**
 * Mensajes de API de distorsiones cognitivas (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimit: 'Demasiadas solicitudes. Por favor, espera un momento.',
    typesError: 'Error al obtener tipos de distorsiones',
    invalidType: 'Tipo de distorsión inválido',
    typeNotFound: 'Tipo de distorsión no encontrado',
    distortionInfoError: 'Error al obtener información de distorsión',
    reportsError: 'Error al obtener reportes',
    statsError: 'Error al obtener estadísticas',
    summaryError: 'Error al obtener resumen',
    internalError: 'Error interno del servidor',
  },
  en: {
    rateLimit: 'Too many requests. Please wait a moment.',
    typesError: 'Could not load distortion types',
    invalidType: 'Invalid distortion type',
    typeNotFound: 'Distortion type not found',
    distortionInfoError: 'Could not load distortion information',
    reportsError: 'Could not load reports',
    statsError: 'Could not load statistics',
    summaryError: 'Could not load summary',
    internalError: 'Internal server error',
  },
};

export function cognitiveDistortionsApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
