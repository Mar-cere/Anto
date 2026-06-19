/**
 * Arma el copy del bloque de memoria del paywall a partir de actividad del día.
 * @param {{
 *   hasCheckIn?: boolean,
 *   isFirstCheckIn?: boolean,
 *   habitsStartedToday?: number,
 *   tasksCompletedToday?: number,
 *   chatMessagesToday?: number,
 * } | null | undefined} stats
 * @param {Record<string, string>} texts
 */
export function buildPaywallMemoryCopy(stats, texts) {
  if (!stats) {
    return {
      lead: texts.PAYWALL_MEMORY_FALLBACK,
      highlights: [],
      outro: texts.PAYWALL_MEMORY_OUTRO,
    };
  }

  const highlights = [];

  if (stats.hasCheckIn) {
    highlights.push(
      stats.isFirstCheckIn
        ? texts.PAYWALL_MEMORY_FIRST_CHECKIN
        : texts.PAYWALL_MEMORY_CHECKIN_TODAY,
    );
  }

  const habits = Number(stats.habitsStartedToday) || 0;
  if (habits > 0) {
    const tpl =
      habits === 1 ? texts.PAYWALL_MEMORY_HABITS_ONE : texts.PAYWALL_MEMORY_HABITS_MANY;
    highlights.push(tpl.replace('{count}', String(habits)));
  }

  const tasks = Number(stats.tasksCompletedToday) || 0;
  if (tasks > 0) {
    const tpl =
      tasks === 1 ? texts.PAYWALL_MEMORY_TASKS_ONE : texts.PAYWALL_MEMORY_TASKS_MANY;
    highlights.push(tpl.replace('{count}', String(tasks)));
  }

  const messages = Number(stats.chatMessagesToday) || 0;
  if (messages > 0) {
    const tpl =
      messages === 1
        ? texts.PAYWALL_MEMORY_CHAT_ONE
        : texts.PAYWALL_MEMORY_CHAT_MANY;
    highlights.push(tpl.replace('{count}', String(messages)));
  }

  if (highlights.length === 0) {
    return {
      lead: texts.PAYWALL_MEMORY_FALLBACK,
      highlights: [],
      outro: texts.PAYWALL_MEMORY_OUTRO,
    };
  }

  const joiner = texts.PAYWALL_MEMORY_JOINER || ' y ';
  const marked = highlights.map((h) => `**${h}**`).join(joiner);
  return {
    lead: `${texts.PAYWALL_MEMORY_TODAY_PREFIX}${marked}.`,
    highlights,
    outro: texts.PAYWALL_MEMORY_OUTRO,
  };
}

/**
 * Heurística local: primer día con señales solo de check-in.
 */
export function inferFirstCheckInToday(stats) {
  if (!stats?.hasCheckIn) return false;
  const other =
    (Number(stats.habitsStartedToday) || 0) +
    (Number(stats.tasksCompletedToday) || 0) +
    (Number(stats.chatMessagesToday) || 0);
  return other === 0;
}
