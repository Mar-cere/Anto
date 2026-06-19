import {
  buildFocusNextTaskNavParams,
  buildFocusTaskOpenPayload,
  formatFocusNextTaskDue,
  resolveFocusNextTask,
  resolveFocusTaskId,
  stripFocusTaskTitlePrefix,
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
    expect(resolveFocusTaskId({ _id: '  ' })).toBe('');
    expect(resolveFocusTaskId({ taskId: 'task-1' })).toBe('task-1');
  });

  it('arma payload al tocar recordatorio de tarea', () => {
    expect(
      buildFocusTaskOpenPayload(
        { kind: 'task', taskId: 't9' },
        { _id: 't1', title: 'Llamar al médico', dueDate: '2026-06-20' },
      ),
    ).toEqual({
      _id: 't9',
      taskId: 't9',
      title: 'Llamar al médico',
      dueDate: '2026-06-20',
      itemType: 'task',
    });
  });

  it('formatea vencimiento con plantilla i18n', () => {
    expect(
      formatFocusNextTaskDue('20 jun', { FOCUS_NEXT_TASK_DUE: 'Vence el {date}' }),
    ).toBe('Vence el 20 jun');
    expect(
      formatFocusNextTaskDue('Jun 20', { FOCUS_NEXT_TASK_DUE: 'Due {date}' }),
    ).toBe('Due Jun 20');
  });

  it('quita prefijo localizado del título de candidato', () => {
    expect(stripFocusTaskTitlePrefix('Próxima tarea: Llamar al médico')).toBe('Llamar al médico');
    expect(stripFocusTaskTitlePrefix('Next task: Call doctor')).toBe('Call doctor');
    expect(stripFocusTaskTitlePrefix('Sin prefijo')).toBe('Sin prefijo');
  });

  it('resuelve próxima tarea desde API o candidatos', () => {
    expect(
      resolveFocusNextTask({
        nextTask: { _id: 't1', title: 'Llamar', dueDate: '2026-06-20' },
      }),
    ).toEqual({
      _id: 't1',
      title: 'Llamar',
      dueDate: '2026-06-20',
      itemType: 'task',
    });

    expect(
      resolveFocusNextTask({
        reminder: {
          candidates: [
            {
              kind: 'task',
              taskId: 't9',
              title: 'Próxima tarea: Pagar factura',
              subtitle: 'Vence hoy',
            },
          ],
        },
      }),
    ).toEqual({
      _id: 't9',
      title: 'Pagar factura',
      dueDate: null,
      itemType: 'task',
      dueSubtitle: 'Vence hoy',
    });

    expect(resolveFocusNextTask({ reminder: { candidates: [] } })).toBeNull();
    expect(resolveFocusNextTask(null)).toBeNull();
  });
});
