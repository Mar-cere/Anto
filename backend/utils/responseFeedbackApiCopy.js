/**
 * Mensajes de API de feedback de respuestas (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    invalidData: 'Datos inválidos',
    messageNotFound: 'Mensaje no encontrado',
    feedbackUpdated: 'Feedback actualizado',
    feedbackSaved: 'Feedback guardado',
    saveError: 'Error al guardar feedback',
    statsError: 'Error al obtener estadísticas',
    feedbackNotFound: 'No se encontró feedback para este mensaje',
    getError: 'Error al obtener feedback',
  },
  en: {
    invalidData: 'Invalid data',
    messageNotFound: 'Message not found',
    feedbackUpdated: 'Feedback updated',
    feedbackSaved: 'Feedback saved',
    saveError: 'Could not save feedback',
    statsError: 'Could not load statistics',
    feedbackNotFound: 'No feedback found for this message',
    getError: 'Could not load feedback',
  },
};

export function responseFeedbackApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
