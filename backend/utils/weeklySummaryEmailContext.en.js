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
  () => `${APP_NAME} — we wanted to share what's new`,
  () => `What's new in ${APP_NAME}, no rush`,
  () => `A note from ${APP_NAME} for you`,
  () => `${APP_NAME} got better: here's what changed`,
  () => `Hello again from ${APP_NAME}`,
  () => `${APP_NAME} — version 1.5.0 updates`,
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'en');
    return `${APP_NAME} — updates and, if you qualify, ${plus} trial`;
  },
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'en');
    return `What's new in ${APP_NAME} (+ possible ${plus} trial)`;
  },
  () => `${APP_NAME} — 1.5.0 update`,
  () => `Thanks for staying — news from ${APP_NAME}`,
];

const PREHEADER_VARIANTS_EN = [
  () =>
    'A calm note: app updates and a small extra if your account qualifies. No rush.',
  (name) =>
    `A hello from ${name}. Below is what we improved; the rest is in the app whenever you want.`,
  (name) =>
    `Not a task reminder or a report — just a hello and what's new in ${name}.`,
  (name) =>
    `If you have not opened ${name} in a while, we still wanted to reach out. Here are the updates.`,
  (name) =>
    `Version 1.5.0 with chat and experience improvements. Everything else, at your pace.`,
  (name) => {
    const count = formatTrialGiftDaysCount(getWeeklySummaryTrialGiftDays(), 'en');
    return `Updates in ${name} and, if you qualify, ${count} extra Premium trial.`;
  },
];

const LEAD_PARAGRAPH_VARIANTS_EN = [
  (name) =>
    `We wanted to write with calm. You do not need a perfect week — ${name} is here whenever you feel like coming back.`,
  (name) =>
    `We have been thinking about people who use ${name} at different paces. This email is a hello and a quick look at what we improved — nothing more.`,
  (name) =>
    `Thank you for trusting ${name}. Nothing urgent — we just wanted to say hi and share the updates.`,
  (name) =>
    `Life gets busy and the app can wait. That is fine. ${name} welcomes you back the same whenever you are ready.`,
  (name) =>
    `Think of this as a message from someone who respects your rhythm and hopes ${name} still helps.`,
  (name) =>
    `If it has been a while since you opened ${name}, we still wanted to say hello. Below is the heart of this update.`,
];

const WARM_BRIDGE_VARIANTS_EN = [
  () => 'Take your time reading — none of this expires today.',
  () => 'We kept only the essentials so you do not have to hunt for them.',
  () => 'Grouped by theme so you can skim quickly.',
];

const INVITE_LINE_VARIANTS_EN = [
  (name) =>
    `Whenever you feel like it, open ${name} and take a look. We will be there.`,
  (name) =>
    `If now works, one tap opens ${name}. If not, this will wait for you.`,
  (name) =>
    `One tap back to ${name}. No rush, no judgment.`,
  (name) =>
    `Try the updates when you can — ${name} is not chasing you.`,
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

  const updatesSectionTitle = 'What we improved';
  const updatesIntro =
    'In version 1.5.0 we focused especially on safer chat in difficult moments and small experience details. The highlights:';

  const updatesLines = [...WEEKLY_PRODUCT_NEWS_LINES];

  const postUpdatesActionLine = `If you already use the app, check Profile to see whether your trial was extended. If you believe it should apply and do not see it, reply to this email with the address you use to sign in to ${APP_NAME}.`;

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
