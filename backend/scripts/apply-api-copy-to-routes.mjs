/**
 * Sustituye mensajes hardcodeados por req.apiCopy.* en rutas de tareas y hábitos.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TASK_REPLACEMENTS = [
  ["message: 'Error al obtener las tareas'", 'message: req.apiCopy.listError'],
  ["message: 'Datos inválidos'", 'message: req.apiCopy.invalidData'],
  [
    "message: 'Origen de chat inválido: la conversación o el mensaje no existe o no pertenece al usuario'",
    'message: req.apiCopy.invalidChatOrigin',
  ],
  [
    "message: 'Tarea ya registrada (reintento idempotente)'",
    'message: req.apiCopy.idempotentRetry',
  ],
  ["message: 'Tarea padre no encontrada'", 'message: req.apiCopy.parentNotFound'],
  ["message: 'Tarea creada exitosamente'", 'message: req.apiCopy.createdSuccess'],
  ["message: 'Error al crear la tarea'", 'message: req.apiCopy.createError'],
  ["message: 'Error al obtener las tareas pendientes'", 'message: req.apiCopy.pendingError'],
  ["message: 'Error al obtener las tareas vencidas'", 'message: req.apiCopy.overdueError'],
  [
    "message: 'Error al obtener los recordatorios próximos'",
    'message: req.apiCopy.remindersError',
  ],
  ["message: 'Error al obtener estadísticas'", 'message: req.apiCopy.statsError'],
  ["message: 'Fecha inválida'", 'message: req.apiCopy.invalidDate'],
  ["message: 'Error al obtener items por fecha'", 'message: req.apiCopy.byDateError'],
  ["message: 'Error al buscar tareas'", 'message: req.apiCopy.searchError'],
  ["message: 'Tarea no encontrada'", 'message: req.apiCopy.notFound'],
  ["message: 'Error al obtener la tarea'", 'message: req.apiCopy.getError'],
  ["message: 'Tarea actualizada exitosamente'", 'message: req.apiCopy.updatedSuccess'],
  ["message: 'Error al actualizar la tarea'", 'message: req.apiCopy.updateError'],
  ["message: 'Tarea eliminada correctamente'", 'message: req.apiCopy.deletedSuccess'],
  ["message: 'Error al eliminar la tarea'", 'message: req.apiCopy.deleteError'],
  ["message: 'Tarea marcada como completada'", 'message: req.apiCopy.completedSuccess'],
  ["message: error.message || 'Error al completar la tarea'", 'message: req.apiCopy.completeError'],
  ["message: 'Tarea marcada como en progreso'", 'message: req.apiCopy.inProgressSuccess'],
  [
    "message: error.message || 'Error al marcar la tarea en progreso'",
    'message: req.apiCopy.inProgressError',
  ],
  ["message: 'Tarea cancelada'", 'message: req.apiCopy.cancelledSuccess'],
  ["message: 'Error al cancelar la tarea'", 'message: req.apiCopy.cancelError'],
  [
    "message: 'Solo tareas y metas admiten generación de subtareas'",
    'message: req.apiCopy.subtasksOnlyTasksGoals',
  ],
  [
    "message: 'No se pueden sugerir subtareas en una tarea completada o cancelada'",
    'message: req.apiCopy.subtasksNotOnClosed',
  ],
  [
    "message: 'Esta tarea ya tiene subtareas. Edita el detalle si necesitas ajustes.'",
    'message: req.apiCopy.subtasksAlreadyExist',
  ],
  [
    "message: 'No se añadieron subtareas nuevas (límite alcanzado o ya existían)'",
    'message: req.apiCopy.subtasksNoneAdded',
  ],
  [
    "message: 'No se pudo guardar las subtareas. Revisa los datos de la tarea.'",
    'message: req.apiCopy.subtasksSaveError',
  ],
  [
    "message: 'Generación de subtareas desactivada en el servidor'",
    'message: req.apiCopy.subtasksDisabled',
  ],
  [
    "message: 'Asistente no disponible (falta configuración en el servidor)'",
    'message: req.apiCopy.assistantUnavailable',
  ],
  [
    "message: 'No se pudo interpretar la respuesta del asistente. Intenta de nuevo.'",
    'message: req.apiCopy.assistantParseError',
  ],
  ["message: 'La tarea no tiene un título válido'", 'message: req.apiCopy.invalidTitle'],
  ["message: 'El asistente tardó demasiado. Intenta de nuevo.'", 'message: req.apiCopy.assistantTimeout'],
  ["message: 'Error al generar subtareas'", 'message: req.apiCopy.subtasksGenerateError'],
  ["message: 'El título de la subtarea es requerido'", 'message: req.apiCopy.subtaskTitleRequired'],
  ["message: 'Subtarea agregada exitosamente'", 'message: req.apiCopy.subtaskAddedSuccess'],
  ["message: 'Error al agregar la subtarea'", 'message: req.apiCopy.subtaskAddError'],
  ["message: 'Índice de subtarea inválido'", 'message: req.apiCopy.subtaskIndexInvalid'],
  ["message: 'Índice de subtarea fuera de rango'", 'message: req.apiCopy.subtaskIndexOutOfRange'],
  ["message: 'Subtarea completada exitosamente'", 'message: req.apiCopy.subtaskCompletedSuccess'],
  ["message: error.message || 'Error al completar la subtarea'", 'message: req.apiCopy.subtaskCompleteError'],
  ["message: 'Subtarea eliminada'", 'message: req.apiCopy.subtaskDeletedSuccess'],
  ["message: error.message || 'Error al eliminar la subtarea'", 'message: req.apiCopy.subtaskDeleteError'],
  ["message: 'Subtareas eliminadas'", 'message: req.apiCopy.subtasksClearedSuccess'],
  ["message: error.message || 'Error al eliminar las subtareas'", 'message: req.apiCopy.subtasksClearError'],
  [
    "message: 'Servicio temporalmente no disponible. La base de datos no está conectada.'",
    'message: req.apiCopy.dbUnavailable',
  ],
];

const HABIT_REPLACEMENTS = [
  ["message: 'Error al obtener los hábitos'", 'message: req.apiCopy.listError'],
  ["message: 'Error al obtener los hábitos activos'", 'message: req.apiCopy.activeError'],
  ["message: 'Error al obtener los hábitos vencidos'", 'message: req.apiCopy.overdueError'],
  ["message: 'Error al obtener las estadísticas'", 'message: req.apiCopy.statsError'],
  ["message: 'Año o semana inválidos'", 'message: req.apiCopy.invalidYearWeek'],
  ["message: 'Error al obtener el progreso semanal'", 'message: req.apiCopy.weeklyProgressError'],
  ["message: 'Año o mes inválidos'", 'message: req.apiCopy.invalidYearMonth'],
  ["message: 'Error al obtener el progreso mensual'", 'message: req.apiCopy.monthlyProgressError'],
  ["message: 'Datos inválidos'", 'message: req.apiCopy.invalidData'],
  [
    "message: 'Origen de chat inválido: la conversación o el mensaje no existe o no pertenece al usuario'",
    'message: req.apiCopy.invalidChatOrigin',
  ],
  [
    "message: 'Hábito ya registrado (reintento idempotente)'",
    'message: req.apiCopy.idempotentRetry',
  ],
  ["message: 'Hábito creado exitosamente'", 'message: req.apiCopy.createdSuccess'],
  ["message: 'Error al crear el hábito'", 'message: req.apiCopy.createError'],
  ["message: 'Hábito no encontrado'", 'message: req.apiCopy.notFound'],
  ["message: 'Hábito actualizado exitosamente'", 'message: req.apiCopy.updatedSuccess'],
  ["message: 'Error al actualizar el hábito'", 'message: req.apiCopy.updateError'],
  ["message: 'Error al archivar el hábito'", 'message: req.apiCopy.archiveError'],
  ["message: 'Hábito eliminado correctamente'", 'message: req.apiCopy.deletedSuccess'],
  ["message: 'Error al eliminar el hábito'", 'message: req.apiCopy.deleteError'],
  ["message: 'No se puede modificar un hábito archivado'", 'message: req.apiCopy.cannotModifyArchived'],
  [
    "message: 'Estado del hábito actualizado exitosamente'",
    'message: req.apiCopy.statusUpdatedSuccess',
  ],
  ["message: 'Recordatorio actualizado exitosamente'", 'message: req.apiCopy.reminderUpdatedSuccess'],
  ["message: 'Error al actualizar el recordatorio'", 'message: req.apiCopy.reminderUpdateError'],
  [
    "message: 'Servicio temporalmente no disponible. La base de datos no está conectada.'",
    'message: req.apiCopy.dbUnavailable',
  ],
];

function apply(filePath, replacements) {
  let content = readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    const count = content.split(from).length - 1;
    if (count === 0) {
      console.warn('MISSING:', from.slice(0, 60), 'in', filePath);
    }
    content = content.split(from).join(to);
  }
  writeFileSync(filePath, content, 'utf8');
  console.log('Updated', filePath);
}

apply(join(__dirname, '../routes/taskRoutes.js'), TASK_REPLACEMENTS);
apply(join(__dirname, '../routes/habitRoutes.js'), HABIT_REPLACEMENTS);
