/**
 * Puente BA ↔ tareas/hábitos: vínculo (fase 1) y sincronización de completado (fase 2).
 */
import mongoose from 'mongoose';
import BehavioralActivationWeekPlan from '../models/BehavioralActivationWeekPlan.js';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import { normalizeWeekStart } from './behavioralActivationWeekPlanService.js';

const BA_PRODUCT_SOURCES = new Set(['ba_week_plan_v1']);

function toObjectId(value) {
  if (!value) return null;
  const s = String(value);
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

/**
 * Fecha para tarea/hábito: día del slot en la semana del plan a las 18:00.
 * Si ese momento ya pasó, se agenda la misma actividad el mismo día de la semana siguiente (+7 días).
 */
export function computeSlotDueDate(weekStart, dayOffset) {
  const start = normalizeWeekStart(weekStart);
  const due = new Date(start.getTime());
  due.setUTCDate(due.getUTCDate() + Number(dayOffset) || 0);
  due.setHours(18, 0, 0, 0);

  const now = new Date();
  while (due <= now) {
    due.setDate(due.getDate() + 7);
  }
  return due;
}

export function suggestProductKindForSlot(slot) {
  return slot?.activityType === 'routine' ? 'habit' : 'task';
}

function clampTitle(text, max = 100) {
  const t = String(text || '').trim();
  if (t.length >= 3) return t.slice(0, max);
  return `${t || 'Actividad BA'}`.slice(0, max);
}

export function inferHabitIcon(description = '') {
  const d = String(description).toLowerCase();
  if (/(paseo|caminar|walk|ejercicio|sport)/i.test(d)) return 'exercise';
  if (/(dormir|sleep|descans)/i.test(d)) return 'sleep';
  if (/(leer|reading|estudi)/i.test(d)) return 'reading';
  if (/(meditar|mindful|respir)/i.test(d)) return 'meditation';
  if (/(comida|cocinar|meal|eat)/i.test(d)) return 'diet';
  if (/(contactar|llamar|mensaje|social)/i.test(d)) return 'journal';
  if (/(ordenar|limpiar|tarea|house)/i.test(d)) return 'study';
  return 'journal';
}

export function buildTaskDraftFromBaSlot({ slot, weekStart }) {
  const dueDate = computeSlotDueDate(weekStart, slot.dayOffset);
  return {
    title: clampTitle(slot.activityDescription),
    description: '',
    dueDate,
    priority: 'medium',
    itemType: 'task',
    category: 'Bienestar',
    tags: ['ba'],
  };
}

export function buildHabitDraftFromBaSlot({ slot, weekStart }) {
  const reminderTime = computeSlotDueDate(weekStart, slot.dayOffset);
  return {
    title: clampTitle(slot.activityDescription),
    description: '',
    icon: inferHabitIcon(slot.activityDescription),
    frequency: 'weekly',
    reminder: {
      enabled: true,
      time: reminderTime,
    },
    priority: 'medium',
  };
}

function buildClientRequestId(weekPlanId, slotId) {
  return `ba_slot_${String(weekPlanId)}_${String(slotId)}`.slice(0, 80);
}

function findSlotInPlan(plan, slotId) {
  const slots = Array.isArray(plan?.slots) ? plan.slots : [];
  return slots.find((s) => String(s?.slotId) === String(slotId)) || null;
}

function assertNoCrossLinkConflict(slot, kind) {
  if (kind === 'task' && slot?.linkedHabitId) {
    throw Object.assign(new Error('slot_has_habit'), { code: 'SLOT_LINK_CONFLICT' });
  }
  if (kind === 'habit' && slot?.linkedTaskId) {
    throw Object.assign(new Error('slot_has_task'), { code: 'SLOT_LINK_CONFLICT' });
  }
}

/**
 * Marca tarea/hábito vinculados como hechos tras registro BA con ánimo.
 */
export async function syncProductFromBaCompletion({ userId, taskId, habitId, logId = null }) {
  const uid = toObjectId(userId);
  const logOid = toObjectId(logId);
  if (!uid) return null;

  const result = {};

  if (taskId) {
    const tid = toObjectId(taskId);
    const task = await Task.findOne({
      _id: tid,
      userId: uid,
      deletedAt: { $exists: false },
    });
    if (task && task.status !== 'completed') {
      await task.markAsCompleted();
      result.taskCompleted = true;
    }
    if (logOid && tid) {
      await Task.updateOne(
        { _id: tid, userId: uid },
        { $set: { 'baOrigin.logId': logOid } },
      );
    }
  }

  if (habitId) {
    const hid = toObjectId(habitId);
    const habit = await Habit.findOne({
      _id: hid,
      userId: uid,
      deletedAt: { $exists: false },
    });
    if (habit && !habit.status?.archived && !habit.status?.completedToday) {
      await habit.toggleComplete();
      result.habitCompleted = true;
    }
    if (logOid && hid) {
      await Habit.updateOne(
        { _id: hid, userId: uid },
        { $set: { 'baOrigin.logId': logOid } },
      );
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Marca slot BA como completado cuando el usuario completa tarea/hábito vinculado.
 */
export async function syncBaSlotFromProductCompletion({ userId, taskId, habitId }) {
  const uid = toObjectId(userId);
  if (!uid) return null;

  let origin = null;
  let linkedTaskId = null;
  let linkedHabitId = null;

  if (taskId) {
    const task = await Task.findOne({
      _id: toObjectId(taskId),
      userId: uid,
      deletedAt: { $exists: false },
    })
      .select('baOrigin status')
      .lean();
    if (!task?.baOrigin?.weekPlanId || !task?.baOrigin?.slotId) return null;
    if (task.status !== 'completed') return null;
    origin = task.baOrigin;
    linkedTaskId = task._id;
  } else if (habitId) {
    const habit = await Habit.findOne({
      _id: toObjectId(habitId),
      userId: uid,
      deletedAt: { $exists: false },
    })
      .select('baOrigin status')
      .lean();
    if (!habit?.baOrigin?.weekPlanId || !habit?.baOrigin?.slotId) return null;
    if (!habit.status?.completedToday) return null;
    origin = habit.baOrigin;
    linkedHabitId = habit._id;
  } else {
    return null;
  }

  const plan = await BehavioralActivationWeekPlan.findById(origin.weekPlanId);
  if (!plan) return null;

  const slot = findSlotInPlan(plan, origin.slotId);
  if (!slot || slot.status === 'completed' || slot.status === 'skipped') {
    return { skipped: true, plan: plan.toObject() };
  }

  const setFields = { 'slots.$.status': 'completed' };
  if (linkedTaskId) setFields['slots.$.linkedTaskId'] = linkedTaskId;
  if (linkedHabitId) setFields['slots.$.linkedHabitId'] = linkedHabitId;

  await BehavioralActivationWeekPlan.updateOne(
    { _id: plan._id, 'slots.slotId': origin.slotId },
    { $set: setFields },
  );

  return {
    updated: true,
    plan: await BehavioralActivationWeekPlan.findById(plan._id).lean(),
  };
}

/**
 * Tras guardar log BA: sincroniza producto vinculado y refuerza completedLogId en el slot.
 */
export async function syncBaEcosystemFromLog({ userId, weekStartInput, slotId, logId }) {
  const uid = toObjectId(userId);
  const slotKey = String(slotId || '').trim();
  const logOid = toObjectId(logId);
  if (!uid || !slotKey || !logOid) return null;

  const weekStart = normalizeWeekStart(weekStartInput);
  const plan = await BehavioralActivationWeekPlan.findOne({ userId: uid, weekStart });
  if (!plan) return null;

  const slot = findSlotInPlan(plan, slotKey);
  if (!slot) return null;

  await BehavioralActivationWeekPlan.updateOne(
    { _id: plan._id, 'slots.slotId': slotKey },
    {
      $set: {
        'slots.$.status': 'completed',
        'slots.$.completedLogId': logOid,
      },
    },
  );

  const syncResult = await syncProductFromBaCompletion({
    userId: uid,
    taskId: slot.linkedTaskId,
    habitId: slot.linkedHabitId,
    logId: logOid,
  });

  return {
    plan: await BehavioralActivationWeekPlan.findById(plan._id).lean(),
    sync: syncResult,
  };
}

/**
 * @returns {Promise<{ productKind: 'task'|'habit', task?: object, habit?: object, plan: object, idempotentReplay?: boolean }>}
 */
export async function linkBaSlotToProduct({
  userId,
  weekStartInput,
  slotId,
  productKind = 'auto',
  logId = null,
}) {
  const uid = toObjectId(userId);
  const slotKey = String(slotId || '').trim();
  if (!uid || !slotKey) {
    throw Object.assign(new Error('invalid_input'), { code: 'INVALID_INPUT' });
  }

  const weekStart = normalizeWeekStart(weekStartInput);
  const plan = await BehavioralActivationWeekPlan.findOne({ userId: uid, weekStart });
  if (!plan) {
    throw Object.assign(new Error('plan_not_found'), { code: 'PLAN_NOT_FOUND' });
  }

  const slot = findSlotInPlan(plan, slotKey);
  if (!slot) {
    throw Object.assign(new Error('slot_not_found'), { code: 'SLOT_NOT_FOUND' });
  }

  const kind =
    productKind === 'task' || productKind === 'habit'
      ? productKind
      : suggestProductKindForSlot(slot);

  assertNoCrossLinkConflict(slot, kind);

  const clientRequestId = buildClientRequestId(plan._id, slotKey);
  const logOid = toObjectId(logId);
  const baOrigin = {
    weekPlanId: plan._id,
    slotId: slotKey,
    source: 'ba_week_plan_v1',
    ...(logOid ? { logId: logOid } : {}),
  };

  if (kind === 'task' && slot.linkedTaskId) {
    const existing = await Task.findOne({
      _id: slot.linkedTaskId,
      userId: uid,
      deletedAt: { $exists: false },
    }).lean();
    if (existing) {
      if (logOid) {
        await syncProductFromBaCompletion({
          userId: uid,
          taskId: existing._id,
          logId: logOid,
        });
      }
      return { productKind: 'task', task: existing, plan: plan.toObject(), idempotentReplay: true };
    }
  }

  if (kind === 'habit' && slot.linkedHabitId) {
    const existing = await Habit.findOne({
      _id: slot.linkedHabitId,
      userId: uid,
      deletedAt: { $exists: false },
    }).lean();
    if (existing) {
      if (logOid) {
        await syncProductFromBaCompletion({
          userId: uid,
          habitId: existing._id,
          logId: logOid,
        });
      }
      return { productKind: 'habit', habit: existing, plan: plan.toObject(), idempotentReplay: true };
    }
  }

  const existingByRequest =
    kind === 'task'
      ? await Task.findOne({
          userId: uid,
          clientRequestId,
          deletedAt: { $exists: false },
        }).lean()
      : await Habit.findOne({
          userId: uid,
          clientRequestId,
          deletedAt: { $exists: false },
        }).lean();

  if (existingByRequest) {
    await attachLinkToSlot(plan._id, slotKey, kind, existingByRequest._id, logOid);
    if (logOid) {
      await syncProductFromBaCompletion({
        userId: uid,
        taskId: kind === 'task' ? existingByRequest._id : null,
        habitId: kind === 'habit' ? existingByRequest._id : null,
        logId: logOid,
      });
    }
    return {
      productKind: kind,
      ...(kind === 'task' ? { task: existingByRequest } : { habit: existingByRequest }),
      plan: await BehavioralActivationWeekPlan.findById(plan._id).lean(),
      idempotentReplay: true,
    };
  }

  let created;
  try {
  if (kind === 'task') {
    const draft = buildTaskDraftFromBaSlot({ slot, weekStart });
    created = await Task.create({
      ...draft,
      userId: uid,
      status: 'pending',
      clientRequestId,
      baOrigin,
    });
    await attachLinkToSlot(plan._id, slotKey, 'task', created._id, logOid);
    if (logOid) {
      await syncProductFromBaCompletion({
        userId: uid,
        taskId: created._id,
        logId: logOid,
      });
    }
    return {
      productKind: 'task',
      task: (await Task.findById(created._id).lean()),
      plan: await BehavioralActivationWeekPlan.findById(plan._id).lean(),
    };
  }

  const draft = buildHabitDraftFromBaSlot({ slot, weekStart });
  created = await Habit.create({
    ...draft,
    userId: uid,
    status: {
      archived: false,
      isOverdue: false,
      completedToday: false,
    },
    progress: {
      streak: 0,
      completedDays: 0,
      totalDays: 0,
      bestStreak: 0,
      weeklyProgress: [],
      monthlyProgress: [],
    },
    reminder: {
      ...draft.reminder,
      lastNotified: null,
    },
    clientRequestId,
    baOrigin,
  });
  await attachLinkToSlot(plan._id, slotKey, 'habit', created._id, logOid);
  if (logOid) {
    await syncProductFromBaCompletion({
      userId: uid,
      habitId: created._id,
      logId: logOid,
    });
  }
  return {
    productKind: 'habit',
    habit: (await Habit.findById(created._id).lean()),
    plan: await BehavioralActivationWeekPlan.findById(plan._id).lean(),
  };
  } catch (err) {
    if (err?.name === 'ValidationError') {
      throw Object.assign(new Error(err.message), { code: 'PRODUCT_VALIDATION', cause: err });
    }
    throw err;
  }
}

async function attachLinkToSlot(planId, slotId, kind, productId, logOid) {
  const setFields =
    kind === 'task'
      ? { 'slots.$.linkedTaskId': productId }
      : { 'slots.$.linkedHabitId': productId };
  if (logOid) {
    setFields['slots.$.completedLogId'] = logOid;
    setFields['slots.$.status'] = 'completed';
  }
  await BehavioralActivationWeekPlan.updateOne(
    { _id: planId, 'slots.slotId': slotId },
    { $set: setFields },
  );
}

export function isValidBaProductSource(source) {
  return BA_PRODUCT_SOURCES.has(String(source || ''));
}

export default {
  suggestProductKindForSlot,
  computeSlotDueDate,
  buildTaskDraftFromBaSlot,
  buildHabitDraftFromBaSlot,
  linkBaSlotToProduct,
  syncProductFromBaCompletion,
  syncBaSlotFromProductCompletion,
  syncBaEcosystemFromLog,
  isValidBaProductSource,
};
