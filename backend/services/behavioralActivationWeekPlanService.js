/**
 * Plan semanal de activación conductual (#88).
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import BehavioralActivationWeekPlan from '../models/BehavioralActivationWeekPlan.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

const DEFAULT_SLOT_BLUEPRINTS = {
  es: [
    {
      dayOffset: 0,
      activityType: 'pleasant',
      activityDescription: 'Paseo corto al aire libre (10 minutos)',
    },
    {
      dayOffset: 2,
      activityType: 'routine',
      activityDescription: 'Ordenar un rincón pequeño de casa',
    },
    {
      dayOffset: 4,
      activityType: 'pleasant',
      activityDescription: 'Hacer algo que antes disfrutabas, aunque sea poco',
    },
    {
      dayOffset: 5,
      activityType: 'pleasant',
      activityDescription: 'Contactar a alguien con quien te sientas a gusto',
    },
    {
      dayOffset: 6,
      activityType: 'routine',
      activityDescription: 'Preparar una comida sencilla y sentarte a comerla',
    },
  ],
  en: [
    {
      dayOffset: 0,
      activityType: 'pleasant',
      activityDescription: 'Short walk outside (10 minutes)',
    },
    {
      dayOffset: 2,
      activityType: 'routine',
      activityDescription: 'Tidy one small corner of your home',
    },
    {
      dayOffset: 4,
      activityType: 'pleasant',
      activityDescription: 'Do something you used to enjoy, even a little',
    },
    {
      dayOffset: 5,
      activityType: 'pleasant',
      activityDescription: 'Reach out to someone you feel comfortable with',
    },
    {
      dayOffset: 6,
      activityType: 'routine',
      activityDescription: 'Prepare a simple meal and sit down to eat it',
    },
  ],
};

export function normalizeWeekStart(input) {
  const d =
    input instanceof Date
      ? new Date(input.getTime())
      : new Date(String(input || '').trim() || Date.now());
  if (Number.isNaN(d.getTime())) {
    return normalizeWeekStart(new Date());
  }
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc;
}

export function formatWeekStartKey(date) {
  return normalizeWeekStart(date).toISOString().slice(0, 10);
}

export function buildDefaultWeekPlanSlots(language = 'es') {
  const lang = normalizeApiLanguage(language);
  const blueprints = DEFAULT_SLOT_BLUEPRINTS[lang] || DEFAULT_SLOT_BLUEPRINTS.es;
  return blueprints.map((slot) => ({
    slotId: crypto.randomUUID(),
    dayOffset: slot.dayOffset,
    activityDescription: slot.activityDescription,
    activityType: slot.activityType,
    status: 'planned',
    completedLogId: null,
  }));
}

/**
 * Normaliza slots antes de persistir (estado coherente, sin duplicados).
 */
export function normalizeWeekPlanSlots(slots) {
  if (!Array.isArray(slots)) return [];
  const seen = new Set();
  return slots
    .map((slot) => {
      const slotId = String(slot?.slotId || '').trim();
      if (!slotId || seen.has(slotId)) return null;
      seen.add(slotId);
      const status = ['planned', 'completed', 'skipped'].includes(slot?.status)
        ? slot.status
        : 'planned';
      const activityType = slot?.activityType === 'routine' ? 'routine' : 'pleasant';
      const dayOffset = Math.max(0, Math.min(6, Number(slot?.dayOffset) || 0));
      const activityDescription = String(slot?.activityDescription || '').trim().slice(0, 500);
      if (!activityDescription) return null;
      const completedLogId =
        status === 'completed' && /^[a-fA-F0-9]{24}$/.test(String(slot?.completedLogId || ''))
          ? String(slot.completedLogId)
          : null;
      return {
        slotId,
        dayOffset,
        activityDescription,
        activityType,
        status,
        completedLogId,
      };
    })
    .filter(Boolean)
    .slice(0, 7);
}

export function getWeekDayLabels(language = 'es') {
  const lang = normalizeApiLanguage(language);
  return lang === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
}

function toObjectId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

export async function getOrCreateWeekPlan(userId, weekStartInput, language = 'es') {
  if (!userId) {
    throw new Error('userId required');
  }
  const weekStart = normalizeWeekStart(weekStartInput);
  const uid = toObjectId(userId);

  let plan = await BehavioralActivationWeekPlan.findOne({ userId: uid, weekStart }).lean();
  if (!plan) {
    const created = await BehavioralActivationWeekPlan.create({
      userId: uid,
      weekStart,
      slots: buildDefaultWeekPlanSlots(language),
    });
    plan = created.toObject();
  }

  return {
    plan,
    weekStart: formatWeekStartKey(weekStart),
    dayLabels: getWeekDayLabels(language),
  };
}

/** Solo lectura: no crea plan si no existe (#6 / contexto chat). */
export async function findWeekPlanForUser(userId, weekStartInput, language = 'es') {
  if (!userId) return null;
  const weekStart = normalizeWeekStart(weekStartInput);
  const uid = toObjectId(userId);
  const plan = await BehavioralActivationWeekPlan.findOne({ userId: uid, weekStart }).lean();
  if (!plan) return null;
  return {
    plan,
    weekStart: formatWeekStartKey(weekStart),
    dayLabels: getWeekDayLabels(language),
  };
}

export async function saveWeekPlan(userId, weekStartInput, slots, language = 'es') {
  if (!userId) {
    throw new Error('userId required');
  }
  const weekStart = normalizeWeekStart(weekStartInput);
  const uid = toObjectId(userId);
  const normalizedSlots = normalizeWeekPlanSlots(slots);
  const slotsToSave =
    normalizedSlots.length > 0 ? normalizedSlots : buildDefaultWeekPlanSlots(language);

  const plan = await BehavioralActivationWeekPlan.findOneAndUpdate(
    { userId: uid, weekStart },
    {
      $set: { slots: slotsToSave },
      $setOnInsert: { userId: uid, weekStart },
    },
    { upsert: true, new: true, runValidators: true },
  ).lean();

  return {
    plan,
    weekStart: formatWeekStartKey(weekStart),
    dayLabels: getWeekDayLabels(language),
  };
}
