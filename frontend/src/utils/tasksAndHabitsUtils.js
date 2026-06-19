import { bucketTaskItem } from './taskDateSections';
import { FREQUENCY_TYPES } from '../screens/habits/habitsScreenConstants';

export function hasAntoOrigin(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.chatOrigin?.source) return true;
  if (item.baOrigin?.source) return true;
  return false;
}

export function filterHabitsByFrequency(habits, frequencyFilter) {
  if (!Array.isArray(habits)) return [];
  if (frequencyFilter === 'all') return habits;
  if (frequencyFilter === FREQUENCY_TYPES.WEEKLY) {
    return habits.filter((h) => h.frequency === FREQUENCY_TYPES.WEEKLY);
  }
  return habits.filter(
    (h) => !h.frequency || h.frequency === FREQUENCY_TYPES.DAILY,
  );
}

export function computeHabitsTodayProgress(habits) {
  const list = Array.isArray(habits) ? habits : [];
  const total = list.length;
  const completed = list.filter((h) => h?.status?.completedToday).length;
  const pending = total - completed;
  const maxStreak = list.reduce(
    (max, h) => Math.max(max, h?.progress?.streak || 0),
    0,
  );
  const progress = total > 0 ? completed / total : 0;
  return { total, completed, pending, maxStreak, progress };
}

export function buildUnifiedTaskSections(items, sectionTitles = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const pending = items.filter((item) => !item.completed);
  const today = [];
  const upcoming = [];
  const attention = [];

  pending.forEach((item) => {
    const bucket = bucketTaskItem(item);
    if (bucket === 'overdue') {
      attention.push(item);
      return;
    }
    if (bucket === 'today') {
      today.push(item);
      return;
    }
    if (bucket === 'tomorrow' || bucket === 'this_week') {
      upcoming.push(item);
    }
  });

  const byDueDate = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);
  today.sort(byDueDate);
  upcoming.sort(byDueDate);
  attention.sort(byDueDate);

  const sections = [];
  if (today.length > 0) {
    sections.push({
      key: 'today',
      title: sectionTitles.today || 'Hoy',
      data: today,
      tone: 'default',
    });
  }
  if (upcoming.length > 0) {
    sections.push({
      key: 'upcoming',
      title: sectionTitles.upcoming || 'Próximas',
      data: upcoming,
      tone: 'default',
    });
  }
  if (attention.length > 0) {
    sections.push({
      key: 'attention',
      title: sectionTitles.attention || 'Requieren atención',
      data: attention,
      tone: 'attention',
    });
  }
  return sections;
}

export function computeTasksSummaryCounts(items) {
  const list = Array.isArray(items) ? items : [];
  const pending = list.filter((item) => !item.completed);
  let todayCount = 0;
  let upcomingCount = 0;
  let attentionCount = 0;

  pending.forEach((item) => {
    const bucket = bucketTaskItem(item);
    if (bucket === 'overdue') {
      attentionCount += 1;
      return;
    }
    if (bucket === 'today') {
      todayCount += 1;
      return;
    }
    if (bucket === 'tomorrow' || bucket === 'this_week') {
      upcomingCount += 1;
    }
  });

  return { todayCount, upcomingCount, attentionCount };
}

export function formatTasksAndHabitsHeaderDate(date = new Date(), locale = 'es-ES') {
  try {
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return '';
  }
}

export function capitalizeFirstLetter(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
