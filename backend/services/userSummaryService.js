/**
 * Agrega datos de la app para resúmenes semanales (lunes–domingo) y mensuales (mes calendario).
 */
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Journal from '../models/Journal.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import User from '../models/User.js';
import UserInsight from '../models/UserInsight.js';
import UserProgress from '../models/UserProgress.js';
import TherapeuticTechniqueUsage from '../models/TherapeuticTechniqueUsage.js';
import cacheService from './cacheService.js';
import openaiService from './openaiService.js';

/** Ventana de un bloque "semana" del modelo Hábito (desde 1 ene, + week * 7 días). */
function habitWeekWindow(week, year) {
  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() + week * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Lunes 00:00 al domingo 23:59:59 (hora local) de la semana que contiene `anchor`.
 */
export function calendarWeekRangeFromAnchor(anchor) {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: d, end };
}

export function calendarMonthRange(year, month1to12) {
  const start = new Date(year, month1to12 - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month1to12, 0, 23, 59, 59, 999);
  return { start, end };
}

function parseYmdLocal(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function formatPeriodLabelEs(start, end, type) {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (type === 'week') {
    return `${start.toLocaleDateString('es', opts)} – ${end.toLocaleDateString('es', opts)}`;
  }
  return start.toLocaleDateString('es', { month: 'long', year: 'numeric' });
}

function topEmotionCounts(rows, limit = 8) {
  const map = new Map();
  for (const r of rows) {
    const e = (r.emotion || 'neutral').toLowerCase();
    map.set(e, (map.get(e) || 0) + 1);
  }
  return [...map.entries()]
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function topTopicCounts(rows, limit = 8) {
  const map = new Map();
  for (const r of rows) {
    const t = (r.topic || 'general').toLowerCase();
    map.set(t, (map.get(t) || 0) + 1);
  }
  return [...map.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function toPosIntOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function isWithinWeeklyNarrativeLlmWindow(lastWeeklyTipsEmailAt, now = new Date()) {
  if (!lastWeeklyTipsEmailAt) return false;
  const sentAt = new Date(lastWeeklyTipsEmailAt);
  if (Number.isNaN(sentAt.getTime())) return false;
  const diffMs = now.getTime() - sentAt.getTime();
  if (diffMs < 0) return false;
  const windowHours = toPosIntOr(process.env.WEEKLY_SUMMARY_LLM_WINDOW_HOURS, 36);
  return diffMs <= windowHours * 60 * 60 * 1000;
}

function buildDeterministicNarrative(summary) {
  const topTopic = summary?.emotions?.progressTopicsTop?.[0]?.topic || 'tu proceso personal';
  const topEmotion = summary?.emotions?.insightsEmotionsTop?.[0]?.emotion || null;
  const tasksDone = summary?.tasks?.completedInPeriod ?? 0;
  const habitCompletions = summary?.habits?.completionsInPeriod ?? 0;
  const activeDays = summary?.chat?.distinctActiveDays ?? 0;
  const userMessages = summary?.chat?.userMessages ?? 0;

  const themes = topEmotion
    ? `Se repitieron temas ligados a ${topTopic} y aparecieron señales emocionales de tipo ${topEmotion}.`
    : `Se repitieron temas ligados a ${topTopic}, con foco en sostener tu proceso paso a paso.`;

  let microWins = 'Sostuviste presencia en la app, aunque fuera en micro-momentos.';
  if (tasksDone > 0 || habitCompletions > 0) {
    microWins = `Completaste ${tasksDone} tarea${tasksDone === 1 ? '' : 's'} y registraste ${habitCompletions} avance${habitCompletions === 1 ? '' : 's'} en hábitos.`;
  } else if (activeDays > 0 || userMessages > 0) {
    microWins = `Tuviste actividad ${activeDays} día${activeDays === 1 ? '' : 's'} y abriste ${userMessages} mensaje${userMessages === 1 ? '' : 's'} en el chat.`;
  }

  let nextQuestion = '¿Qué pequeño paso realista te gustaría priorizar esta semana para cuidarte mejor?';
  if (tasksDone >= 3 || habitCompletions >= 4) {
    nextQuestion = '¿Qué condición te ayudó a sostener estos avances y cómo la puedes repetir esta semana?';
  } else if (activeDays <= 1) {
    nextQuestion = '¿Qué micro-hábito de 2 minutos podrías retomar primero para volver a tomar ritmo?';
  }

  return { themes, microWins, nextQuestion };
}

function parseLlmNarrative(rawText) {
  const raw = String(rawText || '').trim();
  if (!raw) return null;

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const take = (prefix) =>
    lines.find((l) => l.toUpperCase().startsWith(prefix))?.replace(/^[^:]+:\s*/i, '').trim();

  const themes = take('TEMAS:');
  const microWins = take('LOGROS:');
  const nextQuestion = take('PREGUNTA:');
  if (!themes || !microWins || !nextQuestion) return null;
  return { themes, microWins, nextQuestion };
}

async function buildNarrative(summary, user) {
  const fallback = buildDeterministicNarrative(summary);
  const llmEnabled = process.env.WEEKLY_SUMMARY_LLM_ENABLED === 'true';
  const isWeek = summary?.period?.type === 'week';
  const insideWindow = isWithinWeeklyNarrativeLlmWindow(user?.stats?.lastWeeklyTipsEmailAt);

  if (!llmEnabled || !isWeek || !insideWindow || !process.env.OPENAI_API_KEY) {
    return {
      mode: 'deterministic',
      ...fallback
    };
  }

  try {
    const windowHours = toPosIntOr(process.env.WEEKLY_SUMMARY_LLM_WINDOW_HOURS, 36);
    const windowMs = windowHours * 60 * 60 * 1000;
    const sentAt = new Date(user?.stats?.lastWeeklyTipsEmailAt);
    const elapsedMs = Math.max(0, Date.now() - sentAt.getTime());
    const ttlSeconds = Math.max(60, Math.floor((windowMs - elapsedMs) / 1000));
    const cacheKey = cacheService.generateKey('weekly_summary_narrative_v1', {
      userId: String(user?._id || ''),
      periodStart: summary?.period?.start || '',
      periodEnd: summary?.period?.end || '',
      mode: 'week'
    });

    const cached = await cacheService.get(cacheKey);
    if (cached && cached.themes && cached.microWins && cached.nextQuestion) {
      return {
        mode: 'llm_cached',
        themes: String(cached.themes),
        microWins: String(cached.microWins),
        nextQuestion: String(cached.nextQuestion)
      };
    }

    const model = process.env.WEEKLY_SUMMARY_LLM_MODEL || 'gpt-4o-mini';
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Eres redactor de resúmenes semanales en español para bienestar emocional. Tono cálido, concreto, no clínico. Sin diagnóstico. Responde EXACTAMENTE en 3 líneas con este formato: TEMAS: ...\\nLOGROS: ...\\nPREGUNTA: ...'
        },
        {
          role: 'user',
          content: `Periodo: ${summary?.period?.label || 'semana actual'}\nTemasTop: ${JSON.stringify(
            summary?.emotions?.progressTopicsTop || []
          )}\nEmocionesTop: ${JSON.stringify(summary?.emotions?.insightsEmotionsTop || [])}\nMétricas: ${JSON.stringify(
            {
              userMessages: summary?.chat?.userMessages ?? 0,
              activeDays: summary?.chat?.distinctActiveDays ?? 0,
              tasksCompleted: summary?.tasks?.completedInPeriod ?? 0,
              habitsCompletions: summary?.habits?.completionsInPeriod ?? 0,
              journalEntries: summary?.journal?.entriesCount ?? 0,
              techniquesUses: summary?.techniques?.totalUses ?? 0
            }
          )}`
        }
      ],
      max_completion_tokens: 220,
      temperature: 0.4
    });

    const raw = completion?.choices?.[0]?.message?.content || '';
    const parsed = parseLlmNarrative(raw);
    if (!parsed) throw new Error('LLM_NARRATIVE_PARSE_FAILED');

    await cacheService.set(cacheKey, parsed, ttlSeconds);

    return {
      mode: 'llm',
      ...parsed
    };
  } catch {
    return {
      mode: 'deterministic_fallback',
      ...fallback
    };
  }
}

