/**
 * Dashboard "foco actual" (#34): agrega resumen semanal, tareas próximas,
 * conversaciones recientes, compromisos (metas/patrones), recordatorio priorizado
 * (chat → tarea → hábito → push), pista de protocolo (TherapeuticRecord + LLM),
 * y opcionalmente una línea de prioridad con LLM (cache por día).
 */
import mongoose from 'mongoose';
import ClinicalScaleResult from '../models/ClinicalScaleResult.js';
import Habit from '../models/Habit.js';
import Message from '../models/Message.js';
import Task from '../models/Task.js';
import TherapeuticRecord from '../models/TherapeuticRecord.js';
import User from '../models/User.js';
import UserInsight from '../models/UserInsight.js';
import cacheService from './cacheService.js';
import openaiService from './openaiService.js';
import { computeNextRoutinePushSlot } from './notificationScheduler.js';
import { getLastSessionSummaryForUser, reconcileChatContinuitySummary } from './lastSessionSummaryService.js';
import { getTodayDailyMoodCheckIn } from './dailyMoodCheckInService.js';
import { getEngagementStreak } from './engagementStreakService.js';
import { buildUserSummary } from './userSummaryService.js';
import {
  focusCopy,
  focusLocale,
  localizeLastSessionSummaryForDisplay,
  normalizeFocusLanguage,
  hasChatContinuityDisplayText,
  shouldSuppressFocusLineForContinuity,
} from '../utils/focusDashboardCopy.js';
import { findWeekPlanForUser } from './behavioralActivationWeekPlanService.js';
import { loadExposureFocus } from './chatTccContinuityService.js';
import { pickBaFocusSlot } from './activeTccProtocolsContextService.js';
import {
  FOCUS_VISIBLE_LIMIT,
  isFollowUpDue,
  listSessionCommitments,
} from './sessionCommitmentService.js';
import { buildHomeRotatingInsightForUser } from './homeRotatingInsightService.js';
import { buildDigitalPhenotypeFocusAlert } from './digitalPhenotypePatternAlertService.js';
import { getActiveFocus } from './focusService.js';

function cacheTtlSecondsUntilUtcEndOfDay() {
  const now = Date.now();
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const sec = Math.floor((end.getTime() - now) / 1000);
  return Math.max(300, Math.min(sec, 24 * 60 * 60));
}

async function loadRecentConversations(userId, limit = 3) {
  const uid = new mongoose.Types.ObjectId(userId);
  const rows = await Message.aggregate([
    { $match: { userId: uid } },
    {
      $project: {
        conversationId: 1,
        content: 1,
        role: 1,
        createdAt: 1
      }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $last: '$content' },
        lastMessageRole: { $last: '$role' },
        updatedAt: { $max: '$createdAt' },
        messageCount: { $sum: 1 }
      }
    },
    { $sort: { updatedAt: -1 } },
    { $limit: limit }
  ]);

  return rows.map((r) => ({
    conversationId: String(r._id),
    updatedAt: r.updatedAt,
    messageCount: r.messageCount,
    lastMessagePreview: String(r.lastMessage || '').slice(0, 120),
    lastMessageRole: r.lastMessageRole
  }));
}

async function loadUpcomingTasks(userId, limit = 5) {
  const uid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Task.find({
    userId: uid,
    deletedAt: { $exists: false },
    status: { $in: ['pending', 'in_progress'] },
    dueDate: { $gte: now }
  })
    .sort({ dueDate: 1, priority: -1 })
    .limit(limit)
    .select('title dueDate status priority itemType')
    .lean();
}

async function loadCommitments(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const [sessionItems, insightDoc] = await Promise.all([
    listSessionCommitments(userId, { status: 'active', limit: 8 }).catch(() => []),
    UserInsight.findOne({ userId: uid })
      .select('activeGoals recurringPatterns')
      .lean(),
  ]);
  const goals = (insightDoc?.activeGoals || []).map((g) => String(g).trim()).filter(Boolean);
  const patterns = (insightDoc?.recurringPatterns || []).map((p) => String(p).trim()).filter(Boolean);
  const sessionLabels = (sessionItems || []).map((c) => String(c?.label || '').trim()).filter(Boolean);
  const legacy = [...goals, ...patterns].filter((t) => !sessionLabels.includes(t));
  const merged = [...sessionLabels, ...legacy].slice(0, 8);
  return {
    goals,
    patterns,
    list: merged,
    items: sessionItems || [],
  };
}

