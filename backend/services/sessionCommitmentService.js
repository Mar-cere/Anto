/**
 * Compromisos entre sesiones (#202).
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import SessionCommitment from '../models/SessionCommitment.js';
import {
  failsClinicalGuardrails,
  sanitizeObservationalText,
} from '../utils/clinicalContentGuardrails.js';

const MAX_LABEL = 240;
const MAX_ACTIVE_COMMITMENTS = 12;
const FOCUS_VISIBLE_LIMIT = 3;
const DEFAULT_FOLLOW_UP_HOURS = 72;
const FOLLOW_UP_CHAT_MIN_MS = 48 * 60 * 60 * 1000;
const MAX_FOLLOW_UP_ATTEMPTS = 2;
const ACTIVE_STATUSES = ['active'];
const LIST_STATUSES = ['active', 'completed'];
const ALLOWED_SOURCES = new Set(['session_insight', 'manual', 'chat_action', 'chat_proposed']);

export function sanitizeCommitmentSourceMeta(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const meta = {};
  const interventionId = String(raw.interventionId || '').trim().slice(0, 64);
  if (interventionId) meta.interventionId = interventionId;
  const taskId = String(raw.taskId || '').trim();
  if (taskId && mongoose.Types.ObjectId.isValid(taskId)) meta.taskId = taskId;
  const habitId = String(raw.habitId || '').trim();
  if (habitId && mongoose.Types.ObjectId.isValid(habitId)) meta.habitId = habitId;
  const proposedMessageId = String(raw.proposedMessageId || '').trim().slice(0, 64);
  if (proposedMessageId) meta.proposedMessageId = proposedMessageId;
  return Object.keys(meta).length > 0 ? meta : null;
}

function normalizeLabel(raw) {
  const label = String(raw || '').trim().replace(/\s+/g, ' ');
  if (label.length < 2) return { error: 'labelRequired' };
  if (label.length > MAX_LABEL) return { error: 'labelTooLong' };
  if (failsClinicalGuardrails(label)) return { error: 'labelClinical' };
  const safe = sanitizeObservationalText(label, MAX_LABEL);
  if (!safe) return { error: 'labelClinical' };
  return { label: safe };
}

function normalizeListStatus(status) {
  const s = String(status || 'active').trim().toLowerCase();
  return s === 'all' ? 'all' : 'active';
}

function toClientCommitment(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    label: doc.label,
    status: doc.status,
    source: doc.source,
    conversationId: doc.conversationId ? String(doc.conversationId) : null,
    followUpAt: doc.followUpAt || null,
    followUpAnswer: doc.followUpAnswer || 'pending',
    followUpAttempts: Number(doc.followUpAttempts) || 0,
    lastFollowUpAt: doc.lastFollowUpAt || null,
    completedAt: doc.completedAt || null,
    renegotiatedFrom: doc.renegotiatedFrom ? String(doc.renegotiatedFrom) : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    sourceMeta: doc.sourceMeta || null,
  };
}

async function resolveOwnedConversationId(userId, conversationId) {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(String(conversationId))) {
    return null;
  }
  const uid = new mongoose.Types.ObjectId(String(userId));
  const convOid = new mongoose.Types.ObjectId(String(conversationId));
  const conv = await Conversation.findOne({ _id: convOid, userId: uid }).select('_id').lean();
  return conv?._id ? convOid : null;
}

function isFollowUpDue(commitment, now = Date.now()) {
  if (!commitment || commitment.status !== 'active' || commitment.followUpAnswer !== 'pending') {
    return false;
  }
  if (Number(commitment.followUpAttempts) >= MAX_FOLLOW_UP_ATTEMPTS) return false;
  const followUpAt = commitment.followUpAt ? new Date(commitment.followUpAt).getTime() : null;
  const createdAt = commitment.createdAt ? new Date(commitment.createdAt).getTime() : null;
  const lastFollowUpAt = commitment.lastFollowUpAt
    ? new Date(commitment.lastFollowUpAt).getTime()
    : null;
  const anchor = lastFollowUpAt || createdAt;
  if (!anchor) return false;
  if (followUpAt && followUpAt > now) return false;
  return now - anchor >= FOLLOW_UP_CHAT_MIN_MS;
}

export async function listSessionCommitments(userId, { status = 'active', limit = 8 } = {}) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));
  const statusKey = normalizeListStatus(status);
  const statusFilter = statusKey === 'all' ? LIST_STATUSES : ACTIVE_STATUSES;
  const docs = await SessionCommitment.find({
    userId: uid,
    status: { $in: statusFilter },
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();
  return docs.map(toClientCommitment);
}

export async function countActiveSessionCommitments(userId) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  return SessionCommitment.countDocuments({ userId: uid, status: 'active' });
}

export async function createSessionCommitment(userId, payload = {}) {
  const { label: normalized, error } = normalizeLabel(payload.label);
  if (error) return { error };

  const uid = new mongoose.Types.ObjectId(String(userId));
  const activeCount = await SessionCommitment.countDocuments({ userId: uid, status: 'active' });
  if (activeCount >= MAX_ACTIVE_COMMITMENTS) {
    return { error: 'tooManyActive' };
  }

  const conversationId = await resolveOwnedConversationId(userId, payload.conversationId);

  const followUpHours = Number(payload.followUpHours);
  const hours = Number.isFinite(followUpHours) && followUpHours > 0
    ? Math.min(followUpHours, 168)
    : DEFAULT_FOLLOW_UP_HOURS;
  const followUpAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const source = ALLOWED_SOURCES.has(payload.source) ? payload.source : 'session_insight';

  const doc = await SessionCommitment.create({
    userId: uid,
    conversationId,
    label: normalized,
    source,
    status: 'active',
    followUpAt,
    followUpAnswer: 'pending',
    followUpAttempts: 0,
    lastFollowUpAt: null,
    sourceMeta: sanitizeCommitmentSourceMeta(payload.sourceMeta),
    renegotiatedFrom: mongoose.Types.ObjectId.isValid(String(payload.renegotiatedFrom || ''))
      ? new mongoose.Types.ObjectId(String(payload.renegotiatedFrom))
      : null,
  });

  return { commitment: toClientCommitment(doc.toObject()) };
}

export async function updateSessionCommitment(userId, commitmentId, patch = {}) {
  if (!mongoose.Types.ObjectId.isValid(String(commitmentId))) {
    return { error: 'notFound' };
  }
  const uid = new mongoose.Types.ObjectId(String(userId));
  const update = {};

  if (patch.label != null) {
    const { label, error } = normalizeLabel(patch.label);
    if (error) return { error };
    update.label = label;
    update.followUpAnswer = 'pending';
  }

  if (patch.status) {
    const allowed = ['active', 'completed', 'skipped', 'archived'];
    if (!allowed.includes(patch.status)) return { error: 'invalidStatus' };
    update.status = patch.status;
    if (patch.status === 'completed') {
      update.completedAt = new Date();
    }
  }

  if (patch.followUpAnswer) {
    const allowed = ['pending', 'yes', 'partial', 'no'];
    if (!allowed.includes(patch.followUpAnswer)) return { error: 'invalidFollowUp' };
    update.followUpAnswer = patch.followUpAnswer;
    if (patch.followUpAnswer === 'yes' || patch.followUpAnswer === 'partial') {
      update.status = 'completed';
      update.completedAt = new Date();
    }
    if (patch.followUpAnswer === 'no') {
      update.status = 'active';
    }
  }

  const incFields = {};
  if (patch.followUpAnswer === 'no') {
    incFields.followUpAttempts = 1;
  }
  if (patch.recordFollowUpShown === true) {
    update.lastFollowUpAt = new Date();
    incFields.followUpAttempts = 1;
  }

  if (Object.keys(update).length === 0 && Object.keys(incFields).length === 0) {
    return { error: 'invalidStatus' };
  }

  const mongoUpdate = {};
  if (Object.keys(update).length > 0) mongoUpdate.$set = update;
  if (Object.keys(incFields).length > 0) mongoUpdate.$inc = incFields;

  const doc = await SessionCommitment.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(String(commitmentId)), userId: uid },
    mongoUpdate,
    { new: true },
  ).lean();

  if (!doc) return { error: 'notFound' };
  return { commitment: toClientCommitment(doc) };
}

export async function loadCommitmentLabelsForFocus(userId, limit = FOCUS_VISIBLE_LIMIT) {
  const items = await listSessionCommitments(userId, { status: 'active', limit });
  return items.map((c) => c.label).filter(Boolean);
}

/**
 * Compromiso más antiguo listo para follow-up suave en chat.
 */