async function aggregateChat(userId, start, end) {
  const uid = new mongoose.Types.ObjectId(userId);
  const match = {
    userId: uid,
    createdAt: { $gte: start, $lte: end }
  };

  const [byRole, convos, userDays] = await Promise.all([
    Message.aggregate([
      { $match: match },
      { $group: { _id: '$role', n: { $sum: 1 } } }
    ]),
    Message.distinct('conversationId', {
      ...match,
      role: 'user'
    }),
    Message.aggregate([
      { $match: { ...match, role: 'user' } },
      {
        $group: {
          _id: {
            y: { $year: '$createdAt' },
            m: { $month: '$createdAt' },
            d: { $dayOfMonth: '$createdAt' }
          }
        }
      },
      { $count: 'days' }
    ])
  ]);

  const roleMap = Object.fromEntries(byRole.map((x) => [x._id, x.n]));
  const distinctActiveDays = userDays[0]?.days || 0;

  return {
    userMessages: roleMap.user || 0,
    assistantMessages: roleMap.assistant || 0,
    distinctActiveDays,
    conversationsTouched: convos.length
  };
}

function habitCompletionsOverlappingWeek(habits, periodStart, periodEnd) {
  let total = 0;
  const byTitle = [];
  for (const h of habits) {
    const wps = h.progress?.weeklyProgress || [];
    let habitSum = 0;
    for (const wp of wps) {
      if (wp.year == null || wp.week == null) continue;
      const { start, end } = habitWeekWindow(wp.week, wp.year);
      if (rangesOverlap(periodStart, periodEnd, start, end)) {
        habitSum += wp.completedDays || 0;
      }
    }
    total += habitSum;
    if (habitSum > 0) {
      byTitle.push({ title: h.title, completionsRecorded: habitSum });
    }
  }
  byTitle.sort((a, b) => b.completionsRecorded - a.completionsRecorded);
  return { total, topHabits: byTitle.slice(0, 5) };
}

