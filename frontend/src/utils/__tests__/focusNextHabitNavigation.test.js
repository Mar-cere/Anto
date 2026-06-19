import {
  buildFocusHabitOpenPayload,
  buildFocusNextHabitNavParams,
  formatFocusNextHabitReminder,
  resolveFocusHabitId,
  resolveFocusNextHabit,
  resolveFocusNextHabitSubtitle,
  stripFocusHabitTitlePrefix,
} from '../focusNextHabitNavigation';

describe('focusNextHabitNavigation', () => {
  it('navega al detalle cuando hay id de hábito', () => {
    expect(
      buildFocusNextHabitNavParams({
        _id: 'habit-abc',
        title: 'Meditar',
      }),
    ).toEqual({
      tab: 'habits',
      habitId: 'habit-abc',
      habit: {
        _id: 'habit-abc',
        title: 'Meditar',
      },
    });
  });

  it('acepta habitId como alias de _id', () => {
    expect(
      buildFocusNextHabitNavParams({
        habitId: 'habit-xyz',
        title: 'Tomar agua',
      }),
    ).toEqual({
      tab: 'habits',
      habitId: 'habit-xyz',
      habit: {
        _id: 'habit-xyz',
        title: 'Tomar agua',
      },
    });
  });

  it('ignora ids vacíos o solo espacios', () => {
    expect(buildFocusNextHabitNavParams({ _id: '   ', title: 'X' })).toEqual({ tab: 'habits' });
    expect(resolveFocusHabitId({ _id: '  ' })).toBe('');
    expect(resolveFocusHabitId({ _id: '  abc  ' })).toBe('abc');
  });

  it('navega solo a la lista si no hay id', () => {
    expect(buildFocusNextHabitNavParams({ title: 'Sin id' })).toEqual({ tab: 'habits' });
    expect(buildFocusNextHabitNavParams(null)).toEqual({ tab: 'habits' });
  });

  it('formatea recordatorio con plantilla i18n', () => {
    expect(
      formatFocusNextHabitReminder('08:30', { FOCUS_REMINDER_AROUND_PREFIX: 'Recordatorio hacia las' }),
    ).toBe('Recordatorio hacia las 08:30');
    expect(
      formatFocusNextHabitReminder('8:30 AM', { FOCUS_REMINDER_AROUND_PREFIX: 'Reminder around' }),
    ).toBe('Reminder around 8:30 AM');
    expect(formatFocusNextHabitReminder('', { FOCUS_REMINDER_AROUND_PREFIX: 'X' })).toBeNull();
  });

  it('resuelve nextHabit desde API', () => {
    expect(
      resolveFocusNextHabit({
        nextHabit: {
          _id: 'h1',
          title: 'Meditar',
          reminderAt: '2026-06-16T08:30:00.000Z',
        },
      }),
    ).toEqual({
      _id: 'h1',
      title: 'Meditar',
      reminderAt: '2026-06-16T08:30:00.000Z',
      reminderSubtitle: null,
    });
  });

  it('hace fallback a candidatos si falta nextHabit en API', () => {
    expect(
      resolveFocusNextHabit({
        reminder: {
          candidates: [
            { kind: 'task', title: 'Tarea' },
            {
              kind: 'habit',
              habitId: 'h2',
              title: 'Hábito: Tomar agua',
              subtitle: 'Recordatorio hacia las 18:00',
            },
          ],
        },
      }),
    ).toEqual({
      _id: 'h2',
      title: 'Tomar agua',
      reminderAt: null,
      reminderSubtitle: 'Recordatorio hacia las 18:00',
    });
  });

  it('quita prefijo de título de hábito', () => {
    expect(stripFocusHabitTitlePrefix('Hábito: Meditar')).toBe('Meditar');
    expect(stripFocusHabitTitlePrefix('Habit: Drink water')).toBe('Drink water');
  });

  it('arma payload al tocar recordatorio de hábito', () => {
    expect(
      buildFocusHabitOpenPayload(
        { kind: 'habit', habitId: 'h9' },
        { _id: 'h1', title: 'Meditar' },
      ),
    ).toEqual({
      _id: 'h9',
      title: 'Meditar',
      habitId: 'h9',
    });
  });

  it('usa subtítulo del candidato si no hay reminderAt', () => {
    expect(
      resolveFocusNextHabitSubtitle(
        { reminderSubtitle: 'Recordatorio hacia las 18:00' },
        'es',
        { FOCUS_REMINDER_AROUND_PREFIX: 'Recordatorio hacia las' },
      ),
    ).toBe('Recordatorio hacia las 18:00');
  });
});
