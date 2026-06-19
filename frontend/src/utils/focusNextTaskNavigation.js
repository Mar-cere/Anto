/**
 * Navegación desde el bloque de foco hacia tareas.
 */

/**
 * @param {{ _id?: string, title?: string, dueDate?: string|Date, itemType?: string } | null | undefined} nextTask
 */
export function buildFocusNextTaskNavParams(nextTask) {
  const taskId = nextTask?._id ? String(nextTask._id).trim() : '';
  if (!taskId) {
    return { tab: 'tasks' };
  }

  return {
    tab: 'tasks',
    mode: 'view',
    taskId,
    task: {
      _id: taskId,
      title: nextTask.title,
      dueDate: nextTask.dueDate,
      itemType: nextTask.itemType || 'task',
    },
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
