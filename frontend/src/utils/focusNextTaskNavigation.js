/**
 * Navegación desde el bloque de foco hacia tareas.
 */

/**
 * @param {{ _id?: string, taskId?: string } | null | undefined} task
 */
export function resolveFocusTaskId(task) {
  if (!task) return '';
  for (const raw of [task._id, task.taskId]) {
    const id = raw != null ? String(raw).trim() : '';
    if (id) return id;
  }
  return '';
}

/**
 * Quita prefijo localizado del título de recordatorio de tarea.
 * @param {string} title
 */
export function stripFocusTaskTitlePrefix(title) {
  const trimmed = String(title || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/^(pr[oó]xima tarea|next task):\s*/i, '').trim() || trimmed;
}

/**
 * Resuelve la próxima tarea desde el payload de foco o, en caché antigua, desde candidatos.
 * @param {{ nextTask?: object, reminder?: { candidates?: Array<object> } } | null | undefined} data
 */
export function resolveFocusNextTask(data) {
  const fromApi = data?.nextTask;
  if (fromApi?.title) {
    const _id = resolveFocusTaskId(fromApi);
    return {
      _id,
      title: String(fromApi.title).trim(),
      dueDate: fromApi.dueDate || null,
      itemType: fromApi.itemType || 'task',
    };
  }

  const candidate = data?.reminder?.candidates?.find((c) => c.kind === 'task');
  if (!candidate) return null;

  const _id = candidate.taskId ? String(candidate.taskId).trim() : '';
  const title = stripFocusTaskTitlePrefix(candidate.title);
  if (!title && !_id) return null;

  return {
    _id,
    title: title || String(candidate.title || '').trim(),
    dueDate: null,
    itemType: 'task',
    dueSubtitle: candidate.subtitle ? String(candidate.subtitle).trim() : null,
  };
}

/**
 * @param {{ _id?: string, taskId?: string, title?: string, dueDate?: string|Date, itemType?: string } | null | undefined} nextTask
 */
export function buildFocusNextTaskNavParams(nextTask) {
  const taskId = resolveFocusTaskId(nextTask);
  if (!taskId) {
    return { tab: 'tasks' };
  }

  return {
    tab: 'tasks',
    mode: 'view',
    taskId,
    task: {
      _id: taskId,
      title: nextTask?.title,
      dueDate: nextTask?.dueDate,
      itemType: nextTask?.itemType || 'task',
    },
  };
}

/**
 * @param {{ kind?: string, taskId?: string } | null | undefined} displayedReminder
 * @param {{ _id?: string, taskId?: string, title?: string, dueDate?: string|Date, itemType?: string } | null | undefined} nextTask
 */
export function buildFocusTaskOpenPayload(displayedReminder, nextTask) {
  const fromReminder =
    displayedReminder?.kind === 'task' && displayedReminder.taskId
      ? String(displayedReminder.taskId).trim()
      : '';
  const _id = fromReminder || resolveFocusTaskId(nextTask);
  if (!_id) {
    return nextTask?.title ? { title: nextTask.title, dueDate: nextTask?.dueDate } : null;
  }
  return {
    _id,
    taskId: _id,
    title: nextTask?.title,
    dueDate: nextTask?.dueDate,
    itemType: nextTask?.itemType || 'task',
  };
}

/**
 * @param {string} dueFormatted
 * @param {{ FOCUS_NEXT_TASK_DUE?: string }} texts
 */
export function formatFocusNextTaskDue(dueFormatted, texts = {}) {
  const template = texts.FOCUS_NEXT_TASK_DUE || 'Vence el {date}';
  return template.replace('{date}', dueFormatted);
}
