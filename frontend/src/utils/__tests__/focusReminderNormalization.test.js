import {
  focusReminderIcon,
  normalizePreloadedChatCopy,
  normalizeReminderForLanguage,
  pickDisplayedReminder,
  resolveDisplayedReminder,
} from '../focusReminderNormalization';

const DASH = {
  FOCUS_PUSH_SCHEDULED_MORNING: 'Scheduled reminder (morning)',
  FOCUS_PUSH_SCHEDULED_EVENING: 'Scheduled reminder (evening)',
  FOCUS_PUSH_SCHEDULED_GENERIC: 'Scheduled reminder',
  FOCUS_REMINDER_NEXT_TASK_PREFIX: 'Next task:',
  FOCUS_REMINDER_HABIT_PREFIX: 'Habit:',
  FOCUS_REMINDER_AROUND_PREFIX: 'Reminder around',
  FOCUS_REMINDER_DUE_PREFIX: 'Due ',
  FOCUS_PRELOADED_LAST_CHAT_TITLE_EN: 'Resume your last conversation',
  FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_EN: 'Last chat activity: {days} days ago.',
  FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_FALLBACK_EN: 'Recent activity in chat.',
  FOCUS_PRELOADED_LAST_CHAT_TITLE_ES: 'Retoma tu última conversación',
  FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_ES: 'Última actividad en el chat: hace {days} días.',
  FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_FALLBACK_ES: 'Actividad reciente en el chat.',
};

describe('focusReminderNormalization', () => {
  it('pickDisplayedReminder prioriza no-hábito en vista compacta', () => {
    const candidates = [
      { kind: 'habit', title: 'Hábito' },
      { kind: 'task', title: 'Tarea' },
    ];
    expect(pickDisplayedReminder(candidates, true)).toEqual(candidates[1]);
    expect(pickDisplayedReminder(candidates, false)).toEqual(candidates[0]);
  });

  it('normalizeReminderForLanguage traduce prefijos legacy', () => {
    const reminder = {
      kind: 'task',
      title: 'Próxima tarea: Llamar',
      subtitle: 'vence el 12 jun',
    };
    const out = normalizeReminderForLanguage(reminder, 'en', DASH);
    expect(out.title).toBe('Next task: Llamar');
    expect(out.subtitle).toBe('Due 12 jun');
  });

  it('normalizeReminderForLanguage traduce due → vence el en español', () => {
    const reminder = { kind: 'task', title: 'Next task: Call', subtitle: 'due Jun 12' };
    const dashEs = { ...DASH, FOCUS_REMINDER_DUE_PREFIX: 'Vence el ' };
    const out = normalizeReminderForLanguage(reminder, 'es', dashEs);
    expect(out.subtitle).toBe('Vence el Jun 12');
  });

  it('normalizePreloadedChatCopy localiza título español en UI inglesa', () => {
    const reminder = {
      kind: 'chat',
      title: 'Retoma tu última conversación',
      subtitle: 'Ultima actividad en el chat: hace 3 dias.',
    };
    const out = normalizePreloadedChatCopy(reminder, 'en', DASH);
    expect(out.title).toBe('Resume your last conversation');
    expect(out.subtitle).toBe('Last chat activity: 3 days ago.');
  });

  it('focusReminderIcon mapea kinds conocidos', () => {
    expect(focusReminderIcon('chat')).toBe('chatbubble-outline');
    expect(focusReminderIcon('task')).toBe('calendar-outline');
    expect(focusReminderIcon('unknown')).toBe('ellipse-outline');
  });

  it('resolveDisplayedReminder aplica pick + idioma + chat precargado', () => {
    const reminder = {
      candidates: [
        {
          kind: 'chat',
          title: 'Retoma tu última conversación',
          subtitle: 'Ultima actividad en el chat: hace 2 dias.',
        },
      ],
    };
    const out = resolveDisplayedReminder(reminder, false, 'en', DASH);
    expect(out.title).toBe('Resume your last conversation');
    expect(out.subtitle).toContain('2 days ago');
  });
});
