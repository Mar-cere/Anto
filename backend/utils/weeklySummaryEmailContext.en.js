/**
 * Weekly summary / campaign email context (English).
 */
import { APP_NAME } from '../constants/app.js';
import { WEEKLY_PRODUCT_NEWS_LINES_EN } from '../constants/weeklyProductNews.js';
import {
  buildWeeklySummaryGiftCopy,
  formatTrialGiftDaysCount,
  formatTrialGiftDaysPlus,
  getWeeklySummaryTrialGiftDays,
} from '../constants/subscription.js';
import {
  escapeHtmlText,
  weeklyContentVariantIndex,
  weeklyEmailSubjectIndex,
} from './weeklySummaryEmailContext.js';

const SUBJECT_BUILDERS_EN = [
  () => `${APP_NAME} — you do not start from scratch`,
  () => `What you agreed to revisit now lives in ${APP_NAME}`,
  () => `A note from ${APP_NAME}: continuity at your pace`,
  () => `${APP_NAME} 1.5.6 — focus, memory, and what was left open`,
  () => `Hello again from ${APP_NAME}`,
  () => `${APP_NAME} — version 1.5.6 updates`,
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'en');
    return `${APP_NAME} — what you agreed to revisit (${plus} if you qualify)`;
  },
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'en');
    return `What's new in ${APP_NAME} (+ possible ${plus} trial)`;
  },
  () => `${APP_NAME} — 1.5.6 update`,
  () => `Thanks for staying — news from ${APP_NAME}`,
];

const PREHEADER_VARIANTS_EN = [
  () => {
    const count = formatTrialGiftDaysCount(getWeeklySummaryTrialGiftDays(), 'en');
    return `You do not start from scratch: focus, continuity, and memory under your control. If you qualify, ${count} of Premium.`;
  },
  (name) =>
    `It has been a while since we wrote from ${name}. The essentials of 1.5.6, in a few lines.`,
  (name) =>
    `In ${name}, what you agreed to revisit can live on Home — no homework, no rush.`,
  (name) =>
    `A hello from ${name}: continuity between conversations, and a small extra if your account qualifies.`,
  (name) =>
    `Version 1.5.6: choose a focus, revisit gently, remember with permission. At your pace.`,
  (name) => {
    const count = formatTrialGiftDaysCount(getWeeklySummaryTrialGiftDays(), 'en');
    return `Updates in ${name} and, if your account qualifies, ${count} extra Premium.`;
  },
];

const LEAD_PARAGRAPH_VARIANTS_EN = [
  (name) =>
    `It has been a while since we wrote. The core idea of this update: in ${name} you do not start from scratch — you pick up what matters, at your pace.`,
  (name) =>
    `We wanted to share something simple. ${name} now helps you choose a focus, revisit what you agreed, and remember with your permission — without pressure or grading.`,
  (name) =>
    `Thank you for staying with ${name}. Nothing urgent — just the essentials of 1.5.6.`,
  (name) =>
    `If ${name} has been on pause, that is fine. When you return, the app is built to pick up with you — not to start over.`,
  (name) =>
    `A calm note: fewer feature lists, one clear promise. In ${name}, each chat can add continuity when you allow it.`,
  (name) =>
    `If it has been days since you opened ${name}, we still wanted to say hello. Below: a note for your account and three changes that matter.`,
];

const WARM_BRIDGE_VARIANTS_EN = [
  () => 'First a note for your account; then the essentials in three lines.',
  () => 'We kept it short on purpose — so you can read without rush.',
  () => 'None of this expires today. Take what you need.',
];

const INVITE_LINE_VARIANTS_EN = [
  (name) =>
    `Whenever you like, open ${name} and look at Home: your focus and what was left to revisit can live there.`,
  (name) =>
    `If now works, one tap opens ${name}. If not, this will wait.`,
  (name) =>
    `One tap back to ${name}. No rush, no judgment.`,
  (name) =>
    `Try what is new when you can — ${name} is not chasing you.`,
];
const REFLECTION_PARAGRAPH_VARIANTS_EN = [
  (name) =>
    `Beyond chat, ${name} has an optional weekly and monthly summary if you want perspective later — no obligation.`,
  (name) =>
    `If you ever want to sort the week, ${name} has a summary view for that: go in, take a look, and leave at your pace.`,
  (name) =>
    `For later: in Profile you can see an activity summary in ${name}, always inside the app when signed in.`,
  (name) =>
    `The summary in ${name} is optional space to reflect with yourself when you have five minutes and a coffee.`,
];

