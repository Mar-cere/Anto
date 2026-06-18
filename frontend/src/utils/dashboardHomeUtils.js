const WEEKDAYS_ES = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];
const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const PERIOD_ES = {
  madrugada: 'Buenas noches',
  manana: 'Buenos días',
  mediodia: 'Buen mediodía',
  tarde: 'Buenas tardes',
  noche: 'Buenas noches',
};

const PERIOD_EN = {
  madrugada: 'Good evening',
  manana: 'Good morning',
  mediodia: 'Good midday',
  tarde: 'Good afternoon',
  noche: 'Good evening',
};

function getTimePeriod(hour) {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 12) return 'manana';
  if (hour >= 12 && hour < 14) return 'mediodia';
  if (hour >= 14 && hour < 19) return 'tarde';
  return 'noche';
}

/**
 * Eyebrow del header: "MARTES · BUENOS DÍAS"
 */
export function getDashboardEyebrow({ language = 'es', date = new Date() } = {}) {
  const isEn = language === 'en';
  const days = isEn ? WEEKDAYS_EN : WEEKDAYS_ES;
  const periodMap = isEn ? PERIOD_EN : PERIOD_ES;
  const dayLabel = days[date.getDay()] || days[0];
  const period = getTimePeriod(date.getHours());
  const periodLabel = periodMap[period] || periodMap.manana;
  const dayFormatted = isEn ? dayLabel : dayLabel.toUpperCase();
  return `${dayFormatted} · ${periodLabel}`;
}

export function getDashboardDisplayName(userData) {
  const raw =
    userData?.name ||
    userData?.username ||
    userData?.email?.split?.('@')?.[0] ||
    '';
  return String(raw).trim();
}

export function getProfileInitial(userData) {
  const name = getDashboardDisplayName(userData);
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

/**
 * Hábitos activos visibles en el home (no archivados).
 */
export function getActiveHabitsForDashboard(habits) {
  if (!Array.isArray(habits)) return [];
  return habits.filter((h) => !h?.status?.archived);
}

export function computeDashboardStreakDays(habits) {
  const active = getActiveHabitsForDashboard(habits);
  if (!active.length) return 0;
  return active.reduce((max, h) => Math.max(max, h.progress?.streak || 0), 0);
}

/**
 * Hábitos con al menos una completación en los últimos 7 días.
 */
export function computeHabitsActiveThisWeek(habits) {
  const active = getActiveHabitsForDashboard(habits);
  if (!active.length) return 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return active.filter((h) => {
    if (h.status?.completedToday) return true;
    const last = h.status?.lastCompleted;
    if (!last) return (h.progress?.streak || 0) > 0;
    return new Date(last).getTime() >= weekAgo;
  }).length;
}

export function pickAntoPromptFromFocus(focusPayload) {
  if (!focusPayload || typeof focusPayload !== 'object') return null;

  const dailyMood = focusPayload.dailyMood;
  if (dailyMood?.mood && dailyMood.antoSnippet) {
    return {
      title: 'Anto',
      snippet: dailyMood.antoSnippet,
      conversationId: null,
      kind: 'daily_mood',
      suggestChat: Boolean(dailyMood.suggestChat),
    };
  }

  const reminder = focusPayload.reminder?.candidates?.[0];
  if (reminder?.title) {
    return {
      title: 'Anto',
      snippet: reminder.subtitle || reminder.title,
      conversationId: reminder.conversationId || null,
      kind: reminder.kind || 'chat',
    };
  }

  const last = focusPayload.lastSessionSummary;
  const snippet = String(last?.snippet || last?.bridge || '').trim();
  if (snippet) {
    return {
      title: 'Anto',
      snippet,
      conversationId: last?.conversationId || null,
      kind: 'chat',
    };
  }

  const focusLine = String(focusPayload.focus?.line || '').trim();
  if (focusLine) {
    return { title: 'Anto', snippet: focusLine, conversationId: null, kind: 'focus' };
  }

  return null;
}

export function formatHabitRowMeta(habit, texts) {
  if (habit.status?.completedToday) {
    const streak = habit.progress?.streak || 0;
    if (streak > 0) {
      return texts.HABIT_META_COMPLETED_STREAK.replace('{streak}', String(streak));
    }
    return texts.HABIT_META_COMPLETED_TODAY;
  }
  return texts.HABIT_META_PENDING;
}
