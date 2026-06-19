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

export function getDashboardFirstName(displayName) {
  const trimmed = String(displayName || '').trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function applyHeroTemplate(template, { firstName = '', days = 0 } = {}) {
  if (!template) return '';
  let text = template.replace(/\{days\}/g, String(days));
  if (firstName) {
    return text.replace(/\{name\}/g, firstName).replace(/\s{2,}/g, ' ').trim();
  }
  return text
    .replace(/\{name\},?\s*/gi, '')
    .replace(/\{name\}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const MOOD_HERO_VARIANT_COUNTS = {
  calm: 4,
  anxious: 4,
  tired: 4,
  good: 4,
};

const STREAK_ZERO_VARIANT_COUNT = 3;
const STREAK_ONE_VARIANT_COUNT = 3;
const STREAK_ACTIVE_VARIANT_COUNT = 3;

export function pickStableVariantIndex(seed, count) {
  if (!count || count <= 1) return 0;
  let hash = 0;
  const s = String(seed || 'default');
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

function readHeroPair(texts, titleKey, subtitleKey) {
  const title = texts[titleKey];
  const subtitle = texts[subtitleKey];
  if (!title || !subtitle) return null;
  return { title, subtitle };
}

function pickVariantHeroPair(texts, titlePrefix, subtitlePrefix, count, seed) {
  const idx = pickStableVariantIndex(seed, count);
  for (let offset = 0; offset < count; offset += 1) {
    const tryIdx = (idx + offset) % count;
    const pair = readHeroPair(texts, `${titlePrefix}${tryIdx}`, `${subtitlePrefix}${tryIdx}`);
    if (pair) return pair;
  }
  return readHeroPair(texts, titlePrefix.replace(/_$/, ''), subtitlePrefix.replace(/_$/, ''));
}

function pickMoodHeroPair(texts, mood, seed) {
  const moodKey = mood.toUpperCase();
  const count = MOOD_HERO_VARIANT_COUNTS[mood] || 1;
  return pickVariantHeroPair(
    texts,
    `STREAK_HERO_MOOD_${moodKey}_TITLE_`,
    `STREAK_HERO_MOOD_${moodKey}_SUBTITLE_`,
    count,
    seed,
  );
}

function heroSeed({ dailyMood, streakDays }) {
  const dateKey = dailyMood?.dateKey || new Date().toISOString().slice(0, 10);
  const mood = dailyMood?.mood || 'none';
  return `${dateKey}:${mood}:${streakDays}`;
}

/**
 * Copy del héroe de racha: voz de Anto, nombre y check-in del día si hay.
 */
export function buildStreakHeroCopy({
  streakDays = 0,
  displayName = '',
  dailyMood = null,
  texts = {},
} = {}) {
  const firstName = getDashboardFirstName(displayName);
  const apply = (template, opts = {}) =>
    applyHeroTemplate(template, { firstName, days: opts.days ?? streakDays });
  const seed = heroSeed({ dailyMood, streakDays });

  const mood = dailyMood?.mood;
  if (mood && MOOD_HERO_VARIANT_COUNTS[mood]) {
    const pair = pickMoodHeroPair(texts, mood, seed);
    if (pair) {
      return { title: apply(pair.title), subtitle: apply(pair.subtitle) };
    }
  }

  if (streakDays >= 2) {
    const pair = pickVariantHeroPair(
      texts,
      'STREAK_HERO_ACTIVE_TITLE_',
      'STREAK_HERO_ACTIVE_SUBTITLE_',
      STREAK_ACTIVE_VARIANT_COUNT,
      seed,
    );
    if (pair) {
      return { title: apply(pair.title, { days: streakDays }), subtitle: apply(pair.subtitle) };
    }
    return {
      title: apply(texts.STREAK_HERO_TITLE, { days: streakDays }),
      subtitle: apply(texts.STREAK_HERO_SUBTITLE_ACTIVE),
    };
  }
  if (streakDays === 1) {
    const pair = pickVariantHeroPair(
      texts,
      'STREAK_HERO_ONE_TITLE_',
      'STREAK_HERO_ONE_SUBTITLE_',
      STREAK_ONE_VARIANT_COUNT,
      seed,
    );
    if (pair) {
      return { title: apply(pair.title), subtitle: apply(pair.subtitle) };
    }
    return {
      title: apply(texts.STREAK_HERO_TITLE_ONE),
      subtitle: apply(texts.STREAK_HERO_SUBTITLE_START),
    };
  }

  const zeroPair = pickVariantHeroPair(
    texts,
    'STREAK_HERO_ZERO_TITLE_',
    'STREAK_HERO_ZERO_SUBTITLE_',
    STREAK_ZERO_VARIANT_COUNT,
    seed,
  );
  if (zeroPair) {
    return { title: apply(zeroPair.title), subtitle: apply(zeroPair.subtitle) };
  }

  const title = firstName
    ? texts.STREAK_HERO_TITLE_ZERO_NAMED
    : texts.STREAK_HERO_TITLE_ZERO;
  return {
    title: apply(title),
    subtitle: apply(texts.STREAK_HERO_SUBTITLE_ZERO),
  };
}

/**
 * Reacción de Anto tras el check-in de ánimo (solo el copy, sin CTA al chat).
 */
export function buildMoodAckCopy({
  mood,
  displayName = '',
  dateKey = null,
  texts = {},
} = {}) {
  if (!mood || !MOOD_HERO_VARIANT_COUNTS[mood]) return null;
  const firstName = getDashboardFirstName(displayName);
  const seed = heroSeed({
    dailyMood: { mood, dateKey: dateKey || new Date().toISOString().slice(0, 10) },
    streakDays: 0,
  });
  const pair = pickMoodHeroPair(texts, mood, seed);
  if (!pair) return null;
  const apply = (template) => applyHeroTemplate(template, { firstName });
  const subtitle = apply(pair.subtitle);
  const title = apply(pair.title);
  return { line: subtitle || title, title, subtitle };
}

/** Texto visible de continuidad del último chat en el foco del dashboard. */
export function getLastSessionDisplayText(lastSession) {
  if (!lastSession) return '';
  const snippet = String(lastSession.snippet || '').trim();
  const bridge = String(lastSession.bridge || '').trim();
  if (lastSession.placeholder && bridge) return bridge;
  if (snippet) return snippet;
  return bridge;
}

export function hasDashboardChatContinuity(lastSession) {
  return Boolean(getLastSessionDisplayText(lastSession));
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
 * Racha de ecosistema (API) con fallback a hábitos.
 * @param {{ engagementStreak?: { current?: number } }|null|undefined} focusPayload
 * @param {Array} habits
 */
export function resolveDashboardStreakDays(focusPayload, habits) {
  const fromApi = focusPayload?.engagementStreak?.current;
  if (typeof fromApi === 'number' && Number.isFinite(fromApi)) {
    return Math.max(0, fromApi);
  }
  return computeDashboardStreakDays(habits);
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
