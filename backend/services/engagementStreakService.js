/**
 * Racha de ecosistema: chat como motor principal + crédito parcial de tareas, hábitos,
 * técnicas TCC y psicoeducación.
 */
import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import TherapeuticTechniqueUsage from '../models/TherapeuticTechniqueUsage.js';
import DailyMoodCheckIn from '../models/DailyMoodCheckIn.js';
import { formatCalendarDateKeyInTz } from './dailyMoodCheckInService.js';
import {
  ENGAGEMENT_QUALIFY_THRESHOLD,
  ENGAGEMENT_SIGNAL,
  engagementSignalQualifiesAlone,
  getEngagementSignalWeight,
} from '../utils/engagementStreakWeights.js';

function defaultEngagementStreakState() {
  return {
    current: 0,
    best: 0,
    lastQualifiedDateKey: null,
    todayDateKey: null,
    todayPoints: 0,
    todaySignals: [],
  };
}

function normalizeEngagementStreak(raw) {
  if (!raw || typeof raw !== 'object') return defaultEngagementStreakState();
  return {
    current: Math.max(0, Number(raw.current) || 0),
    best: Math.max(0, Number(raw.best) || 0),
    lastQualifiedDateKey: raw.lastQualifiedDateKey || null,
    todayDateKey: raw.todayDateKey || null,
    todayPoints: Math.max(0, Number(raw.todayPoints) || 0),
    todaySignals: Array.isArray(raw.todaySignals)
      ? raw.todaySignals.map((s) => String(s))
      : [],
  };
}

/** @param {string} dateKey YYYY-MM-DD */
export function previousDateKey(dateKey) {
  const [y, m, d] = String(dateKey).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

function isYesterdayQualified(state, todayKey) {
  const yesterdayKey = previousDateKey(todayKey);
  return state.lastQualifiedDateKey === yesterdayKey;
}

function rollEngagementDayIfNeeded(state, todayKey) {
  if (!state.todayDateKey || state.todayDateKey === todayKey) {
    if (!state.todayDateKey) {
      state.todayDateKey = todayKey;
      state.todayPoints = 0;
      state.todaySignals = [];
    }
    return state;
  }

  if (!isYesterdayQualified(state, todayKey) && state.lastQualifiedDateKey !== todayKey) {
    state.current = 0;
  }

  state.todayDateKey = todayKey;
  state.todayPoints = 0;
  state.todaySignals = [];
  return state;
}

function computeTodayQualified(state) {
  if (state.todaySignals.includes(ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE)) return true;
  return state.todayPoints >= ENGAGEMENT_QUALIFY_THRESHOLD;
}

function applyQualification(state, todayKey) {
  if (state.lastQualifiedDateKey === todayKey) return state;

  if (isYesterdayQualified(state, todayKey)) {
    state.current = Math.max(1, (state.current || 0) + 1);
  } else {
    state.current = 1;
  }

  state.lastQualifiedDateKey = todayKey;
  state.best = Math.max(state.best || 0, state.current);
  return state;
}

function addSignalToState(state, signal, todayKey) {
  const rolled = rollEngagementDayIfNeeded({ ...state, todaySignals: [...state.todaySignals] }, todayKey);
  if (rolled.todaySignals.includes(signal)) return rolled;

  const weight = getEngagementSignalWeight(signal);
  if (weight <= 0) return rolled;

  rolled.todaySignals.push(signal);
  if (engagementSignalQualifiesAlone(signal)) {
    rolled.todayPoints = ENGAGEMENT_QUALIFY_THRESHOLD;
  } else {
    rolled.todayPoints = Math.min(
      ENGAGEMENT_QUALIFY_THRESHOLD,
      Number((rolled.todayPoints + weight).toFixed(2)),
    );
  }

  if (computeTodayQualified(rolled)) {
    return applyQualification(rolled, todayKey);
  }

  return rolled;
}

async function loadUserTimezone(userId) {
  const user = await User.findById(userId).select('preferences.timezone stats.engagementStreak').lean();
  return {
    timezone: user?.preferences?.timezone || null,
    engagementStreak: normalizeEngagementStreak(user?.stats?.engagementStreak),
  };
}

async function persistEngagementStreak(userId, state) {
  await User.updateOne(
    { _id: userId },
    { $set: { 'stats.engagementStreak': state, 'stats.lastActive': new Date() } },
  );
}

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {import('../utils/engagementStreakWeights.js').EngagementSignal} signal
 */
export async function recordEngagementSignal(userId, signal) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return null;
  const uid = new mongoose.Types.ObjectId(String(userId));
  const { timezone, engagementStreak } = await loadUserTimezone(uid);
  const todayKey = formatCalendarDateKeyInTz(new Date(), timezone);
  const next = addSignalToState(engagementStreak, signal, todayKey);
  await persistEngagementStreak(uid, next);
  return toClientEngagementStreak(next, todayKey);
}

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ syncToday?: boolean }} [opts]
 */
