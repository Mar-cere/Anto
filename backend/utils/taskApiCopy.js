/**
 * Mensajes de API de tareas (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitCreate: 'Demasiadas tareas creadas. Por favor, intente más tarde.',
    rateLimitUpdate: 'Demasiadas actualizaciones. Por favor, intente más tarde.',
    rateLimitDelete: 'Demasiadas eliminaciones. Por favor, intente más tarde.',
    rateLimitPatch: 'Demasiadas modificaciones. Por favor, intente más tarde.',
    dbUnavailable:
      'Servicio temporalmente no disponible. La base de datos no está conectada.',
    listError: 'Error al obtener las tareas',
    invalidData: 'Datos inválidos',
    invalidChatOrigin:
      'Origen de chat inválido: la conversación o el mensaje no existe o no pertenece al usuario',
    idempotentRetry: 'Tarea ya registrada (reintento idempotente)',
    parentNotFound: 'Tarea padre no encontrada',
    createdSuccess: 'Tarea creada exitosamente',
    createError: 'Error al crear la tarea',
    pendingError: 'Error al obtener las tareas pendientes',
    overdueError: 'Error al obtener las tareas vencidas',
    remindersError: 'Error al obtener los recordatorios próximos',
    statsError: 'Error al obtener estadísticas',
    invalidDate: 'Fecha inválida',
    byDateError: 'Error al obtener items por fecha',
    searchError: 'Error al buscar tareas',
    notFound: 'Tarea no encontrada',
    getError: 'Error al obtener la tarea',
    updatedSuccess: 'Tarea actualizada exitosamente',
    updateError: 'Error al actualizar la tarea',
    deletedSuccess: 'Tarea eliminada correctamente',
    deleteError: 'Error al eliminar la tarea',
    completedSuccess: 'Tarea marcada como completada',
    completeError: 'Error al completar la tarea',
    inProgressSuccess: 'Tarea marcada como en progreso',
    inProgressError: 'Error al marcar la tarea en progreso',
    cancelledSuccess: 'Tarea cancelada',
    cancelError: 'Error al cancelar la tarea',
    subtasksOnlyTasksGoals: 'Solo tareas y metas admiten generación de subtareas',
    subtasksNotOnClosed:
      'No se pueden sugerir subtareas en una tarea completada o cancelada',
    subtasksAlreadyExist:
      'Esta tarea ya tiene subtareas. Edita el detalle si necesitas ajustes.',
    subtasksNoneAdded:
      'No se añadieron subtareas nuevas (límite alcanzado o ya existían)',
    subtasksAdded: (n) => `${n} subtarea(s) añadida(s)`,
    subtasksSaveError:
      'No se pudo guardar las subtareas. Revisa los datos de la tarea.',
    subtasksDisabled: 'Generación de subtareas desactivada en el servidor',
    assistantUnavailable:
      'Asistente no disponible (falta configuración en el servidor)',
    assistantParseError:
      'No se pudo interpretar la respuesta del asistente. Intenta de nuevo.',
    invalidTitle: 'La tarea no tiene un título válido',
    assistantTimeout: 'El asistente tardó demasiado. Intenta de nuevo.',
    subtasksGenerateError: 'Error al generar subtareas',
    subtaskTitleRequired: 'El título de la subtarea es requerido',
    subtaskAddedSuccess: 'Subtarea agregada exitosamente',
    subtaskAddError: 'Error al agregar la subtarea',
    subtaskIndexInvalid: 'Índice de subtarea inválido',
    subtaskIndexOutOfRange: 'Índice de subtarea fuera de rango',
    subtaskCompletedSuccess: 'Subtarea completada exitosamente',
    subtaskCompleteError: 'Error al completar la subtarea',
    subtaskDeletedSuccess: 'Subtarea eliminada',
    subtaskDeleteError: 'Error al eliminar la subtarea',
    subtasksClearedSuccess: 'Subtareas eliminadas',
    subtasksClearError: 'Error al eliminar las subtareas',
  },
  en: {
    rateLimitCreate: 'Too many tasks created. Please try again later.',
    rateLimitUpdate: 'Too many updates. Please try again later.',
    rateLimitDelete: 'Too many deletions. Please try again later.',
    rateLimitPatch: 'Too many changes. Please try again later.',
    dbUnavailable: 'Service temporarily unavailable. Database is not connected.',
    listError: 'Could not load tasks',
    invalidData: 'Invalid data',
    invalidChatOrigin:
      'Invalid chat origin: conversation or message does not exist or does not belong to you',
    idempotentRetry: 'Task already recorded (idempotent retry)',
    parentNotFound: 'Parent task not found',
    createdSuccess: 'Task created successfully',
    createError: 'Could not create task',
    pendingError: 'Could not load pending tasks',
    overdueError: 'Could not load overdue tasks',
    remindersError: 'Could not load upcoming reminders',
    statsError: 'Could not load statistics',
    invalidDate: 'Invalid date',
    byDateError: 'Could not load items for that date',
    searchError: 'Could not search tasks',
    notFound: 'Task not found',
    getError: 'Could not load task',
    updatedSuccess: 'Task updated successfully',
    updateError: 'Could not update task',
    deletedSuccess: 'Task deleted successfully',
    deleteError: 'Could not delete task',
    completedSuccess: 'Task marked as completed',
    completeError: 'Could not complete task',
    inProgressSuccess: 'Task marked as in progress',
    inProgressError: 'Could not mark task as in progress',
    cancelledSuccess: 'Task cancelled',
    cancelError: 'Could not cancel task',
    subtasksOnlyTasksGoals: 'Only tasks and goals support subtask generation',
    subtasksNotOnClosed:
      'Cannot suggest subtasks for a completed or cancelled task',
    subtasksAlreadyExist:
      'This task already has subtasks. Edit the details if you need changes.',
    subtasksNoneAdded:
      'No new subtasks were added (limit reached or they already exist)',
    subtasksAdded: (n) => `${n} subtask(s) added`,
    subtasksSaveError: 'Could not save subtasks. Check the task data.',
    subtasksDisabled: 'Subtask generation is disabled on the server',
    assistantUnavailable:
      'Assistant unavailable (missing server configuration)',
    assistantParseError:
      'Could not interpret the assistant response. Please try again.',
    invalidTitle: 'Task does not have a valid title',
    assistantTimeout: 'The assistant took too long. Please try again.',
    subtasksGenerateError: 'Could not generate subtasks',
    subtaskTitleRequired: 'Subtask title is required',
    subtaskAddedSuccess: 'Subtask added successfully',
    subtaskAddError: 'Could not add subtask',
    subtaskIndexInvalid: 'Invalid subtask index',
    subtaskIndexOutOfRange: 'Subtask index out of range',
    subtaskCompletedSuccess: 'Subtask completed successfully',
    subtaskCompleteError: 'Could not complete subtask',
    subtaskDeletedSuccess: 'Subtask deleted',
    subtaskDeleteError: 'Could not delete subtask',
    subtasksClearedSuccess: 'Subtasks deleted',
    subtasksClearError: 'Could not delete subtasks',
  },
};

export function taskApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
