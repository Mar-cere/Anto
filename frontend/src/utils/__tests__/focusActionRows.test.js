import {
  buildFocusActionRows,
  buildFocusBaWeekCopy,
  buildFocusExposureCopy,
  buildFocusNextHabitCopy,
  buildFocusNextTaskCopy,
} from '../focusActionRows';

const DASH = {
  FOCUS_REMINDER_NEXT_TASK_PREFIX: 'Próxima tarea:',
  FOCUS_REMINDER_HABIT_PREFIX: 'Hábito:',
  FOCUS_NEXT_TASK_OPEN_A11Y: 'Abrir tarea',
  FOCUS_NEXT_HABIT_OPEN_A11Y: 'Abrir hábito',
  FOCUS_NEXT_TASK_DUE: 'Vence el {date}',
  FOCUS_BA_TODAY: 'Activación conductual · Hoy',
  FOCUS_BA_UPCOMING: 'Activación conductual',
  FOCUS_BA_MORE_SUFFIX: 'actividades más esta semana',
  FOCUS_EXPOSURE_TITLE: 'Exposición · Paso en curso',
  FOCUS_EXPOSURE_STEP_LABEL: 'Paso',
  FOCUS_EXPOSURE_OPEN_A11Y: 'Abrir exposición',
  FOCUS_BA_OPEN_A11Y: 'Abrir BA',
  FOCUS_CHAT_CONTINUITY_HEADLINE: 'Retomar el chat',
  FOCUS_CHAT_CONTINUITY_BADGE: 'Vista rápida',
  FOCUS_CHAT_CONTINUITY_RECENT_BADGE: 'Actividad reciente',
  FOCUS_EXPERIENTIAL_FOLLOW_UP_HEADLINE: 'Hay algo de tu proceso para retomar',
  FOCUS_EXPERIENTIAL_FOLLOW_UP_OPEN_A11Y: 'Abrir chat para retomar',
};

describe('focusActionRows', () => {
  it('buildFocusNextTaskCopy arma título y vencimiento', () => {
    const copy = buildFocusNextTaskCopy({
      showNextTaskRow: true,
      nextTask: { title: 'Llamar al médico', dueDate: '2026-06-20T10:00:00.000Z' },
      DASH,
      language: 'es',
    });
    expect(copy.title).toBe('Próxima tarea: Llamar al médico');
    expect(copy.subtitle).toMatch(/Vence el/);
  });

  it('buildFocusNextTaskCopy devuelve null sin fila', () => {
    expect(
      buildFocusNextTaskCopy({ showNextTaskRow: false, nextTask: { title: 'X' }, DASH, language: 'es' }),
    ).toBeNull();
  });

  it('buildFocusExposureCopy usa etiqueta i18n del paso', () => {
    const copy = buildFocusExposureCopy(
      {
        planTitle: 'Miedo social',
        stepDescription: 'Saludar a un vecino',
        stepIndex: 2,
        stepTotal: 5,
      },
      DASH,
    );
    expect(copy.title).toBe('Exposición · Paso en curso');
    expect(copy.subtitle).toContain('Paso 2/5');
    expect(copy.subtitle).toContain('Saludar a un vecino');
  });

  it('buildFocusBaWeekCopy agrega actividades extra cuando hay varias hoy', () => {
    const copy = buildFocusBaWeekCopy(
      {
        activityDescription: 'Dar un paseo',
        isToday: true,
        pendingCount: 3,
      },
      DASH,
    );
    expect(copy.title).toBe('Activación conductual · Hoy');
    expect(copy.subtitle).toContain('2 actividades más esta semana');
  });

  it('buildFocusActionRows respeta orden y omite filas sin handler', () => {
    const onNextTaskPress = jest.fn();
    const rows = buildFocusActionRows({
      DASH,
      nextTaskCopy: { title: 'Próxima tarea: X', subtitle: 'Vence el 1 jun' },
      onOpenNextTask: true,
      onNextTaskPress,
      nextHabitCopy: null,
      onOpenNextHabit: null,
      onNextHabitPress: jest.fn(),
      showChatReminder: false,
      displayedReminder: null,
      reminderIsPressable: false,
      onReminderPress: jest.fn(),
      baWeekCopy: null,
      onBaWeekPress: jest.fn(),
      exposureCopy: null,
      onExposurePress: jest.fn(),
      showLastSessionRow: true,
      lastSession: { headline: 'Seguir hablando' },
      lastSessionText: 'Resumen corto',
      lastSessionFullText: 'Resumen completo del hilo',
      onLastSessionPress: jest.fn(),
    });
    expect(rows.map((r) => r.key)).toEqual(['next-task', 'last-session']);
    expect(rows[0].showChevron).toBe(true);
    expect(rows[1].badge).toBeNull();
    expect(rows[1].subtitleLines).toBe(2);
  });

  it('buildFocusActionRows prioriza follow-up experiencial sobre continuidad', () => {
    const onExperientialFollowUpPress = jest.fn();
    const rows = buildFocusActionRows({
      DASH,
      nextTaskCopy: null,
      onOpenNextTask: null,
      onNextTaskPress: jest.fn(),
      nextHabitCopy: null,
      onOpenNextHabit: null,
      onNextHabitPress: jest.fn(),
      showChatReminder: false,
      displayedReminder: null,
      reminderIsPressable: false,
      onReminderPress: jest.fn(),
      baWeekCopy: null,
      onBaWeekPress: jest.fn(),
      exposureCopy: null,
      onExposurePress: jest.fn(),
      showLastSessionRow: true,
      lastSession: { headline: 'Seguir hablando' },
      lastSessionText: 'Resumen corto',
      lastSessionFullText: 'Resumen completo',
      onLastSessionPress: jest.fn(),
      experientialFollowUpDue: {
        id: 'pat-1',
        statementPreview: 'las mañanas eran difíciles',
      },
      onExperientialFollowUpPress,
    });
    expect(rows.map((r) => r.key)).toEqual(['experiential-follow-up', 'last-session']);
    expect(rows[0].subtitle).toMatch(/mañanas/);
  });

  it('buildFocusActionRows incluye recordatorio de chat cuando aplica', () => {
    const rows = buildFocusActionRows({
      DASH,
      nextTaskCopy: null,
      onOpenNextTask: null,
      onNextTaskPress: jest.fn(),
      nextHabitCopy: null,
      onOpenNextHabit: null,
      onNextHabitPress: jest.fn(),
      showChatReminder: true,
      displayedReminder: { kind: 'chat', title: 'Chat', subtitle: 'Hola' },
      reminderIsPressable: true,
      onReminderPress: jest.fn(),
      baWeekCopy: null,
      onBaWeekPress: jest.fn(),
      exposureCopy: null,
      onExposurePress: jest.fn(),
      showLastSessionRow: false,
      lastSession: null,
      lastSessionText: '',
      lastSessionFullText: '',
      onLastSessionPress: jest.fn(),
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe('reminder-chat');
    expect(rows[0].icon).toBe('chatbubble-outline');
  });
});