async function loadLatestScales(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const [phq, gad] = await Promise.all([
    ClinicalScaleResult.findOne({ userId: uid, scaleType: 'PHQ9' })
      .sort({ createdAt: -1 })
      .select('scaleType totalScore interpretation.severity createdAt')
      .lean(),
    ClinicalScaleResult.findOne({ userId: uid, scaleType: 'GAD7' })
      .sort({ createdAt: -1 })
      .select('scaleType totalScore interpretation.severity createdAt')
      .lean()
  ]);
  const mapRow = (row) =>
    row
      ? {
          scaleType: row.scaleType,
          totalScore: row.totalScore,
          severityLabel: row.interpretation?.severity || null,
          completedAt: row.createdAt
        }
      : null;
  return { phq9: mapRow(phq), gad7: mapRow(gad) };
}

/**
 * Hora y minuto local (en `timeZone`) de un instante. Espeja la lógica del scheduler
 * para que la hora mostrada coincida con la del envío real de la notificación.
 */
function localHourMinuteInTz(date, timeZone) {
  if (!timeZone) return { hh: date.getHours(), mm: date.getMinutes() };
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hh = parseInt(parts.find((p) => p.type === 'hour')?.value || '', 10);
    const mm = parseInt(parts.find((p) => p.type === 'minute')?.value || '', 10);
    if (Number.isFinite(hh) && Number.isFinite(mm)) return { hh, mm };
  } catch {}
  return { hh: date.getUTCHours(), mm: date.getUTCMinutes() };
}

/** Instante UTC correspondiente a 00:00 del día local (en `timeZone`). */
function startOfLocalDayUtc(now, timeZone) {
  if (!timeZone) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  try {
    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const [y, m, d] = dateParts.split('-').map((x) => parseInt(x, 10));
    const utcMidnight = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0));
    const { hh, mm } = localHourMinuteInTz(utcMidnight, timeZone);
    const deltaMinutes = hh * 60 + mm;
    return new Date(utcMidnight.getTime() - deltaMinutes * 60 * 1000);
  } catch {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }
}

async function loadNextHabitReminder(userId, timeZone = null) {
  const uid = new mongoose.Types.ObjectId(userId);
  const habits = await Habit.find({
    userId: uid,
    deletedAt: { $exists: false },
    'status.archived': false,
    'reminder.enabled': true
  })
    .select('id title reminder.time status.completedToday')
    .lean();

  const now = new Date();
  const startOfDay = startOfLocalDayUtc(now, timeZone);
  let best = null;
  for (const h of habits) {
    if (h.status?.completedToday) continue;
    const rt = new Date(h.reminder.time);
    // La hora/minuto se interpretan en la zona del usuario, igual que el envío real.
    const { hh, mm } = localHourMinuteInTz(rt, timeZone);
    let target = new Date(startOfDay.getTime() + (hh * 60 + mm) * 60 * 1000);
    if (target <= now) {
      target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
    }
    if (!best || target.getTime() < best.nextAt.getTime()) {
      best = { id: h.id, title: h.title, nextAt: target };
    }
  }
  return best;
}

async function loadBaWeekFocus(userId, language = 'es') {
  try {
    const weekCtx = await findWeekPlanForUser(userId, null, language);
    if (!weekCtx) return null;
    const picked = pickBaFocusSlot({
      plan: weekCtx.plan,
      weekStart: weekCtx.weekStart,
      dayLabels: weekCtx.dayLabels,
      now: new Date()
    });
    if (!picked?.slotId || !String(picked.activityDescription || '').trim()) return null;
    return { ...picked, weekStart: weekCtx.weekStart };
  } catch {
    return null;
  }
}

async function loadTherapeuticProtocolHint(userId, language = 'es') {
  const doc = await TherapeuticRecord.findOne({
    userId: new mongoose.Types.ObjectId(userId)
  })
    .select('activeTools therapeuticGoals')
    .lean();
  if (!doc) return { line: null, source: null };
  const c = focusCopy(language);
  const goals = doc.therapeuticGoals || [];
  const inProg = goals.find((g) => g.status === 'en_progreso');
  const pend = goals.find((g) => g.status === 'pendiente');
  const g = inProg || pend;
  if (g?.description) {
    const line = String(g.description).trim().slice(0, 220);
    return { line, source: 'therapeutic_record' };
  }
  const tools = doc.activeTools || [];
  if (tools.length) {
    const t0 = String(tools[0]).replace(/_/g, ' ');
    return { line: c.activeFollowUp(t0).slice(0, 220), source: 'therapeutic_record' };
  }
  return { line: null, source: null };
}

