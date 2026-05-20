/**
 * Mensajes de API de Cloudinary (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitDelete:
      'Demasiadas eliminaciones de recursos. Por favor, intente más tarde.',
    invalidData: 'Datos inválidos',
    signatureError: 'Error al generar firma de subida',
    resourceIdRequired: 'ID del recurso requerido',
    deleteResourceError: 'Error al eliminar el recurso',
    resourceDeleted: 'Recurso eliminado correctamente',
    listResourcesError: 'Error al obtener recursos',
    joiTypeInvalid: 'El tipo debe ser background o attachment',
    joiTypeRequired: 'El tipo es requerido',
    joiFolderRequired: 'La carpeta es requerida',
  },
  en: {
    rateLimitDelete: 'Too many resource deletions. Please try again later.',
    invalidData: 'Invalid data',
    signatureError: 'Could not generate upload signature',
    resourceIdRequired: 'Resource ID is required',
    deleteResourceError: 'Could not delete resource',
    resourceDeleted: 'Resource deleted successfully',
    listResourcesError: 'Could not load resources',
    joiTypeInvalid: 'Type must be background or attachment',
    joiTypeRequired: 'Type is required',
    joiFolderRequired: 'Folder is required',
  },
};

export function cloudinaryApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
