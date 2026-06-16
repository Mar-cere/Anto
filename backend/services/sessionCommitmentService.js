/**
 * Compromisos entre sesiones (#202).
 */
import mongoose from 'mongoose';
import SessionCommitment from '../models/SessionCommitment.js';

const MAX_LABEL = 240;
const DEFAULT_FOLLOW_UP_HOURS = 48;
const ACTIVE_STATUSES = ['active'];
const LIST_STATUSES = ['active', 'completed'];

function normalizeLabel(raw) {
  const label = String(raw || '').trim().replace(/\s+/g, ' ');
  if (label.length < 2) return { error: 'labelRequired' };
  if (label.length > MAX_LABEL) return { error: 'labelTooLong' };
  return { label };
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
    completedAt: doc.completedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listSessionCommitments(userId, { status = 'active', limit = 8 } = {}) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));
  const statusFilter = status === 'all' ? LIST_STATUSES : ACTIVE_STATUSES;
  const docs = await SessionCommitment.find({
    userId: uid,
    status: { $in: statusFilter },
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();
  return docs.map(toClientCommitment);
}

export async function createSessionCommitment(userId, payload = {}) {
  const { label: normalized, error } = normalizeLabel(payload.label);
  if (error) return { error };

  const uid = new mongoose.Types.ObjectId(String(userId));
  let conversationId = null;
  if (payload.conversationId && mongoose.Types.ObjectId.isValid(String(payload.conversationId))) {
    conversationId = new mongoose.Types.ObjectId(String(payload.conversationId));
  }

  const followUpHours = Number(payload.followUpHours);
  const hours = Number.isFinite(followUpHours) && followUpHours > 0
    ? Math.min(followUpHours, 168)
    : DEFAULT_FOLLOW_UP_HOURS;
  const followUpAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const source = ['session_insight', 'manual', 'chat_action'].includes(payload.source)
    ? payload.source
    : 'session_insight';

  const doc = await SessionCommitment.create({
    userId: uid,
    conversationId,
    label: normalized,
    source,
    status: 'active',
    followUpAt,
    followUpAnswer: 'pending',
    sourceMeta: payload.sourceMeta && typeof payload.sourceMeta === 'object' ? payload.sourceMeta : null,
  });

  return { commitment: toClientCommitment(doc.toObject()) };
}

export async function updateSessionCommitment(userId, commitmentId, patch = {}) {
  if (!mongoose.Types.ObjectId.isValid(String(commitmentId))) {
    return { error: 'notFound' };
  }
  const uid = new mongoose.Types.ObjectId(String(userId));
  const update = {};

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
  }

  if (Object.keys(update).length === 0) {
    return { error: 'invalidStatus' };
  }

  const doc = await SessionCommitment.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(String(commitmentId)), userId: uid },
    { $set: update },
    { new: true },
  ).lean();

  if (!doc) return { error: 'notFound' };
  return { commitment: toClientCommitment(doc) };
}

export async function loadCommitmentLabelsForFocus(userId, limit = 5) {
  const items = await listSessionCommitments(userId, { status: 'active', limit });
  return items.map((c) => c.label).filter(Boolean);
}
