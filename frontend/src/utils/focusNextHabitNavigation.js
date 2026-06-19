/**
 * Navegación desde el bloque de foco hacia hábitos.
 */

/**
 * @param {{ _id?: string, habitId?: string } | null | undefined} habit
 */
export function resolveFocusHabitId(habit) {
  if (!habit) return '';
  for (const raw of [habit._id, habit.habitId]) {
    const id = raw != null ? String(raw).trim() : '';
    if (id) return id;
  }
  return '';
}

/**
 * Quita prefijo localizado del título de recordatorio de hábito.
 * @param {string} title
 */
export function stripFocusHabitTitlePrefix(title) {
  const trimmed = String(title || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/^(h[aá]bito|habit):\s*/i, '').trim() || trimmed;
}

/**
 * Resuelve el próximo hábito desde el payload de foco o, en caché antigua, desde candidatos.
 * @param {{ nextHabit?: object, reminder?: { candidates?: Array<object> } } | null | undefined} data
 */
export function resolveFocusNextHabit(data) {
  const fromApi = data?.nextHabit;
  if (fromApi?.title) {
    const _id = resolveFocusHabitId(fromApi);
    return {
      _id,
      title: String(fromApi.title).trim(),
      reminderAt: fromApi.reminderAt || null,
      reminderSubtitle: fromApi.reminderSubtitle || null,
    };
  }

  const candidate = data?.reminder?.candidates?.find((c) => c.kind === 'habit');
  if (!candidate) return null;

  const _id = candidate.habitId ? String(candidate.habitId).trim() : '';
  const title = stripFocusHabitTitlePrefix(candidate.title);
  if (!title && !_id) return null;

  return {
    _id,
    title: title || String(candidate.title || '').trim(),
    reminderAt: null,
    reminderSubtitle: candidate.subtitle ? String(candidate.subtitle).trim() : null,
  };
}

/**
 * @param {{ kind?: string, habitId?: string } | null | undefined} displayedReminder
 * @param {{ _id?: string, habitId?: string, title?: string } | null | undefined} nextHabit
 */
export function buildFocusHabitOpenPayload(displayedReminder, nextHabit) {
  const fromReminder =
    displayedReminder?.kind === 'habit' && displayedReminder.habitId
      ? String(displayedReminder.habitId).trim()
      : '';
  const _id = fromReminder || resolveFocusHabitId(nextHabit);
  if (!_id) {
    return nextHabit?.title ? { title: nextHabit.title } : null;
  }
  return {
    _id,
    title: nextHabit?.title,
    habitId: _id,
  };
}

/**
 * @param {{ _id?: string, habitId?: string, title?: string } | null | undefined} nextHabit
 */
export function buildFocusNextHabitNavParams(nextHabit) {
  const habitId = resolveFocusHabitId(nextHabit);
  if (!habitId) {
    return { tab: 'habits' };
  }

  return {
    tab: 'habits',
    habitId,
    habit: {
      _id: habitId,
      title: nextHabit?.title,
    },
  };
}

/**
 * @param {string} timeFormatted
 * @param {{ FOCUS_REMINDER_AROUND_PREFIX?: string }} texts
 */
export function formatFocusNextHabitReminder(timeFormatted, texts = {}) {
  const prefix = texts.FOCUS_REMINDER_AROUND_PREFIX || 'Recordatorio hacia las';
  const time = String(timeFormatted || '').trim();
  if (!time) return null;
  return `${prefix} ${time}`;
}

/**
 * @param {{ reminderAt?: string|null, reminderSubtitle?: string|null }} nextHabit
 * @param {'es'|'en'|string} language
 * @param {{ FOCUS_REMINDER_AROUND_PREFIX?: string }} texts
 */
export function resolveFocusNextHabitSubtitle(nextHabit, language, texts = {}) {
  if (!nextHabit) return null;
  if (nextHabit.reminderAt) {
    try {
      const dt = new Date(nextHabit.reminderAt);
      const locale = language === 'en' ? 'en-US' : 'es-ES';
      const timeFormatted = dt.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      const fromTime = formatFocusNextHabitReminder(timeFormatted, texts);
      if (fromTime) return fromTime;
    } catch {
      /* fallback a subtítulo del candidato */
    }
  }
  const fallback = nextHabit.reminderSubtitle
    ? String(nextHabit.reminderSubtitle).trim()
    : '';
  return fallback || null;
}
