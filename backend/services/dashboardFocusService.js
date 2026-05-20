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
import { getLastSessionSummaryForUser } from './lastSessionSummaryService.js';
import { buildUserSummary } from './userSummaryService.js';
import {
  focusCopy,
  focusLocale,
  localizeLastSessionSummaryForDisplay,
  normalizeFocusLanguage
} from '../utils/focusDashboardCopy.js';

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
  const doc = await UserInsight.findOne({
    userId: new mongoose.Types.ObjectId(userId)
  })
    .select('activeGoals recurringPatterns')
    .lean();
  const goals = (doc?.activeGoals || []).map((g) => String(g).trim()).filter(Boolean);
  const patterns = (doc?.recurringPatterns || []).map((p) => String(p).trim()).filter(Boolean);
  const merged = [...goals, ...patterns].slice(0, 8);
  return { goals, patterns, list: merged };
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

async function loadNextHabitReminder(userId) {
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
  let best = null;
  for (const h of habits) {
    if (h.status?.completedToday) continue;
    const rt = new Date(h.reminder.time);
    const hours = rt.getHours();
    const minutes = rt.getMinutes();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    if (!best || target.getTime() < best.nextAt.getTime()) {
      best = { id: h.id, title: h.title, nextAt: target };
    }
  }
  return best;
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
  const u = await User.findById(userId).select('notificationPreferences').lean();
  return u?.notificationPreferences || null;
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
  language = 'es'
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
      ? at.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
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
    habitReminder,
    protocolNext,
    notificationPreferences,
    lastSessionSummaryRaw
  ] = await Promise.all([
    buildUserSummary(userId, { period: 'week', language }),
    loadUpcomingTasks(userId, 5),
    loadRecentConversations(userId, 3),
    loadCommitments(userId),
    loadLatestScales(userId),
    loadNextHabitReminder(userId),
    loadTherapeuticProtocolHint(userId, language),
    loadUserNotificationPrefs(userId),
    getLastSessionSummaryForUser(userId)
  ]);

  const nextPushSlot = computeNextRoutinePushSlot(notificationPreferences, new Date(), language);

  const reminderCandidates = buildReminderCandidates({
    summary,
    recentConversations,
    upcomingTasks,
    habitReminder,
    nextPushSlot,
    now: new Date(),
    language
  });

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

  const focusLine = await maybeLlmFocusLine(
    userId,
    {
      summary,
      upcomingTasks,
      commitments,
      recentConversations,
      scales,
      deterministicCaption,
      protocolHintFromRecord: protocolNext.line,
      isSparseActivity
    },
    language
  );

  const lastSessionSummary = localizeLastSessionSummaryForDisplay(lastSessionSummaryRaw, language);

  const firstTask = upcomingTasks[0];
  return {
    generatedAt: new Date().toISOString(),
    lastSessionSummary: lastSessionSummary
      ? {
          snippet: lastSessionSummary.snippet,
          bridge: lastSessionSummary.bridge,
          conversationId: lastSessionSummary.conversationId,
          generatedAt: lastSessionSummary.generatedAt,
          placeholder: lastSessionSummary.placeholder,
          headline: lastSessionSummary.headline
        }
      : null,
    focus: {
      line: focusLine.text,
      lineSource: focusLine.mode,
      isSparseActivity,
      suggestedActions: isSparseActivity ? ['start_chat'] : []
    },
    reminder: {
      candidates: reminderCandidates
    },
    protocolNext: {
      line: protocolNext.line,
      source: protocolNext.source
    },
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
      : null
  };
}
