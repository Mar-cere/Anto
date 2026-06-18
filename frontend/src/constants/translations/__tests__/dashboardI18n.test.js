/**
 * Claves i18n críticas del home/dashboard: paridad ES/EN y tono neutro.
 */
import en from '../en';
import es from '../es';

const ES_VOSEO =
  /\b(podés|querés|tenés|sabés|andá|dejá|contame|seguí|abrí|mirá|vení|decí|sentí|recordá|llegás|sentís)\b/i;

function hasSpanishVoseo(text) {
  return typeof text === 'string' && ES_VOSEO.test(text);
}

const DASH_HOME_KEYS = [
  'HOME_GREETING_NAME',
  'HOME_GREETING_FALLBACK',
  'MOOD_SECTION_LABEL',
  'MOOD_QUESTION',
  'MOOD_CALM',
  'MOOD_ANXIOUS',
  'MOOD_TIRED',
  'MOOD_GOOD',
  'MOOD_ACK_CHAT_HINT',
  'MOOD_OPEN_CHAT_CTA',
  'STREAK_HERO_TITLE',
  'STREAK_HERO_TITLE_ONE',
  'STREAK_HERO_TITLE_ZERO',
  'STREAK_HERO_SUBTITLE_ACTIVE',
  'STREAK_HERO_SUBTITLE_START',
  'STREAK_HERO_SUBTITLE_ZERO',
  'STREAK_HERO_CTA',
  'STAT_STREAK_DAYS',
  'STAT_HABITS_WEEK',
  'HABITS_TODAY_TITLE',
  'HABITS_VIEW_ALL',
  'HABIT_META_COMPLETED_STREAK',
  'HABIT_META_COMPLETED_TODAY',
  'HABIT_META_PENDING',
  'FOCUS_TITLE',
  'FOCUS_CHAT_CTA',
  'ANTO_PROMPT_CONTINUE',
  'TCC_TOOLS_TITLE',
  'TCC_TOOLS_HINT',
  'TCC_TOOLS_BA',
  'TCC_TOOLS_BA_HINT',
  'TCC_TOOLS_ABC',
  'TCC_TOOLS_ABC_HINT',
  'TCC_TOOLS_EXPOSURE',
  'TCC_TOOLS_EXPOSURE_HINT',
  'TCC_TOOLS_ALL',
  'INSIGHTS_CARD_TITLE',
  'INSIGHTS_CARD_HINT',
  'INSIGHTS_CARD_SUMMARY',
  'INSIGHTS_CARD_SUMMARY_HINT',
  'INSIGHTS_CARD_WEEKLY',
  'INSIGHTS_CARD_WEEKLY_HINT',
  'INSIGHTS_CARD_GRAPH',
  'INSIGHTS_CARD_GRAPH_HINT',
  'QUOTE_KICKER',
  'QUOTE_A11Y_LABEL',
  'QUOTE_A11Y_HINT',
  'QUOTE_ACTION',
  'VIEW_ALL',
  'OFFLINE_BANNER_A11Y',
  'OFFLINE_BANNER_TEXT',
];

const JOURNAL_KEYS = [
  'JOURNAL_CARD_TITLE',
  'JOURNAL_CARD_OPEN_A11Y',
  'JOURNAL_CARD_LAST_PREFIX',
  'JOURNAL_CARD_TODAY',
  'JOURNAL_CARD_LAST_ENTRY',
  'JOURNAL_CARD_EMPTY_TITLE',
  'JOURNAL_CARD_EMPTY_BODY',
];

const TASK_CARD_KEYS = [
  'TASK_CARD_TITLE',
  'TYPE_TASK',
  'TYPE_REMINDER',
  'OVERDUE_TASK',
  'OVERDUE_REMINDER',
  'PRIORITY_HIGH_LABEL',
  'PRIORITY_MEDIUM_LABEL',
  'PRIORITY_LOW_LABEL',
  'PRIORITY_PREFIX',
  'A11Y_OPEN_DETAILS_HINT',
  'SESSION_EXPIRED',
  'SESSION_EXPIRED_MESSAGE',
  'ERROR_LOAD_ITEMS',
  'LOAD_ERROR_HINT',
  'RETRY',
  'EMPTY_TASK',
  'ADD_TASK',
];

function assertSectionKeys(sectionEs, sectionEn, keys, sectionName) {
  const missingEs = keys.filter((key) => !sectionEs?.[key]?.trim?.());
  const missingEn = keys.filter((key) => !sectionEn?.[key]?.trim?.());
  expect(missingEs).toEqual([]);
  expect(missingEn).toEqual([]);
  if (missingEs.length || missingEn.length) {
    throw new Error(`Missing keys in ${sectionName}`);
  }
}

describe('dashboard i18n', () => {
  it('DASH: claves del home presentes en es y en', () => {
    assertSectionKeys(es.DASH, en.DASH, DASH_HOME_KEYS, 'DASH');
  });

  it('TECHNIQUES: claves del diario presentes en es y en', () => {
    assertSectionKeys(es.TECHNIQUES, en.TECHNIQUES, JOURNAL_KEYS, 'TECHNIQUES');
  });

  it('TASKS: claves del card de pendientes presentes en es y en', () => {
    assertSectionKeys(es.TASKS, en.TASKS, TASK_CARD_KEYS, 'TASKS');
  });

  it('DASH es: sin voseo en claves del home', () => {
    const hits = DASH_HOME_KEYS.filter((key) => hasSpanishVoseo(es.DASH[key] || ''));
    expect(hits).toEqual([]);
  });

  it('TASKS es: sin voseo en claves del card de pendientes', () => {
    const hits = TASK_CARD_KEYS.filter((key) => hasSpanishVoseo(es.TASKS[key] || ''));
    expect(hits).toEqual([]);
  });
});
