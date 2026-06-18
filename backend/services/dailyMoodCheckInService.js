/**
 * Check-in emocional diario (dashboard → chat / foco).
 */
import mongoose from 'mongoose';
import DailyMoodCheckIn, { DAILY_MOOD_VALUES } from '../models/DailyMoodCheckIn.js';
import User from '../models/User.js';
import {
  isValidDailyMood,
  normalizeDailyMoodLanguage,
  toClientDailyMoodCheckIn,
} from '../utils/dailyMoodCopy.js';

export { DAILY_MOOD_VALUES };

/**
 * @param {Date} [date]
 * @param {string|null} [timeZone]
 * @returns {string} YYYY-MM-DD
 */
export function formatCalendarDateKeyInTz(date = new Date(), timeZone) {
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit' };
  if (timeZone && String(timeZone).trim()) {
    opts.timeZone = String(timeZone).trim();
  }
  return new Intl.DateTimeFormat('en-CA', opts).format(new Date(date));
}

async function resolveUserTimezone(userId, timezone) {
  if (timezone && String(timezone).trim()) return String(timezone).trim();
  const user = await User.findById(userId).select('preferences.timezone').lean();
  return user?.preferences?.timezone || null;
}

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ timezone?: string|null, language?: 'es'|'en' }} [opts]
 */
export async function getTodayDailyMoodCheckIn(userId, opts = {}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return null;
  }
  const language = normalizeDailyMoodLanguage(opts.language);
  const timezone = await resolveUserTimezone(userId, opts.timezone);
  const dateKey = formatCalendarDateKeyInTz(new Date(), timezone);
  const doc = await DailyMoodCheckIn.findOne({
    userId: new mongoose.Types.ObjectId(String(userId)),
    dateKey,
  }).lean();
  return toClientDailyMoodCheckIn(doc, language);
}

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} mood
 * @param {{ timezone?: string|null, source?: string, language?: 'es'|'en' }} [opts]
 */
export async function upsertTodayDailyMoodCheckIn(userId, mood, opts = {}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { error: 'invalidUser' };
  }
  const normalizedMood = String(mood || '').trim();
  if (!isValidDailyMood(normalizedMood)) {
    return { error: 'invalidMood' };
  }

  const language = normalizeDailyMoodLanguage(opts.language);
  const timezone = await resolveUserTimezone(userId, opts.timezone);
  const dateKey = formatCalendarDateKeyInTz(new Date(), timezone);
  const uid = new mongoose.Types.ObjectId(String(userId));

  const doc = await DailyMoodCheckIn.findOneAndUpdate(
    { userId: uid, dateKey },
    {
      $set: {
        mood: normalizedMood,
        timezone: timezone || null,
        source: opts.source === 'dashboard' ? 'dashboard' : 'dashboard',
      },
      $setOnInsert: { userId: uid, dateKey },
    },
    { new: true, upsert: true, runValidators: true },
  ).lean();

  return { checkIn: toClientDailyMoodCheckIn(doc, language) };
}

/**
 * Historial reciente para insights (opcional).
 * @param {string} userId
 * @param {{ limit?: number, language?: 'es'|'en' }} [opts]
 */
export async function listRecentDailyMoodCheckIns(userId, opts = {}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return [];
  }
  const language = normalizeDailyMoodLanguage(opts.language);
  const limit = Math.min(Math.max(Number(opts.limit) || 7, 1), 30);
  const rows = await DailyMoodCheckIn.find({
    userId: new mongoose.Types.ObjectId(String(userId)),
  })
    .sort({ dateKey: -1 })
    .limit(limit)
    .lean();
  return rows.map((row) => toClientDailyMoodCheckIn(row, language));
}
