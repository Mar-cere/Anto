/**
 * Mensajes de API de hábitos (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitCreate: 'Demasiados hábitos creados. Por favor, intente más tarde.',
    rateLimitUpdate: 'Demasiadas actualizaciones. Por favor, intente más tarde.',
    rateLimitDelete: 'Demasiadas eliminaciones. Por favor, intente más tarde.',
    rateLimitPatch: 'Demasiadas modificaciones. Por favor, intente más tarde.',
    dbUnavailable:
      'Servicio temporalmente no disponible. La base de datos no está conectada.',
    listError: 'Error al obtener los hábitos',
    activeError: 'Error al obtener los hábitos activos',
    overdueError: 'Error al obtener los hábitos vencidos',
    statsError: 'Error al obtener las estadísticas',
    invalidYearWeek: 'Año o semana inválidos',
    weeklyProgressError: 'Error al obtener el progreso semanal',
    invalidYearMonth: 'Año o mes inválidos',
    monthlyProgressError: 'Error al obtener el progreso mensual',
    invalidData: 'Datos inválidos',
    invalidChatOrigin:
      'Origen de chat inválido: la conversación o el mensaje no existe o no pertenece al usuario',
    idempotentRetry: 'Hábito ya registrado (reintento idempotente)',
    createdSuccess: 'Hábito creado exitosamente',
    createError: 'Error al crear el hábito',
    notFound: 'Hábito no encontrado',
    updatedSuccess: 'Hábito actualizado exitosamente',
    updateError: 'Error al actualizar el hábito',
    archivedSuccess: (archived) => (archived ? 'Hábito archivado' : 'Hábito desarchivado'),
    archiveError: 'Error al archivar el hábito',
    deletedSuccess: 'Hábito eliminado correctamente',
    deleteError: 'Error al eliminar el hábito',
    cannotModifyArchived: 'No se puede modificar un hábito archivado',
    statusUpdatedSuccess: 'Estado del hábito actualizado exitosamente',
    statusUpdateError: 'Error al actualizar el hábito',
    reminderUpdatedSuccess: 'Recordatorio actualizado exitosamente',
    reminderUpdateError: 'Error al actualizar el recordatorio',
  },
  en: {
    rateLimitCreate: 'Too many habits created. Please try again later.',
    rateLimitUpdate: 'Too many updates. Please try again later.',
    rateLimitDelete: 'Too many deletions. Please try again later.',
    rateLimitPatch: 'Too many changes. Please try again later.',
    dbUnavailable: 'Service temporarily unavailable. Database is not connected.',
    listError: 'Could not load habits',
    activeError: 'Could not load active habits',
    overdueError: 'Could not load overdue habits',
    statsError: 'Could not load statistics',
    invalidYearWeek: 'Invalid year or week',
    weeklyProgressError: 'Could not load weekly progress',
    invalidYearMonth: 'Invalid year or month',
    monthlyProgressError: 'Could not load monthly progress',
    invalidData: 'Invalid data',
    invalidChatOrigin:
      'Invalid chat origin: conversation or message does not exist or does not belong to you',
    idempotentRetry: 'Habit already recorded (idempotent retry)',
    createdSuccess: 'Habit created successfully',
    createError: 'Could not create habit',
    notFound: 'Habit not found',
    updatedSuccess: 'Habit updated successfully',
    updateError: 'Could not update habit',
    archivedSuccess: (archived) => (archived ? 'Habit archived' : 'Habit unarchived'),
    archiveError: 'Could not archive habit',
    deletedSuccess: 'Habit deleted successfully',
    deleteError: 'Could not delete habit',
    cannotModifyArchived: 'Cannot modify an archived habit',
    statusUpdatedSuccess: 'Habit status updated successfully',
    statusUpdateError: 'Could not update habit',
    reminderUpdatedSuccess: 'Reminder updated successfully',
    reminderUpdateError: 'Could not update reminder',
  },
};

export function habitApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
