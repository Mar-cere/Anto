/**
 * Mensajes de API del diario (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitCreate:
      'Demasiadas entradas creadas. Por favor, intente más tarde.',
    rateLimitUpdate:
      'Demasiadas actualizaciones. Por favor, intente más tarde.',
    rateLimitDelete:
      'Demasiadas eliminaciones. Por favor, intente más tarde.',
    listError: 'Error al obtener las entradas del diario',
    statsError: 'Error al obtener las estadísticas del diario',
    notFound: 'Entrada no encontrada',
    getError: 'Error al obtener la entrada',
    createdSuccess: 'Entrada creada exitosamente',
    createError: 'Error al crear la entrada',
    updatedSuccess: 'Entrada actualizada exitosamente',
    updateError: 'Error al actualizar la entrada',
    deletedSuccess: 'Entrada eliminada exitosamente',
    deleteError: 'Error al eliminar la entrada',
    archivedFieldInvalid: 'El campo archived debe ser true o false',
    archiveError: 'Error al archivar la entrada',
    archivedSuccess: 'Entrada archivada exitosamente',
    unarchivedSuccess: 'Entrada desarchivada exitosamente',
    joiContentEmpty: 'El contenido no puede estar vacío',
    joiContentMin: 'El contenido debe tener al menos 1 carácter',
    joiContentMax: 'El contenido no puede exceder 2000 caracteres',
    joiContentRequired: 'El contenido es requerido',
  },
  en: {
    rateLimitCreate: 'Too many journal entries created. Please try again later.',
    rateLimitUpdate: 'Too many updates. Please try again later.',
    rateLimitDelete: 'Too many deletions. Please try again later.',
    listError: 'Could not load journal entries',
    statsError: 'Could not load journal statistics',
    notFound: 'Entry not found',
    getError: 'Could not load entry',
    createdSuccess: 'Entry created successfully',
    createError: 'Could not create entry',
    updatedSuccess: 'Entry updated successfully',
    updateError: 'Could not update entry',
    deletedSuccess: 'Entry deleted successfully',
    deleteError: 'Could not delete entry',
    archivedFieldInvalid: 'Field archived must be true or false',
    archiveError: 'Could not archive entry',
    archivedSuccess: 'Entry archived successfully',
    unarchivedSuccess: 'Entry unarchived successfully',
    joiContentEmpty: 'Content cannot be empty',
    joiContentMin: 'Content must be at least 1 character',
    joiContentMax: 'Content cannot exceed 2000 characters',
    joiContentRequired: 'Content is required',
  },
};

export function journalApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