export async function pickPendingCommitmentForChatFollowUp(userId, { conversationId = null } = {}) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const docs = await SessionCommitment.find({
    userId: uid,
    status: 'active',
    followUpAnswer: 'pending',
  })
    .sort({ createdAt: 1 })
    .limit(5)
    .lean();

  const due = docs.filter((doc) => isFollowUpDue(doc));
  if (!due.length) return null;

  if (conversationId && mongoose.Types.ObjectId.isValid(String(conversationId))) {
    const conv = await Conversation.findById(conversationId)
      .select('commitmentFollowUpShownAt')
      .lean();
    const shownAt = conv?.commitmentFollowUpShownAt
      ? new Date(conv.commitmentFollowUpShownAt).getTime()
      : null;
    if (shownAt && Date.now() - shownAt < 24 * 60 * 60 * 1000) {
      return null;
    }
  }

  return toClientCommitment(due[0]);
}

export async function markCommitmentFollowUpShown(userId, commitmentId, conversationId = null) {
  await updateSessionCommitment(userId, commitmentId, { recordFollowUpShown: true });
  if (conversationId && mongoose.Types.ObjectId.isValid(String(conversationId))) {
    await Conversation.updateOne(
      { _id: conversationId, userId: new mongoose.Types.ObjectId(String(userId)) },
      { $set: { commitmentFollowUpShownAt: new Date() } },
    );
  }
}

export { FOCUS_VISIBLE_LIMIT, DEFAULT_FOLLOW_UP_HOURS, MAX_FOLLOW_UP_ATTEMPTS, isFollowUpDue };
