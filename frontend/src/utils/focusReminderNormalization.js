/**
 * Normalización de recordatorios del bloque de foco (legacy ES/EN, chat precargado).
 */

export const FOCUS_COMPACT_WIDTH = 400;

export function pickDisplayedReminder(candidates, compact) {
  if (!candidates?.length) return null;
  if (!compact) return candidates[0];
  const nonHabit = candidates.find((c) => c.kind !== 'habit');
  return nonHabit || candidates[0];
}

export function formatFocusDueDate(d, language) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return dt.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function focusReminderIcon(kind) {
  switch (kind) {
    case 'chat':
      return 'chatbubble-outline';
    case 'task':
      return 'calendar-outline';
    case 'habit':
      return 'leaf-outline';
    case 'push':
      return 'notifications-outline';
    default:
      return 'ellipse-outline';
  }
}

/** Ajusta recordatorios legacy en español cuando la UI está en inglés (p. ej. caché). */
export function normalizeReminderForLanguage(reminder, language, DASH) {
  if (!reminder) return reminder;
  const isEnglish = language === 'en';
  let title = String(reminder.title || '').trim();
  let subtitle = reminder.subtitle != null ? String(reminder.subtitle).trim() : '';

  if (isEnglish) {
    if (/recordatorio programado\s*\((?:por\s+la\s+)?mañana\)/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_MORNING;
    } else if (/recordatorio programado\s*\(tarde/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_EVENING;
    } else if (/^recordatorio programado$/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_GENERIC;
    } else if (/^pr[oó]xima tarea:/i.test(title)) {
      title = title.replace(/^pr[oó]xima tarea:/i, DASH.FOCUS_REMINDER_NEXT_TASK_PREFIX);
    } else if (/^h[aá]bito:/i.test(title)) {
      title = title.replace(/^h[aá]bito:/i, DASH.FOCUS_REMINDER_HABIT_PREFIX);
    }
    if (/^recordatorio hacia las/i.test(subtitle)) {
      subtitle = subtitle.replace(/^recordatorio hacia las/i, DASH.FOCUS_REMINDER_AROUND_PREFIX);
    } else if (/^vence el /i.test(subtitle)) {
      subtitle = subtitle.replace(/^vence el /i, DASH.FOCUS_REMINDER_DUE_PREFIX);
    }
  } else if (language === 'es') {
    if (/^scheduled reminder\s*\(morning\)/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_MORNING;
    } else if (/^scheduled reminder\s*\(evening/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_EVENING;
    } else if (/^next task:/i.test(title)) {
      title = title.replace(/^next task:/i, DASH.FOCUS_REMINDER_NEXT_TASK_PREFIX);
    } else if (/^habit:/i.test(title)) {
      title = title.replace(/^habit:/i, DASH.FOCUS_REMINDER_HABIT_PREFIX);
    }
    if (/^reminder around /i.test(subtitle)) {
      subtitle = subtitle.replace(/^reminder around /i, `${DASH.FOCUS_REMINDER_AROUND_PREFIX} `);
    } else if (/^due /i.test(subtitle)) {
      subtitle = subtitle.replace(/^due /i, DASH.FOCUS_REMINDER_DUE_PREFIX);
    }
  }

  if (title === reminder.title && subtitle === (reminder.subtitle || '')) return reminder;
  return { ...reminder, title, subtitle: subtitle || null };
}

export function normalizePreloadedChatCopy(reminder, language, DASH) {
  if (!reminder || reminder.kind !== 'chat') return reminder;
  const originalTitle = String(reminder.title || '').trim();
  const originalSubtitle = String(reminder.subtitle || '').trim();
  if (!originalTitle && !originalSubtitle) return reminder;

  const isEnglish = language === 'en';
  const titleLooksSpanish = /retoma tu ultima conversacion|retoma tu última conversación/i.test(originalTitle);
  const titleLooksEnglish = /resume your last conversation/i.test(originalTitle);
  const subtitleSpanishMatch = originalSubtitle.match(/ultima actividad en el chat:\s*hace\s*(\d+)\s*d[ii]as?\.?/i);
  const subtitleEnglishMatch = originalSubtitle.match(/last chat activity:\s*(\d+)\s*days?\s*ago\.?/i);

  if (isEnglish) {
    if (titleLooksSpanish) {
      return {
        ...reminder,
        title: DASH.FOCUS_PRELOADED_LAST_CHAT_TITLE_EN,
        subtitle: subtitleSpanishMatch
          ? DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_EN.replace('{days}', subtitleSpanishMatch[1])
          : DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_FALLBACK_EN,
      };
    }
    return reminder;
  }

  if (titleLooksEnglish) {
    return {
      ...reminder,
      title: DASH.FOCUS_PRELOADED_LAST_CHAT_TITLE_ES,
      subtitle: subtitleEnglishMatch
        ? DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_ES.replace('{days}', subtitleEnglishMatch[1])
        : DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_FALLBACK_ES,
    };
  }
  return reminder;
}

export function resolveDisplayedReminder(reminder, isCompact, language, DASH) {
  const picked = pickDisplayedReminder(reminder?.candidates, isCompact);
  const localized = normalizeReminderForLanguage(picked, language, DASH);
  return normalizePreloadedChatCopy(localized, language, DASH);
}
