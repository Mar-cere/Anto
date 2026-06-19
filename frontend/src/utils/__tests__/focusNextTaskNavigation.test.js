import {
  buildFocusNextTaskNavParams,
  formatFocusNextTaskDue,
} from '../focusNextTaskNavigation';

describe('focusNextTaskNavigation', () => {
  it('navega al detalle cuando hay id de tarea', () => {
    expect(
      buildFocusNextTaskNavParams({
        _id: 'abc123',
        title: 'Llamar al médico',
        dueDate: '2026-06-20T10:00:00.000Z',
      }),
    ).toEqual({
      tab: 'tasks',
      mode: 'view',
      taskId: 'abc123',
      task: {
        _id: 'abc123',
        title: 'Llamar al médico',
        dueDate: '2026-06-20T10:00:00.000Z',
        itemType: 'task',
      },
    });
  });

  it('navega solo a la lista si no hay id', () => {
    expect(buildFocusNextTaskNavParams({ title: 'Sin id' })).toEqual({ tab: 'tasks' });
    expect(buildFocusNextTaskNavParams(null)).toEqual({ tab: 'tasks' });
  });

  it('formatea vencimiento con plantilla i18n', () => {
    expect(
      formatFocusNextTaskDue('20 jun', { FOCUS_NEXT_TASK_DUE: 'Vence el {date}' }),
    ).toBe('Vence el 20 jun');
    expect(
      formatFocusNextTaskDue('Jun 20', { FOCUS_NEXT_TASK_DUE: 'Due {date}' }),
    ).toBe('Due Jun 20');
  });
});