async function loadUserNotificationPrefs(userId) {
  const u = await User.findById(userId)
    .select('notificationPreferences preferences.timezone')
    .lean();
  return {
    notificationPreferences: u?.notificationPreferences || null,
    timezone: u?.preferences?.timezone || null
  };
}

/** Subtítulo genérico para “retomar chat” sin mostrar contenido del hilo. */
function chatResumeSubtitle(lastConv, now = new Date(), language = 'es') {
  const c = focusCopy(language);
  if (!lastConv?.updatedAt) {
    return c.chatResumeDefault;
  }
  const hours = (now.getTime() - new Date(lastConv.updatedAt).getTime()) / 3600000;
  if (hours < 24) return c.chatResumeRecent;
  const days = Math.floor(hours / 24);
  if (days === 1) return c.chatResumeOneDay;
  return c.chatResumeDays(days);
}

/**
 * Candidatos de recordatorio en orden: chat → tarea → hábito → push.
 * Exportada para tests.
 */
export function buildReminderCandidates({
  summary,
  recentConversations = [],
  upcomingTasks = [],
  habitReminder = null,
  nextPushSlot = null,
  now = new Date(),
  language = 'es',
  timeZone = null
}) {
  const c = focusCopy(language);
  const locale = focusLocale(language);
  const userMsgs = summary?.chat?.userMessages ?? 0;
  const lastConv = recentConversations[0];
  const candidates = [];

  const hoursSinceConv = lastConv
    ? (now.getTime() - new Date(lastConv.updatedAt).getTime()) / 3600000
    : Infinity;

  const chatRelevantWithConv =
    !!lastConv &&
    (userMsgs === 0 || hoursSinceConv >= 18 || (userMsgs < 5 && hoursSinceConv >= 4));

  if (lastConv && chatRelevantWithConv) {
    candidates.push({
      kind: 'chat',
      title: c.resumeLastChat,
      subtitle: chatResumeSubtitle(lastConv, now, language),
      conversationId: lastConv.conversationId
    });
  } else if (!lastConv && userMsgs === 0) {
    candidates.push({
      kind: 'chat',
      title: c.startConversation,
      subtitle: c.startConversationSub,
      conversationId: null
    });
  }

  if (upcomingTasks[0]) {
    const t = upcomingTasks[0];
    candidates.push({
      kind: 'task',
      title: c.nextTask(String(t.title).slice(0, 72)),
      subtitle: t.dueDate
        ? c.dueOn(new Date(t.dueDate).toLocaleDateString(locale, { day: 'numeric', month: 'short' }))
        : null,
      taskId: String(t._id)
    });
  }

  if (habitReminder) {
    const at = habitReminder.nextAt;
    const timeStr = at
      ? at.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          ...(timeZone ? { timeZone } : {}),
        })
      : '';
    candidates.push({
      kind: 'habit',
      title: c.habit(String(habitReminder.title).slice(0, 64)),
      subtitle: timeStr ? c.reminderAround(timeStr) : null,
      habitId: habitReminder.id
    });
  }

  if (nextPushSlot?.at) {
    const when = nextPushSlot.at.toLocaleString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    candidates.push({
      kind: 'push',
      title: nextPushSlot.label || c.scheduledReminder,
      subtitle: when,
      pushKind: nextPushSlot.kind
    });
  }

  return candidates;
}

/**
 * Elige qué recordatorio mostrar; en pantallas compactas se omite el de hábito.
 * Exportada para tests.
 */
export function pickDisplayedReminder(candidates, { compact = false } = {}) {
  if (!candidates?.length) return null;
  if (!compact) return candidates[0];
  const nonHabit = candidates.find((c) => c.kind !== 'habit');
  return nonHabit || candidates[0];
}

/**
 * Línea de foco sin LLM (prioridad mixta heurística).
 * Exportada para tests unitarios.
 */
