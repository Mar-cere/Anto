/**
 * Weekly summary email context (English).
 */
import { APP_NAME } from '../constants/app.js';
import {
  escapeHtmlText,
  weeklyContentVariantIndex,
  weeklyEmailSubjectIndex,
} from './weeklySummaryEmailContext.js';

const SUBJECT_BUILDERS_EN = [
  (weekLabel) => `${weekLabel} — Your summary is waiting in ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — A moment to review your week in ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Your weekly summary, one tap away, in ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Close the week with calm in ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Check your week whenever you want in ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Your week, with perspective, in ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — App updates and your summary in ${APP_NAME}`,
  (weekLabel) =>
    `${weekLabel} — Summary, updates, and possible +2 trial days (if your account qualifies) in ${APP_NAME}`,
  (weekLabel) =>
    `${weekLabel} — +2 extra trial days if your account qualifies: summary and updates in ${APP_NAME}`,
  (weekLabel) =>
    `${weekLabel} — A small gift (+2 days if eligible), updates, and summary in ${APP_NAME}`,
];

const PREHEADER_VARIANTS_EN = [
  (name) =>
    `A private minute to look at your week calmly in ${name}. Full details are in the app, with your session signed in.`,
  (name) =>
    `We invite you to open ${name}: you do not need a perfect week; looking back gently can change the day.`,
  (name) =>
    `One tap and you are back in your space in ${name}. No judgment or numbers in this email—just a reminder to pick up your summary.`,
  (name) =>
    `If the week was intense, ${name} helps you sort head and heart. Your weekly and monthly summary is there when you can.`,
  (name) =>
    `Giving yourself a breather and reviewing the week is self-care too. In ${name} you see it privately, inside the app.`,
  (name) =>
    `Has it been a while since you checked in? ${name} offers a clear view, without rush. You choose when to open it.`,
  (name) =>
    `+2 Premium trial days when this email is processed (if your account qualifies) and app updates. Open ${name} and review your summary.`,
];

const LEAD_PARAGRAPH_VARIANTS_EN = [
  (name) =>
    `This week we invite you to pause for a moment and look at your process with more perspective: sometimes seeing the full path helps you notice what you are holding and the small steps that go unnoticed day to day. If you have not opened ${name} in a while, it is also a good time to reconnect, without hurry or guilt.`,
  (name) =>
    `Closing the week is not only checking off tasks: it is making space to acknowledge what you lived, what was hard, and what held you up. In ${name} you can do that with a wider, kinder view. If the pace was fast, a minute with your summary can change how you rest.`,
  (name) =>
    `You do not need everything solved to return to ${name}. Sometimes it is enough to look at the weekly summary with curiosity instead of pressure: the map helps you locate yourself and choose the next step with less weight.`,
  (name) =>
    `We invite you to a simple gesture: open ${name} and greet your week as you would greet a tired friend, with respect. There you will find a summary meant to organize without overload and to celebrate what is subtle too.`,
  (name) =>
    `If you feel the week got away from you, you are not alone: ${name} gathers what you logged in one place so you do not have to carry it all in memory. Coming back is care, not obligation.`,
  (name) =>
    `A short pause can align what you feel with what you did. In ${name}, the weekly and monthly summary is for that: so the week is not only noise and becomes a story you can honor.`,
  (name) =>
    `Maybe this week was quiet progress rather than big headlines. ${name} helps you see it: open your summary when you feel ready, without performance pressure.`,
];

const REFLECTION_PARAGRAPH_VARIANTS_EN = [
  (name) =>
    `Inside ${name} you will find your weekly and monthly summary in a simple view, designed so coming back is easy: organize what matters without overload, at your pace, and move forward with more clarity.`,
  (name) =>
    `Your summary in ${name} is built so you do not have to “catch up” with effort: it is a guided read of your week and month, focused on what you choose to care for.`,
  (name) =>
    `In ${name}, the summary is not a footnote: it is space to reflect with more context. You can enter, look, and leave; each visit counts, without a rigid agenda.`,
  (name) =>
    `The summary view in ${name} connects what you did, felt, and practiced so it does not stay scattered. That makes it easier to decide what you want to keep next week.`,
  (name) =>
    `If you prefer to go slowly, ${name} still supports you: the weekly and monthly summary waits until you have coffee and five minutes. There is no clock running inside.`,
  (name) =>
    `Beyond chat, ${name} offers this wider view so everyday life is not lost. It is an invitation to trust the process, even when the day to day is not enough to process everything.`,
];

const BENEFIT_BUNDLES_EN = [
  [
    `A clear read of your weekly and monthly activity inside ${APP_NAME}, to understand how you are doing.`,
    'A supportive space to review your process calmly, without pressure and focused on what helps you.',
  ],
  [
    'A picture of your week that does not depend on memory or judgment in the moment: aggregated, human data, without exposing conversations in email.',
    `Signals for habits, emotions, and techniques in one place, so in ${APP_NAME} you can choose more clearly what to prioritize.`,
  ],
  [
    `Seeing several days in a row in ${APP_NAME} often shows patterns the day hides: information for you, not to compare with anyone else.`,
    'A gentle reminder that what you added—even a little—counts and deserves to be seen.',
  ],
  [
    'Less “how was last week?” and more “here it is, organized”: that reduces mental load and opens room to rest better.',
    `From the summary you can return to chat or your logs in ${APP_NAME} with clearer intent, without starting from zero each time.`,
  ],
  [
    `If you are in a delicate moment, the summary in ${APP_NAME} lets you review with limits: you decide how much to look and when to stop.`,
    'A way to honor your process without having to explain it out loud if you are not ready yet.',
  ],
];