export async function getEngagementStreak(userId, opts = {}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return toClientEngagementStreak(defaultEngagementStreakState(), null);
  }

  const uid = new mongoose.Types.ObjectId(String(userId));
  const { timezone, engagementStreak } = await loadUserTimezone(uid);
  const todayKey = formatCalendarDateKeyInTz(new Date(), timezone);

  let state = rollEngagementDayIfNeeded({ ...engagementStreak, todaySignals: [...engagementStreak.todaySignals] }, todayKey);

  const needsSync =
    opts.syncToday !== false &&
    (!state.todaySignals.length || state.todayDateKey !== todayKey);

  if (needsSync) {
    state = await syncTodayEngagementFromSources(uid, timezone, todayKey, state);
    await persistEngagementStreak(uid, state);
  } else if (state.todayDateKey !== engagementStreak.todayDateKey || state.current !== engagementStreak.current) {
    await persistEngagementStreak(uid, state);
  }

  return toClientEngagementStreak(state, todayKey);
}

function toClientEngagementStreak(state, todayKey) {
  const qualifiedToday =
    todayKey != null &&
    (state.lastQualifiedDateKey === todayKey || computeTodayQualified(state));
  return {
    current: state.current || 0,
    best: state.best || 0,
    todayPoints: state.todayPoints || 0,
    todayQualified: qualifiedToday,
    todaySignals: [...(state.todaySignals || [])],
    lastQualifiedDateKey: state.lastQualifiedDateKey,
  };
}

async function syncTodayEngagementFromSources(userId, timezone, todayKey, state) {
  const tz = timezone && String(timezone).trim() ? String(timezone).trim() : 'UTC';
  const uid = new mongoose.Types.ObjectId(String(userId));

  const [hasChat, hasTask, hasHabit, hasTechnique, hasPsychoed, hasMood] = await Promise.all([
    Message.exists({
      userId: uid,
      role: 'user',
      $expr: {
        $eq: [
          { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
          todayKey,
        ],
      },
    }),
    Task.exists({
      userId: uid,
      status: 'completed',
      itemType: { $in: ['task', 'goal'] },
      $expr: {
        $eq: [
          { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: tz } },
          todayKey,
        ],
      },
    }),
    Habit.exists({
      userId: uid,
      'status.archived': { $ne: true },
      'status.lastCompleted': { $ne: null },
      $expr: {
        $eq: [
          { $dateToString: { format: '%Y-%m-%d', date: '$status.lastCompleted', timezone: tz } },
          todayKey,
        ],
      },
    }),
    TherapeuticTechniqueUsage.exists({
      userId: uid,
      completed: true,
      $expr: {
        $eq: [
          { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: tz } },
          todayKey,
        ],
      },
    }),
    ChatInterventionEvent.exists({
      userId: uid,
      eventType: 'completed',
      interventionId: { $regex: /^psychoeducation_/ },
      $expr: {
        $eq: [
          { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
          todayKey,
        ],
      },
    }),
    DailyMoodCheckIn.exists({ userId: uid, dateKey: todayKey }),
  ]);

  let next = state;
  if (hasChat) next = addSignalToState(next, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, todayKey);
  if (hasTask) next = addSignalToState(next, ENGAGEMENT_SIGNAL.TASK_COMPLETED, todayKey);
  if (hasHabit) next = addSignalToState(next, ENGAGEMENT_SIGNAL.HABIT_COMPLETED, todayKey);
  if (hasTechnique) next = addSignalToState(next, ENGAGEMENT_SIGNAL.TECHNIQUE_COMPLETED, todayKey);
  if (hasPsychoed) next = addSignalToState(next, ENGAGEMENT_SIGNAL.PSYCHOEDUCATION_COMPLETED, todayKey);
  if (hasMood) next = addSignalToState(next, ENGAGEMENT_SIGNAL.MOOD_CHECKIN, todayKey);

  return next;
}

export function mapInterventionIdToEngagementSignal(interventionId) {
  const id = String(interventionId || '').trim();
  if (id.startsWith('psychoeducation_')) return ENGAGEMENT_SIGNAL.PSYCHOEDUCATION_COMPLETED;
  if (
    id === 'abc_record' ||
    id === 'behavioral_activation' ||
    id === 'exposure_hierarchy' ||
    id === 'automatic_thought_record'
  ) {
    return ENGAGEMENT_SIGNAL.TECHNIQUE_COMPLETED;
  }
  return null;
}

/** Solo tests: aplica una señal sobre estado en memoria. */
export function applyEngagementSignalForTest(state, signal, todayKey) {
  return addSignalToState(normalizeEngagementStreak(state), signal, todayKey);
}
