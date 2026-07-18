/**
 * Patrones experienciales (#203 / #211): CRUD, dedupe, due follow-up, consent.
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import ExperientialPattern, {
  EXPERIENTIAL_FOLLOW_UP_STATUSES,
  EXPERIENTIAL_PATTERN_CATEGORIES,
} from '../models/ExperientialPattern.js';
import User from '../models/User.js';
import { features } from '../config/features.js';
import {
  failsClinicalGuardrails,
  sanitizeObservationalText,
} from '../utils/clinicalContentGuardrails.js';
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../constants/crisis.js';

const MAX_STATEMENT = 160;
const MAX_ACTIVE = 20;
const DEDUPE_LOOKBACK_DAYS = 90;
const DEFAULT_FOLLOW_UP_DAYS = () =>
  Math.max(1, Math.min(90, Number(process.env.EXPERIENTIAL_FOLLOWUP_DAYS) || 14));
const MAX_FOLLOW_UP_ATTEMPTS = 2;
const UNCHANGED_RETRY_DAYS = 21;
const CHANGED_RESCHEDULE_DAYS = 60;

export function isExperientialPatternsEnabled() {
  return features.experientialPatterns === true;
}

export function isExperientialFollowUpEnabled() {
  return features.experientialFollowUp === true;
}

export function isExperientialExtractEnabled() {
  return features.experientialExtract === true;
}

export function normalizeStatementKey(statement) {
  return String(statement || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function normalizeStatement(raw) {
  const text = String(raw || '').trim().replace(/\s+/g, ' ');
  if (text.length < 5) return { error: 'statementRequired' };
  if (text.length > MAX_STATEMENT) return { error: 'statementTooLong' };
  if (hasExplicitSuicidalOrSelfHarmLexicon(text) || failsClinicalGuardrails(text)) {
    return { error: 'statementClinical' };
  }
  const safe = sanitizeObservationalText(text, MAX_STATEMENT);
  if (!safe || safe.length < 5) return { error: 'statementClinical' };
  return { statement: safe, normalizedKey: normalizeStatementKey(safe) };
}

function toClientPattern(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    statement: doc.statement,
    category: doc.category,
    observedAt: doc.observedAt,
    followUpAt: doc.followUpAt || null,
    followUpAskedAt: doc.followUpAskedAt || null,
    followUpAttempts: Number(doc.followUpAttempts) || 0,
    lastFollowUpAt: doc.lastFollowUpAt || null,
    followUpStatus: doc.followUpStatus || 'pending',
    confidence: typeof doc.confidence === 'number' ? doc.confidence : 1,
    language: doc.language || 'es',
    source: doc.source || 'manual',
    userConfirmed: doc.userConfirmed === true,
    isActive: doc.isActive !== false,
    conversationId: doc.conversationId ? String(doc.conversationId) : null,
    sourceMessageId: doc.sourceMessageId ? String(doc.sourceMessageId) : null,
    archivedAt: doc.archivedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
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

export async function hasExperientialPatternsConsent(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return false;
  const user = await User.findById(userId).select('signalConsent.experientialPatterns').lean();
  return user?.signalConsent?.experientialPatterns?.enabled === true;
}

export async function setExperientialPatternsConsent(userId, enabled) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { error: 'notFound' };
  }
  const on = enabled === true;
  const update = {
    'signalConsent.experientialPatterns.enabled': on,
    'signalConsent.experientialPatterns.enabledAt': on ? new Date() : null,
  };
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, select: 'signalConsent.experientialPatterns' },
  ).lean();
  if (!user) return { error: 'notFound' };
  return {
    consent: {
      enabled: user.signalConsent?.experientialPatterns?.enabled === true,
      enabledAt: user.signalConsent?.experientialPatterns?.enabledAt || null,
    },
  };
}

export async function getExperientialPatternsConsent(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { enabled: false, enabledAt: null };
  }
  const user = await User.findById(userId).select('signalConsent.experientialPatterns').lean();
  return {
    enabled: user?.signalConsent?.experientialPatterns?.enabled === true,
    enabledAt: user?.signalConsent?.experientialPatterns?.enabledAt || null,
  };
}

async function pruneOldestActive(userId) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const count = await ExperientialPattern.countDocuments({ userId: uid, isActive: true });
  if (count <= MAX_ACTIVE) return;
  const excess = count - MAX_ACTIVE;
  const oldest = await ExperientialPattern.find({ userId: uid, isActive: true })
    .sort({ observedAt: 1 })
    .select('_id')
    .limit(excess)
    .lean();
  const ids = oldest.map((d) => d._id).filter(Boolean);
  if (ids.length) {
    await ExperientialPattern.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isActive: false,
          followUpStatus: 'archived',
          archivedAt: new Date(),
        },
      },
    );
  }
}

export async function findDuplicateActivePattern(userId, normalizedKey) {
  if (!normalizedKey) return null;
  const uid = new mongoose.Types.ObjectId(String(userId));
  const since = new Date(Date.now() - DEDUPE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  return ExperientialPattern.findOne({
    userId: uid,
    isActive: true,
    normalizedKey,
    observedAt: { $gte: since },
  })
    .select('_id')
    .lean();
}

export async function createExperientialPattern(userId, payload = {}) {
  if (!isExperientialPatternsEnabled()) return { error: 'featureDisabled' };
  // Contrato: sin consent no se persiste (manual ni extract).
  if (!(await hasExperientialPatternsConsent(userId))) {
    return { error: 'consentRequired' };
  }
  const { statement, normalizedKey, error } = normalizeStatement(payload.statement);
  if (error) return { error };

  const uid = new mongoose.Types.ObjectId(String(userId));
  const dup = await findDuplicateActivePattern(uid, normalizedKey);
  if (dup) return { error: 'duplicateActive' };

  const activeCount = await ExperientialPattern.countDocuments({ userId: uid, isActive: true });
  if (activeCount >= MAX_ACTIVE) {
    await pruneOldestActive(uid);
  }

  const conversationId = await resolveOwnedConversationId(userId, payload.conversationId);
  const sourceMessageId =
    payload.sourceMessageId && mongoose.Types.ObjectId.isValid(String(payload.sourceMessageId))
      ? new mongoose.Types.ObjectId(String(payload.sourceMessageId))
      : null;

  const days =
    Number.isFinite(Number(payload.followUpDays)) && Number(payload.followUpDays) > 0
      ? Math.min(90, Math.floor(Number(payload.followUpDays)))
      : DEFAULT_FOLLOW_UP_DAYS();
  const observedAt = payload.observedAt ? new Date(payload.observedAt) : new Date();
  const followUpAt = new Date(observedAt.getTime() + days * 24 * 60 * 60 * 1000);

  const category = EXPERIENTIAL_PATTERN_CATEGORIES.includes(payload.category)
    ? payload.category
    : 'other';
  const source = payload.source === 'session_extract' ? 'session_extract' : 'manual';
  const confidence = Math.max(0, Math.min(1, Number(payload.confidence) || 1));
  const language = payload.language === 'en' ? 'en' : 'es';

  const doc = await ExperientialPattern.create({
    userId: uid,
    conversationId,
    sourceMessageId,
    statement,
    normalizedKey,
    category,
    observedAt,
    followUpAt,
    followUpStatus: 'pending',
    followUpAttempts: 0,
    confidence,
    language,
    source,
    userConfirmed: payload.userConfirmed === true,
    isActive: true,
  });

  return { pattern: toClientPattern(doc.toObject()) };
}

export async function listExperientialPatterns(
  userId,
  { activeOnly = true, limit = 20 } = {},
) {
  if (!isExperientialPatternsEnabled()) return [];
  const uid = new mongoose.Types.ObjectId(String(userId));
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const filter = { userId: uid };
  if (activeOnly) filter.isActive = true;
  const docs = await ExperientialPattern.find(filter)
    .sort({ observedAt: -1 })
    .limit(safeLimit)
    .lean();
  return docs.map(toClientPattern);
}

export async function getDueExperientialPattern(userId, { now = new Date() } = {}) {
  if (!isExperientialPatternsEnabled() || !isExperientialFollowUpEnabled()) return null;
  if (!(await hasExperientialPatternsConsent(userId))) return null;

  const uid = new mongoose.Types.ObjectId(String(userId));
  const doc = await ExperientialPattern.findOne({
    userId: uid,
    isActive: true,
    followUpStatus: 'pending',
    followUpAskedAt: null,
    followUpAt: { $ne: null, $lte: now },
    followUpAttempts: { $lt: MAX_FOLLOW_UP_ATTEMPTS },
  })
    .sort({ followUpAt: 1 })
    .lean();
  return doc ? toClientPattern(doc) : null;
}

export async function updateExperientialPattern(userId, patternId, patch = {}) {
  if (!isExperientialPatternsEnabled()) return { error: 'featureDisabled' };
  if (!mongoose.Types.ObjectId.isValid(String(patternId))) return { error: 'notFound' };

  const uid = new mongoose.Types.ObjectId(String(userId));
  const doc = await ExperientialPattern.findOne({
    _id: new mongoose.Types.ObjectId(String(patternId)),
    userId: uid,
  });
  if (!doc) return { error: 'notFound' };

  if (patch.archive === true || patch.isActive === false) {
    doc.isActive = false;
    doc.followUpStatus = 'archived';
    doc.archivedAt = new Date();
  }

  if (patch.statement != null) {
    const { statement, normalizedKey, error } = normalizeStatement(patch.statement);
    if (error) return { error };
    if (normalizedKey !== doc.normalizedKey) {
      const dup = await findDuplicateActivePattern(uid, normalizedKey);
      if (dup && String(dup._id) !== String(doc._id)) return { error: 'duplicateActive' };
    }
    doc.statement = statement;
    doc.normalizedKey = normalizedKey;
  }

  if (patch.category != null) {
    if (!EXPERIENTIAL_PATTERN_CATEGORIES.includes(patch.category)) {
      return { error: 'invalidCategory' };
    }
    doc.category = patch.category;
  }

  if (patch.followUpStatus != null) {
    if (!EXPERIENTIAL_FOLLOW_UP_STATUSES.includes(patch.followUpStatus)) {
      return { error: 'invalidFollowUpStatus' };
    }
    await applyFollowUpStatusTransition(doc, patch.followUpStatus);
  }

  if (patch.userConfirmed === true) doc.userConfirmed = true;

  await doc.save();
  return { pattern: toClientPattern(doc.toObject()) };
}

async function applyFollowUpStatusTransition(doc, status) {
  if (status === 'archived') {
    doc.followUpStatus = 'archived';
    doc.isActive = false;
    doc.archivedAt = new Date();
    return;
  }
  if (status === 'skipped') {
    // No volver a preguntar este patrón
    doc.followUpStatus = 'skipped';
    doc.followUpAskedAt = doc.followUpAskedAt || new Date();
    doc.lastFollowUpAt = new Date();
    return;
  }
  if (status === 'changed' || status === 'acknowledged') {
    doc.userConfirmed = true;
    doc.followUpAt = new Date(
      Date.now() + CHANGED_RESCHEDULE_DAYS * 24 * 60 * 60 * 1000,
    );
    doc.followUpAskedAt = null;
    doc.followUpStatus = 'pending';
    doc.isActive = true;
    return;
  }
  if (status === 'unchanged') {
    const attempts = Number(doc.followUpAttempts) || 0;
    if (attempts + 1 >= MAX_FOLLOW_UP_ATTEMPTS) {
      doc.isActive = false;
      doc.followUpStatus = 'archived';
      doc.archivedAt = new Date();
      return;
    }
    doc.followUpAttempts = attempts + 1;
    doc.followUpAt = new Date(Date.now() + UNCHANGED_RETRY_DAYS * 24 * 60 * 60 * 1000);
    doc.followUpAskedAt = null;
    doc.followUpStatus = 'pending';
    doc.lastFollowUpAt = new Date();
  }
}

export async function markExperientialFollowUpAsked(patternId) {
  if (!patternId || !mongoose.Types.ObjectId.isValid(String(patternId))) return;
  await ExperientialPattern.updateOne(
    { _id: new mongoose.Types.ObjectId(String(patternId)) },
    {
      $set: {
        followUpAskedAt: new Date(),
        lastFollowUpAt: new Date(),
      },
    },
  );
}

export async function archiveExperientialPattern(userId, patternId) {
  return updateExperientialPattern(userId, patternId, { archive: true });
}

export function sanitizeExperientialPatch(body = {}) {
  const patch = {};
  if (body.statement != null) patch.statement = body.statement;
  if (body.category != null) patch.category = body.category;
  if (body.followUpStatus != null) patch.followUpStatus = body.followUpStatus;
  if (body.isActive === false || body.archive === true) patch.archive = true;
  if (body.userConfirmed === true) patch.userConfirmed = true;
  return patch;
}

export {
  MAX_ACTIVE,
  MAX_FOLLOW_UP_ATTEMPTS,
  DEFAULT_FOLLOW_UP_DAYS,
  toClientPattern,
};

export default {
  isExperientialPatternsEnabled,
  isExperientialFollowUpEnabled,
  isExperientialExtractEnabled,
  hasExperientialPatternsConsent,
  setExperientialPatternsConsent,
  getExperientialPatternsConsent,
  createExperientialPattern,
  listExperientialPatterns,
  getDueExperientialPattern,
  updateExperientialPattern,
  archiveExperientialPattern,
  markExperientialFollowUpAsked,
  normalizeStatementKey,
  sanitizeExperientialPatch,
};