export function buildDeterministicFocusCaption({
  summary,
  upcomingTasks = [],
  commitmentsList = [],
  recentConversations = [],
  protocolLine = null,
  language = 'es'
}) {
  const c = focusCopy(language);
  if (protocolLine) {
    const p = String(protocolLine).slice(0, 140);
    return c.focusProtocol(p);
  }
  const userMsgs = summary?.chat?.userMessages ?? 0;
  const activeDays = summary?.chat?.distinctActiveDays ?? 0;
  const nextTask = upcomingTasks[0];
  const firstCommitment = commitmentsList[0];

  if (userMsgs === 0) {
    return c.focusNoChatWeek;
  }
  if (activeDays <= 1 && userMsgs < 6) {
    return c.focusSparseActivity;
  }
  if (nextTask?.title) {
    return c.focusNextTask(String(nextTask.title).slice(0, 80));
  }
  if (firstCommitment) {
    return c.focusCommitment(String(firstCommitment).slice(0, 120));
  }
  if (recentConversations.length > 0) {
    return c.focusResumeOrCheckIn;
  }
  return c.focusDefaultChoice;
}

function buildLlmUserPayload({
  summary,
  upcomingTasks,
  commitments,
  recentConversations,
  scales,
  deterministicCaption,
  protocolHintFromRecord,
  isSparseActivity
}) {
  return JSON.stringify({
    week: {
      userMessages: summary?.chat?.userMessages ?? 0,
      activeDays: summary?.chat?.distinctActiveDays ?? 0,
      tasksCompleted: summary?.tasks?.completedInPeriod ?? 0,
      habitsCompletions: summary?.habits?.completionsInPeriod ?? 0
    },
    narrative: {
      themes: summary?.narrative?.themes,
      microWins: summary?.narrative?.microWins
    },
    upcomingTasks: upcomingTasks.map((t) => ({
      title: t.title,
      dueDate: t.dueDate,
      status: t.status
    })),
    commitments: commitments.list.slice(0, 5),
    recentChats: recentConversations.map((c) => ({
      messageCount: c.messageCount,
      daysSinceUpdate: Math.max(
        0,
        Math.floor((Date.now() - new Date(c.updatedAt).getTime()) / 86400000)
      )
    })),
    scales: {
      phq9: scales.phq9?.severityLabel || null,
      gad7: scales.gad7?.severityLabel || null
    },
    deterministicSuggestion: deterministicCaption,
    protocolHintFromRecord: protocolHintFromRecord || null,
    activitySparse: isSparseActivity
  });
}

async function maybeLlmFocusLine(userId, bundle, language = 'es') {
  const lang = normalizeFocusLanguage(language);
  const c = focusCopy(lang);
  const enabled = process.env.DASHBOARD_FOCUS_LLM_ENABLED === 'true';
  if (!enabled || !process.env.OPENAI_API_KEY) {
    return { mode: 'deterministic', text: bundle.deterministicCaption };
  }

  const dayKey = new Date().toISOString().slice(0, 10);
  const cacheKey = cacheService.generateKey('dashboard_focus_llm_v3', {
    userId: String(userId),
    day: dayKey,
    language: lang
  });

  const cached = await cacheService.get(cacheKey);
  if (cached && typeof cached.text === 'string' && cached.text.trim()) {
    return { mode: 'llm_cached', text: cached.text.trim() };
  }

  const model = process.env.DASHBOARD_FOCUS_LLM_MODEL || 'gpt-4o-mini';
  const userContent = buildLlmUserPayload(bundle);

  const sparseHint = bundle.isSparseActivity ? c.llmFocusSparseHint : '';
  const protocolHint = bundle.protocolHintFromRecord ? c.llmFocusProtocolHint : '';

  try {
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        {
          role: 'system',
          content: `${c.llmFocusSystem}${sparseHint}${protocolHint}`
        },
        {
          role: 'user',
          content: `Datos JSON del usuario hoy:\n${userContent}\n\n${c.llmFocusUserSuffix}`
        }
      ],
      max_completion_tokens: 140,
      temperature: 0.35
    });

    const raw = completion?.choices?.[0]?.message?.content || '';
    const text = String(raw).replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!text) throw new Error('EMPTY_LLM_FOCUS');

    await cacheService.set(cacheKey, { text }, cacheTtlSecondsUntilUtcEndOfDay());
    return { mode: 'llm', text };
  } catch {
    return { mode: 'llm_fallback', text: bundle.deterministicCaption };
  }
}