function habitCompletionsForCalendarMonth(habits, month0, year) {
  let total = 0;
  const byTitle = [];
  for (const h of habits) {
    const mps = h.progress?.monthlyProgress || [];
    const hit = mps.find((mp) => mp.month === month0 && mp.year === year);
    const n = hit?.completedDays || 0;
    total += n;
    if (n > 0) byTitle.push({ title: h.title, completionsRecorded: n });
  }
  byTitle.sort((a, b) => b.completionsRecorded - a.completionsRecorded);
  return { total, topHabits: byTitle.slice(0, 5) };
}

/**
 * @param {string} userId
 * @param {{ period: 'week'|'month', date?: string, year?: number, month?: number }} opts
 */
export async function buildUserSummary(userId, opts) {
  const { period } = opts;
  let start;
  let end;
  let label;

  if (period === 'week') {
    const anchor = opts.date ? parseYmdLocal(opts.date) : new Date();
    if (opts.date && !anchor) {
      const err = new Error('INVALID_DATE');
      err.code = 'INVALID_DATE';
      throw err;
    }
    ({ start, end } = calendarWeekRangeFromAnchor(anchor));
    label = formatPeriodLabelEs(start, end, 'week');
  } else {
    const now = new Date();
    const y = opts.year != null ? Number(opts.year) : now.getFullYear();
    const m = opts.month != null ? Number(opts.month) : now.getMonth() + 1;
    if (!Number.isInteger(y) || y < 2000 || y > 2100 || !Number.isInteger(m) || m < 1 || m > 12) {
      const err = new Error('INVALID_MONTH');
      err.code = 'INVALID_MONTH';
      throw err;
    }
    ({ start, end } = calendarMonthRange(y, m));
    label = formatPeriodLabelEs(start, end, 'month');
  }

  const uid = new mongoose.Types.ObjectId(userId);
  const month0 = start.getMonth();
  const year = start.getFullYear();

  const [
    chat,
    tasksCompleted,
    tasksCreated,
    journalCount,
    habitsLean,
    insightDoc,
    progressDoc,
    techniques,
    userDoc
  ] = await Promise.all([
    aggregateChat(userId, start, end),
    Task.countDocuments({
      userId: uid,
      deletedAt: { $exists: false },
      status: 'completed',
      completedAt: { $gte: start, $lte: end }
    }),
    Task.countDocuments({
      userId: uid,
      deletedAt: { $exists: false },
      createdAt: { $gte: start, $lte: end }
    }),
    Journal.countDocuments({
      userId: uid,
      archived: false,
      entryDate: { $gte: start, $lte: end }
    }),
    Habit.find({
      userId: uid,
      deletedAt: { $exists: false }
    })
      .select('title progress status.archived')
      .lean(),
    UserInsight.findOne({ userId: uid }).lean(),
    UserProgress.findOne({ userId: uid }).lean(),
    TherapeuticTechniqueUsage.getUserStats(userId, { startDate: start, endDate: end }),
    User.findById(uid).select('name username stats.lastWeeklyTipsEmailAt').lean()
  ]);

  const interactions = (insightDoc?.interactions || []).filter(
    (i) => i.timestamp >= start && i.timestamp <= end
  );
  const insightsEmotions = topEmotionCounts(
    interactions.map((i) => ({ emotion: i.emotion, intensity: i.intensity }))
  );
  const avgInsightIntensity =
    interactions.length > 0
      ? Math.round(
          (interactions.reduce((s, i) => s + (Number(i.intensity) || 0), 0) / interactions.length) *
            10
        ) / 10
      : null;

  const entries = (progressDoc?.entries || []).filter(
    (e) => e.timestamp >= start && e.timestamp <= end
  );
  const progressTopics = topTopicCounts(
    entries.map((e) => ({ topic: e.context?.topic || 'general' }))
  );
  const avgProgressIntensity =
    entries.length > 0
      ? Math.round(
          (entries.reduce((s, e) => s + (Number(e.emotionalState?.intensity) || 0), 0) /
            entries.length) *
            10
        ) / 10
      : null;

  const activeHabits = habitsLean.filter((h) => !h.status?.archived);
  const bestStreakAmongActive = activeHabits.reduce(
    (m, h) => Math.max(m, h.progress?.streak || 0),
    0
  );

  let habitsBlock;
  if (period === 'week') {
    habitsBlock = habitCompletionsOverlappingWeek(habitsLean, start, end);
  } else {
    habitsBlock = habitCompletionsForCalendarMonth(habitsLean, month0, year);
  }

  const summaryPayload = {
    period: {
      type: period,
      start: start.toISOString(),
      end: end.toISOString(),
      label
    },
    chat,
    emotions: {
      insightInteractionsCount: interactions.length,
      insightsEmotionsTop: insightsEmotions,
      averageIntensityFromInsights: avgInsightIntensity,
      progressSessionsCount: entries.length,
      progressTopicsTop: progressTopics,
      averageIntensityFromProgress: avgProgressIntensity
    },
    techniques: {
      totalUses: techniques.totalUses,
      completedUses: techniques.completedUses,
      completionRate: techniques.completionRate,
      totalDurationSeconds: techniques.totalDuration,
      averageEffectiveness: techniques.averageEffectiveness,
      uniqueTechniques: techniques.uniqueTechniques
    },
    tasks: {
      completedInPeriod: tasksCompleted,
      createdInPeriod: tasksCreated
    },
    habits: {
      completionsInPeriod: habitsBlock.total,
      topHabitsInPeriod: habitsBlock.topHabits,
      activeHabitsCount: activeHabits.length,
      bestCurrentStreakAmongActive: bestStreakAmongActive
    },
    journal: {
      entriesCount: journalCount
    }
  };

  const narrative = await buildNarrative(summaryPayload, userDoc);

  return {
    ...summaryPayload,
    narrative
  };
}
