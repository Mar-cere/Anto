/**
 * ApiCopy para endpoints de sesiones programadas (scheduled-sessions).
 * Mensajes bilingües ES/EN para respuestas de API y validación Joi.
 */

import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    // Success messages
    createdSuccess: 'Sesión programada creada correctamente',
    updatedSuccess: 'Sesión programada actualizada correctamente',
    deletedSuccess: 'Sesión programada eliminada correctamente',
    listSuccess: 'Sesiones programadas recuperadas correctamente',
    pausedSuccess: 'Todas las sesiones han sido pausadas correctamente',
    resumedSuccess: 'Las sesiones han sido reactivadas correctamente',

    // Error messages
    createError: 'Error al crear la sesión programada',
    updateError: 'Error al actualizar la sesión programada',
    deleteError: 'Error al eliminar la sesión programada',
    listError: 'Error al recuperar las sesiones programadas',
    pauseError: 'Error al pausar las sesiones',
    resumeError: 'Error al reactivar las sesiones',
    notFound: 'Sesión programada no encontrada',
    unauthorized: 'No tienes permiso para modificar esta sesión',
    internalError: 'Error interno del servidor',

    // Business logic errors
    limitReached: 'Has alcanzado el límite de 10 sesiones programadas',
    activeLimitReached: 'Has alcanzado el límite de 7 sesiones activas simultáneas',
    duplicateTime: 'Ya existe una sesión programada para este día y horario',

    // Rate limit
    rateLimitExceeded: 'Has alcanzado el límite de solicitudes. Intenta de nuevo más tarde',

    // Joi validation messages
    joiDayOfWeekRequired: 'El día de la semana es obligatorio',
    joiDayOfWeekNumber: 'El día de la semana debe ser un número',
    joiDayOfWeekRange: 'El día de la semana debe estar entre 0 (domingo) y 6 (sábado)',
    joiDayOfWeekInteger: 'El día de la semana debe ser un número entero',
    joiTimeRequired: 'El horario es obligatorio',
    joiTimeString: 'El horario debe ser texto',
    joiTimeFormat: 'El horario debe estar en formato HH:mm (24 horas)',
    joiLabelString: 'La etiqueta debe ser texto',
    joiLabelMax: 'La etiqueta no puede superar 50 caracteres',
    joiLabelInvalid: 'La etiqueta contiene caracteres no permitidos',
    joiIsActiveInvalid: 'isActive debe ser un booleano',
    joiNotificationIdString: 'El ID de notificación debe ser texto',
    joiNotificationIdMax: 'El ID de notificación no puede superar 128 caracteres',
    joiPauseDaysRequired: 'Los días de pausa son obligatorios',
    joiPauseDaysNumber: 'Los días de pausa deben ser un número',
    joiPauseDaysRange: 'Los días de pausa deben estar entre 1 y 90',
    joiPauseDaysInteger: 'Los días de pausa deben ser un número entero',
  },
  en: {
    // Success messages
    createdSuccess: 'Scheduled session created successfully',
    updatedSuccess: 'Scheduled session updated successfully',
    deletedSuccess: 'Scheduled session deleted successfully',
    listSuccess: 'Scheduled sessions retrieved successfully',
    pausedSuccess: 'All sessions have been paused successfully',
    resumedSuccess: 'Sessions have been resumed successfully',

    // Error messages
    createError: 'Error creating scheduled session',
    updateError: 'Error updating scheduled session',
    deleteError: 'Error deleting scheduled session',
    listError: 'Error retrieving scheduled sessions',
    pauseError: 'Error pausing sessions',
    resumeError: 'Error resuming sessions',
    notFound: 'Scheduled session not found',
    unauthorized: 'You do not have permission to modify this session',
    internalError: 'Internal server error',

    // Business logic errors
    limitReached: 'You have reached the limit of 10 scheduled sessions',
    activeLimitReached: 'You have reached the limit of 7 active sessions simultaneously',
    duplicateTime: 'A session is already scheduled for this day and time',

    // Rate limit
    rateLimitExceeded: 'You have reached the request limit. Please try again later',

    // Joi validation messages
    joiDayOfWeekRequired: 'Day of week is required',
    joiDayOfWeekNumber: 'Day of week must be a number',
    joiDayOfWeekRange: 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
    joiDayOfWeekInteger: 'Day of week must be an integer',
    joiTimeRequired: 'Time is required',
    joiTimeString: 'Time must be text',
    joiTimeFormat: 'Time must be in HH:mm format (24-hour)',
    joiLabelString: 'Label must be text',
    joiLabelMax: 'Label cannot exceed 50 characters',
    joiLabelInvalid: 'Label contains invalid characters',
    joiIsActiveInvalid: 'isActive must be a boolean',
    joiNotificationIdString: 'Notification ID must be text',
    joiNotificationIdMax: 'Notification ID cannot exceed 128 characters',
    joiPauseDaysRequired: 'Pause days is required',
    joiPauseDaysNumber: 'Pause days must be a number',
    joiPauseDaysRange: 'Pause days must be between 1 and 90',
    joiPauseDaysInteger: 'Pause days must be an integer',
  },
};

export function scheduledSessionsApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