/**
 * @param {string} userId
 * @param {{ language?: 'es'|'en' }} [opts]
 */
export async function buildDashboardFocus(userId, opts = {}) {
  const language = normalizeFocusLanguage(opts.language);
  const [
    summary,
    upcomingTasks,
    recentConversations,
    commitments,
    scales,
    protocolNext,
    userFocusPrefs,
    lastSessionSummaryStored,
    baWeekFocus,
    exposureFocus,
    activeFocus
  ] = await Promise.all([
    buildUserSummary(userId, { period: 'week', language }),
    loadUpcomingTasks(userId, 5),
    loadRecentConversations(userId, 3),
    loadCommitments(userId),
    loadLatestScales(userId),
    loadTherapeuticProtocolHint(userId, language),
    loadUserNotificationPrefs(userId),
    getLastSessionSummaryForUser(userId),
    loadBaWeekFocus(userId, language),
    loadExposureFocus(userId),
    getActiveFocus(userId, language).catch(() => null)
  ]);

  const lastSessionSummaryRaw = reconcileChatContinuitySummary(
    lastSessionSummaryStored,
    recentConversations,
    { language, now: new Date() },
  );

  const notificationPreferences = userFocusPrefs?.notificationPreferences || null;
  const userTimezone = userFocusPrefs?.timezone || null;
  const habitReminder = await loadNextHabitReminder(userId, userTimezone);
  const dailyMood = await getTodayDailyMoodCheckIn(userId, {
    language,
    timezone: userTimezone,
  });
  const engagementStreak = await getEngagementStreak(userId, { syncToday: true }).catch(() => ({
    current: 0,
    best: 0,
    todayPoints: 0,
    todayQualified: false,
    todaySignals: [],
    lastQualifiedDateKey: null,
  }));
  const nextPushSlot = computeNextRoutinePushSlot(notificationPreferences, new Date(), language);

  const reminderCandidatesRaw = buildReminderCandidates({
    summary,
    recentConversations,
    upcomingTasks,
    habitReminder,
    nextPushSlot,
    now: new Date(),
    language,
    timeZone: userTimezone
  });

  const lastSessionSummary = localizeLastSessionSummaryForDisplay(lastSessionSummaryRaw, language, {
    timezone: userTimezone
  });

  const hasChatContinuity = hasChatContinuityDisplayText(lastSessionSummary);
  const reminderCandidates = hasChatContinuity
    ? reminderCandidatesRaw.filter((c) => c.kind !== 'chat')
    : reminderCandidatesRaw;

  const userMsgs = summary?.chat?.userMessages ?? 0;
  const isSparseActivity =
    userMsgs === 0 &&
    (!upcomingTasks || upcomingTasks.length === 0) &&
    (!recentConversations || recentConversations.length === 0);

  const deterministicCaption = buildDeterministicFocusCaption({
    summary,
    upcomingTasks,
    commitmentsList: commitments.list,
    recentConversations,
    protocolLine: protocolNext.line,
    language
  });

  const [focusLine, homeInsight, phenotypeAlert, dueExperiential] = await Promise.all([
    maybeLlmFocusLine(
      userId,
      {
        summary,
        upcomingTasks,
        commitments,
        recentConversations,
        scales,
        deterministicCaption,
        protocolHintFromRecord: protocolNext.line,
        isSparseActivity,
      },
      language,
    ),
    buildHomeRotatingInsightForUser(userId, {
      language,
      summary,
      timezone: userTimezone,
    }).catch(() => null),
    buildDigitalPhenotypeFocusAlert({ userId }).catch(() => null),
    import('./experientialPatternService.js')
      .then(({ getDueExperientialPattern }) => getDueExperientialPattern(userId))
      .catch(() => null),
  ]);

  let focusLineText = String(focusLine?.text || '').trim();
  if (hasChatContinuity && shouldSuppressFocusLineForContinuity(focusLineText, language)) {
    focusLineText = '';
  }

  const firstTask = upcomingTasks[0];
  return {
    generatedAt: new Date().toISOString(),
    lastSessionSummary: lastSessionSummary
      ? {
          snippet: lastSessionSummary.snippet,
          bridge: lastSessionSummary.bridge,
          displaySubtitle: lastSessionSummary.displaySubtitle,
          conversationId: lastSessionSummary.conversationId,
          generatedAt: lastSessionSummary.generatedAt,
          placeholder: lastSessionSummary.placeholder,
          recentActivityPending: lastSessionSummary.recentActivityPending === true,
          headline: lastSessionSummary.headline
        }
      : null,
    homeInsight,
    phenotypeAlert: phenotypeAlert
      ? { kind: phenotypeAlert.kind, daysWithData: phenotypeAlert.daysWithData }
      : null,
    experientialFollowUpDue: dueExperiential
      ? {
          id: dueExperiential.id,
          statementPreview: String(dueExperiential.statement || '').slice(0, 80),
          conversationId: dueExperiential.conversationId
            ? String(dueExperiential.conversationId)
            : null,
          resumeExperientialFollowUp: true,
        }
      : null,
    focus: {
      line: focusLineText,
      lineSource: focusLine.mode,
      isSparseActivity,
      suggestedActions: isSparseActivity ? ['start_chat'] : [],
      suppressForChatContinuity: hasChatContinuity,
    },
    reminder: {
      candidates: reminderCandidates
    },
    protocolNext: {
      line: protocolNext.line,
      source: protocolNext.source
    },
    baWeekNext: baWeekFocus
      ? {
          slotId: baWeekFocus.slotId,
          activityDescription: baWeekFocus.activityDescription,
          dayLabel: baWeekFocus.dayLabel,
          dayOffset: baWeekFocus.dayOffset,
          isToday: baWeekFocus.isToday,
          isTomorrow: baWeekFocus.isTomorrow,
          isOverdue: baWeekFocus.isOverdue,
          pendingCount: baWeekFocus.pendingCount,
          weekStart: baWeekFocus.weekStart
        }
      : null,
    exposureNext: exposureFocus
      ? {
          planId: exposureFocus.planId,
          planTitle: exposureFocus.planTitle,
          stepDescription: exposureFocus.stepDescription,
          stepIndex: exposureFocus.stepIndex,
          stepTotal: exposureFocus.stepTotal,
          attemptCount: exposureFocus.attemptCount
        }
      : null,
    week: {
      label: summary?.period?.label,
      start: summary?.period?.start,
      end: summary?.period?.end
    },
    /** Solo la próxima tarea con fecha (UI minimal); el resto queda en el resumen / tareas. */
    nextTask: firstTask
      ? {
          _id: String(firstTask._id),
          title: firstTask.title,
          dueDate: firstTask.dueDate
        }
      : null,
    /** Próximo recordatorio de hábito (UI minimal); evita duplicar fila si ya es el recordatorio principal. */
    nextHabit: habitReminder
      ? {
          _id: String(habitReminder.id),
          title: habitReminder.title,
          reminderAt: habitReminder.nextAt ? habitReminder.nextAt.toISOString() : null
        }
      : null,
    commitments: (commitments.items || []).slice(0, FOCUS_VISIBLE_LIMIT).map((c) => ({
      id: c.id,
      label: c.label,
      status: c.status,
      conversationId: c.conversationId || null,
      followUpAt: c.followUpAt,
      followUpAnswer: c.followUpAnswer,
      followUpAttempts: c.followUpAttempts ?? 0,
      followUpDue: isFollowUpDue(
        {
          status: c.status,
          followUpAnswer: c.followUpAnswer,
          followUpAt: c.followUpAt,
          followUpAttempts: c.followUpAttempts,
          createdAt: c.createdAt,
          lastFollowUpAt: c.lastFollowUpAt,
        },
      ),
      createdAt: c.createdAt,
      interventionId: c.interventionId || null,
      sourceMeta: c.sourceMeta || null,
    })),
    dailyMood: dailyMood || null,
    engagementStreak,
    activeFocus: activeFocus
      ? {
          themeId: activeFocus.themeId,
          themeName: activeFocus.themeName,
          themeDescription: activeFocus.themeDescription,
          icon: activeFocus.icon,
          accentKey: activeFocus.accentKey,
          weekNumber: activeFocus.weekNumber,
          durationWeeks: activeFocus.durationWeeks,
          progress: activeFocus.progress,
          customGoal: activeFocus.customGoal,
          status: activeFocus.status,
          startedAt: activeFocus.startedAt,
          completedAt: activeFocus.completedAt,
          suggestedInterventions: activeFocus.suggestedInterventions,
        }
      : null,
  };
}
