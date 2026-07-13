/**
 * ApiCopy para endpoints de gestión de hechos del usuario (user-facts).
 * Mensajes bilingües ES/EN para respuestas de API y validación Joi.
 */

import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    // Success messages
    createdSuccess: 'Hecho biográfico registrado correctamente',
    updatedSuccess: 'Hecho actualizado correctamente',
    deletedSuccess: 'Hecho eliminado correctamente',
    listSuccess: 'Hechos recuperados correctamente',

    // Error messages
    createError: 'Error al crear el hecho',
    updateError: 'Error al actualizar el hecho',
    deleteError: 'Error al eliminar el hecho',
    listError: 'Error al recuperar los hechos',
    notFound: 'Hecho no encontrado',
    unauthorized: 'No tienes permiso para modificar este hecho',
    internalError: 'Error interno del servidor',

    // Rate limit
    rateLimitCreate: 'Has alcanzado el límite de creación de hechos. Intenta de nuevo más tarde',
    rateLimitUpdate: 'Has alcanzado el límite de actualizaciones. Intenta de nuevo más tarde',
    rateLimitDelete: 'Has alcanzado el límite de eliminaciones. Intenta de nuevo más tarde',

    // Joi validation messages
    joiFactRequired: 'El contenido del hecho es obligatorio',
    joiFactString: 'El hecho debe ser texto',
    joiFactMin: 'El hecho debe tener al menos 5 caracteres',
    joiFactMax: 'El hecho no puede superar 150 caracteres',
    joiCategoryInvalid: 'Categoría inválida. Opciones: work, family, study, health, relationships, commitment, other',
    joiSourceInvalid: 'Fuente inválida. Opciones: user, assistant',
    joiConversationIdInvalid: 'ID de conversación inválido',
    joiIsActiveInvalid: 'isActive debe ser un booleano',
  },
  en: {
    // Success messages
    createdSuccess: 'Biographical fact registered successfully',
    updatedSuccess: 'Fact updated successfully',
    deletedSuccess: 'Fact deleted successfully',
    listSuccess: 'Facts retrieved successfully',

    // Error messages
    createError: 'Error creating fact',
    updateError: 'Error updating fact',
    deleteError: 'Error deleting fact',
    listError: 'Error retrieving facts',
    notFound: 'Fact not found',
    unauthorized: 'You do not have permission to modify this fact',
    internalError: 'Internal server error',

    // Rate limit
    rateLimitCreate: 'You have reached the fact creation limit. Please try again later',
    rateLimitUpdate: 'You have reached the update limit. Please try again later',
    rateLimitDelete: 'You have reached the deletion limit. Please try again later',

    // Joi validation messages
    joiFactRequired: 'Fact content is required',
    joiFactString: 'Fact must be text',
    joiFactMin: 'Fact must be at least 5 characters long',
    joiFactMax: 'Fact cannot exceed 150 characters',
    joiCategoryInvalid: 'Invalid category. Options: work, family, study, health, relationships, commitment, other',
    joiSourceInvalid: 'Invalid source. Options: user, assistant',
    joiConversationIdInvalid: 'Invalid conversation ID',
    joiIsActiveInvalid: 'isActive must be a boolean',
  },
};

export function userFactsApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
