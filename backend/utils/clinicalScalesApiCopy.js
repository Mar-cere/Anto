/**
 * Mensajes de API de escalas clínicas (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimit: 'Demasiadas solicitudes. Por favor, espera un momento.',
    availableError: 'Error al obtener escalas disponibles',
    invalidScaleType: 'Tipo de escala inválido. Debe ser PHQ9 o GAD7',
    invalidScaleTypeShort: 'Tipo de escala inválido',
    scaleNotFound: 'Escala no encontrada',
    definitionError: 'Error al obtener definición de escala',
    itemScoresMustBeArray: 'itemScores debe ser un array',
    duplicateItems: 'No se permiten ítems duplicados',
    submitSuccess: 'Escala completada exitosamente',
    submitError: 'Error al guardar resultado de escala',
    resultsError: 'Error al obtener resultados',
    progressError: 'Error al obtener progreso',
    summaryError: 'Error al obtener resumen',
    internalError: 'Error interno del servidor',
    tooManyItems: (scaleType, count) =>
      `Demasiados ítems. La escala ${scaleType} tiene ${count} ítems`,
    invalidItemFormat: 'Ítem inválido: itemId y score deben ser números',
    invalidItemScore: (itemId) =>
      `Puntuación inválida para ítem ${itemId}: debe ser un entero entre 0 y 3`,
    itemNotFound: (itemId) => `Ítem ${itemId} no encontrado en la escala`,
    invalidTotalScore: (totalScore, scaleType, maxScore) =>
      `Puntuación total inválida: ${totalScore}. El máximo para ${scaleType} es ${maxScore}`,
  },
  en: {
    rateLimit: 'Too many requests. Please wait a moment.',
    availableError: 'Could not load available scales',
    invalidScaleType: 'Invalid scale type. Must be PHQ9 or GAD7',
    invalidScaleTypeShort: 'Invalid scale type',
    scaleNotFound: 'Scale not found',
    definitionError: 'Could not load scale definition',
    itemScoresMustBeArray: 'itemScores must be an array',
    duplicateItems: 'Duplicate items are not allowed',
    submitSuccess: 'Scale completed successfully',
    submitError: 'Could not save scale result',
    resultsError: 'Could not load results',
    progressError: 'Could not load progress',
    summaryError: 'Could not load summary',
    internalError: 'Internal server error',
    tooManyItems: (scaleType, count) =>
      `Too many items. Scale ${scaleType} has ${count} items`,
    invalidItemFormat: 'Invalid item: itemId and score must be numbers',
    invalidItemScore: (itemId) =>
      `Invalid score for item ${itemId}: must be an integer between 0 and 3`,
    itemNotFound: (itemId) => `Item ${itemId} not found in scale`,
    invalidTotalScore: (totalScore, scaleType, maxScore) =>
      `Invalid total score: ${totalScore}. Maximum for ${scaleType} is ${maxScore}`,
  },
};

export function clinicalScalesApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