const BENEFIT_BUNDLES_EN = [
  [
    `A clear read of your week and month, only inside ${APP_NAME}.`,
    'A place to review your process calmly, without pressure.',
  ],
  [
    'What you logged, organized in one place — without exposing conversations in email.',
    `Signals for habits, emotions, and techniques to decide what to care for in ${APP_NAME}.`,
  ],
  [
    `Patterns the day hides, visible when you look at several days in a row in ${APP_NAME}.`,
    'A reminder that small steps count too.',
  ],
  [
    'Less mental load: the week is written down, not only in memory.',
    `From the summary you can return to chat in ${APP_NAME} with more clarity.`,
  ],
  [
    `Review with limits: you choose how much to look and when to stop in ${APP_NAME}.`,
    'Honor your process without explaining it all if you are not ready.',
  ],
];

const WEEKLY_PRODUCT_NEWS_LINES = [...WEEKLY_PRODUCT_NEWS_LINES_EN];

const CLOSING_LINE_VARIANTS_EN = [
  () =>
    `Thank you for being part of ${APP_NAME}. We are glad you are here.`,
  () =>
    `A hug from the ${APP_NAME} team. May your week treat you gently.`,
  () =>
    `We are still here, building ${APP_NAME} with listening. Open the app whenever you want.`,
  () =>
    `Thank you for trusting ${APP_NAME}. Always at your pace.`,
  () =>
    `Wishing you a good week. ${APP_NAME} is here when you need it.`,
];

export function buildWeeklySummarySubjectLineEn(_weekLabel, isoWeekYear, isoWeek) {
  const i = weeklyEmailSubjectIndex(isoWeekYear, isoWeek);
  return SUBJECT_BUILDERS_EN[i]();
}

export function buildWeeklySummaryEmailContextEn(user, isoParts) {
  const rawName = user?.name && String(user.name).trim();
  const rawUser = user?.username && String(user.username).trim();
  const displayName = escapeHtmlText(rawName || rawUser || '');

  const { isoWeekYear, isoWeek } = isoParts;
  const weekLabel = `Week ${isoWeek} · ${isoWeekYear}`;
  const subjectLine = buildWeeklySummarySubjectLineEn(weekLabel, isoWeekYear, isoWeek);

  const preheaderText = PREHEADER_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, PREHEADER_VARIANTS_EN.length, 1)
  ](APP_NAME);

  const leadParagraph = LEAD_PARAGRAPH_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, LEAD_PARAGRAPH_VARIANTS_EN.length, 2)
  ](APP_NAME);

  const warmBridgeLine = WARM_BRIDGE_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, WARM_BRIDGE_VARIANTS_EN.length, 5)
  ]();

  const inviteLine = INVITE_LINE_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, INVITE_LINE_VARIANTS_EN.length, 6)
  ](APP_NAME);

  const reflectionParagraph = REFLECTION_PARAGRAPH_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, REFLECTION_PARAGRAPH_VARIANTS_EN.length, 3)
  ](APP_NAME);

  const privacyParagraph = `This email does not include sensitive numbers or conversation content. Details (habits, emotions, techniques, and logs) appear only in ${APP_NAME} when you sign in.`;

  const whereParagraph = `You can open ${APP_NAME} from the button above. If the link does not work on your device, open the app manually with your account.`;

  const benefitSectionTitle = 'If you want to look back later';
  const benefitLines = BENEFIT_BUNDLES_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, BENEFIT_BUNDLES_EN.length, 4)
  ];

  const rawSubStatus = user?.subscription?.status;
  const subStatus = typeof rawSubStatus === 'string' ? rawSubStatus.trim() : '';
  const isPremium = subStatus === 'premium';

  const giftDays = getWeeklySummaryTrialGiftDays();
  const {
    giftBadgeLabel,
    giftTitle,
    giftPrimary,
    giftSecondary,
  } = buildWeeklySummaryGiftCopy({
    giftDays,
    isPremium,
    appName: APP_NAME,
    locale: 'en',
  });

  const updatesSectionTitle = 'Three changes that matter';
  const updatesIntro =
    'Version 1.5.6. There is also smoother chat and more careful crisis support; this is what changes day to day most:';

  const updatesLines = [...WEEKLY_PRODUCT_NEWS_LINES];

  const postUpdatesActionLine = isPremium
    ? ''
    : `If in a few minutes you do not see the extended trial in Profile, reply to this email with the address you use to sign in to ${APP_NAME}.`;

  const downloadPrompt = `If you do not have the app yet, you can download it whenever you like.`;

  const closingLine = CLOSING_LINE_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, CLOSING_LINE_VARIANTS_EN.length, 7)
  ]();

  const openingBenefitLine = warmBridgeLine;

  return {
    displayName,
    weekLabel,
    subjectLine,
    preheaderText,
    leadParagraph,
    warmBridgeLine,
    inviteLine,
    openingBenefitLine,
    reflectionParagraph,
    privacyParagraph,
    whereParagraph,
    benefitSectionTitle,
    benefitLines,
    giftBadgeLabel,
    giftTitle,
    giftPrimary,
    giftSecondary,
    updatesSectionTitle,
    updatesIntro,
    updatesLines,
    postUpdatesActionLine,
    downloadPrompt,
    closingLine,
  };
}