const WEEKLY_PRODUCT_NEWS_LINES_EN = [
  `Ecosystem connected to chat: tasks, habits, and pomodoros without leaving the conversation.`,
  `Smart tasks: suggestions aligned with what you discussed and less friction to take action.`,
  `More stable chat: better continuity, recovery if a reply cuts off, and a short summary when you return.`,
  `Light theme for those who prefer bright screens and comfortable reading.`,
  `Smarter notifications: more useful alerts, less noise, and reasonable daily limits.`,
  `Renewed weekly and monthly summary: one view for how chat, tasks, habits, and focus fit together.`,
];

const CLOSING_LINE_VARIANTS_EN = [
  () =>
    `Thank you for being part of ${APP_NAME}. We are here when you want to return: we would love to see you again.`,
  () =>
    `Thank you for trusting ${APP_NAME}. If this week was hard, we hope the next summary gives you a little air. We are here to support you.`,
  () =>
    `A digital hug from the ${APP_NAME} team. May rest find you, and when you return the app welcomes you with the same calm as always.`,
  () =>
    `We are still here, building ${APP_NAME} with listening. When you want to look at your week, open the app: it will be a good moment.`,
  () =>
    `Thank you for spending time on your wellbeing with ${APP_NAME}. It does not matter if it was a little or a lot: what matters is that it is yours.`,
  () =>
    `We wish you a good week transition. ${APP_NAME} waits without rush, with your summary ready when you need it.`,
];

export function buildWeeklySummarySubjectLineEn(weekLabel, isoWeekYear, isoWeek) {
  const i = weeklyEmailSubjectIndex(isoWeekYear, isoWeek);
  return SUBJECT_BUILDERS_EN[i](weekLabel);
}

/**
 * @param {object} user
 * @param {{ isoWeekYear: number, isoWeek: number, yearWeekKey: string }} isoParts
 */
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

  const totalSessionsRaw = user?.stats?.totalSessions;
  const totalSessionsN = Number(totalSessionsRaw);
  const hasSomeActivity = Number.isFinite(totalSessionsN) && totalSessionsN >= 1;
  const openingBenefitLine = hasSomeActivity
    ? `You already have activity logged in ${APP_NAME}: this email only shares the invitation; the value is opening the app and seeing your week with perspective. Here is a glimpse before the details.`
    : `Even if you have been with ${APP_NAME} for a short time, the summary helps you organize head and routine when you want to look back. Here is a glimpse before the details in the app.`;

  const reflectionParagraph = REFLECTION_PARAGRAPH_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, REFLECTION_PARAGRAPH_VARIANTS_EN.length, 3)
  ](APP_NAME);

  const privacyParagraph = `To protect your privacy, this email does not include sensitive numbers or conversation content. Detailed summary information (habits, conversations, emotions, techniques, and other logs) is shown only inside ${APP_NAME} when you sign in.`;

  const whereParagraph = `From here you can open ${APP_NAME} directly. If the link does not work on your device, you will also find the path to reach the summary manually below.`;

  const benefitSectionTitle = 'In your summary';
  const benefitLines = BENEFIT_BUNDLES_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, BENEFIT_BUNDLES_EN.length, 4)
  ];

  const rawSubStatus = user?.subscription?.status;
  const subStatus = typeof rawSubStatus === 'string' ? rawSubStatus.trim() : '';
  const isPremium = subStatus === 'premium';

  const giftBadgeLabel = isPremium ? 'Your plan' : 'Gift';

  const giftTitle = isPremium ? 'Your Premium plan' : 'Gift: +2 Premium trial days';

  const giftPrimary = isPremium
    ? `You have an active paid subscription: the extra 2-day trial gift does not change your plan or create charges. Thank you for staying with ${APP_NAME}.`
    : `If your account qualifies, we add 2 Premium trial days when this email is sent from our system. You do not need to click a link to “activate” it: it applies when the message is dispatched.`;

  const giftSecondary = isPremium
    ? `Product updates are just below; open them in the app with your session signed in.`
    : `Check in the app (Profile or subscription) whether the extended trial is visible; stores sometimes take a few minutes to reflect it.`;

  const updatesSectionTitle = 'What is new in the app';
  const updatesIntro =
    'This is what changed or improved recently; full details are in the app when you sign in.';

  const updatesLines = [...WEEKLY_PRODUCT_NEWS_LINES_EN];

  const postUpdatesActionLine = `If you already use the app, open Profile to check whether your trial was extended. If you do not see the change and believe it should apply, you can reply to this email and request it; include the same email you use to sign in to ${APP_NAME}.`;

  const downloadPrompt = `If you do not have the app installed yet, you can download it and start using ${APP_NAME} today.`;

  const closingLine = CLOSING_LINE_VARIANTS_EN[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, CLOSING_LINE_VARIANTS_EN.length, 6)
  ]();

  return {
    displayName,
    weekLabel,
    subjectLine,
    preheaderText,
    leadParagraph,
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
