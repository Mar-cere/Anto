/**
 * Motor correlación multimodal MVP (#217): topicTag × intervención × ánimo BA.
 * Sin telemetría de tecleo ni HealthKit en esta fase.
 */
import mongoose from 'mongoose';
import BehavioralActivationLog from '../models/BehavioralActivationLog.js';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';

const MIN_EDGE_SAMPLES = 2;
const MIN_COMPLETION_SIGNAL = 0.25;
const MIN_BA_SESSIONS = 3;

function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return value;
}

function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function strengthFromEdge(edge) {
  const shown = Number(edge?.shown) || 0;
  const clicked = Number(edge?.clicked) || 0;
  const completed = Number(edge?.completed) || 0;
  const completionRate = clicked > 0 ? completed / clicked : Number(edge?.completionRate) || 0;
  const ctr = shown > 0 ? clicked / shown : Number(edge?.ctr) || 0;
  const sampleBoost = Math.min(shown + clicked, 8) / 8;
  return (completionRate * 0.55 + ctr * 0.25 + Math.min(completed, 5) * 0.04) * sampleBoost;
}

/**
 * Correlaciones tema canónico → intervención (histórico de sesión).
 */
export function computeTopicInterventionCorrelations(edges, { minSamples = MIN_EDGE_SAMPLES } = {}) {
  const list = Array.isArray(edges) ? edges : [];
  const rows = list
    .map((edge) => {
      const topicTag = String(edge?.topicTag || edge?._id?.topicTag || 'general').trim().toLowerCase();
      const interventionId = String(edge?.interventionId || edge?._id?.interventionId || '').trim();
      const shown = Number(edge?.shown) || 0;
      const clicked = Number(edge?.clicked) || 0;
      const completed = Number(edge?.completed) || 0;
      if (!interventionId || shown < minSamples) return null;
      const strength = strengthFromEdge(edge);
      if (strength < MIN_COMPLETION_SIGNAL && completed === 0) return null;
      return {
        type: 'topic_intervention',
        sourceKind: 'topicTag',
        sourceId: topicTag,
        targetKind: 'intervention',
        targetId: interventionId,
        interventionLabel: edge?.interventionLabel || interventionId,
        strength: Math.min(1, strength),
        metrics: { shown, clicked, completed },
        disclaimer: 'pattern_observed',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.strength - a.strength);

  return rows.slice(0, 8);
}

/**
 * Correlaciones concepto semántico → intervención.
 */
export function computeConceptInterventionCorrelations(conceptEdges, conceptNodes, { minSamples = 1 } = {}) {
  const nodeById = new Map((conceptNodes || []).map((n) => [n.id, n]));
  return (conceptEdges || [])
    .map((edge) => {
      const concept = nodeById.get(edge.conceptId);
      const shown = Number(edge?.shown) || 0;
      const clicked = Number(edge?.clicked) || 0;
      if (!concept || shown < minSamples) return null;
      const strength = strengthFromEdge(edge);
      if (strength < MIN_COMPLETION_SIGNAL && (edge?.completed || 0) === 0) return null;
      return {
        type: 'concept_intervention',
        sourceKind: 'concept',
        sourceId: edge.conceptId,
        sourceLabel: concept.label,
        targetKind: 'intervention',
        targetId: edge.interventionId,
        interventionLabel: edge.interventionLabel || edge.interventionId,
        strength: Math.min(1, strength),
        metrics: {
          shown: edge.shown,
          clicked: edge.clicked,
          completed: edge.completed,
          memberCount: concept.memberCount,
        },
        disclaimer: 'pattern_observed',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6);
}

async function fetchBaMoodByDay(userId, since) {
  const logs = await BehavioralActivationLog.find({
    userId: toObjectId(userId),
    entryDate: { $gte: since },
  })
    .select('moodBefore moodAfter entryDate')
    .lean();

  const byDay = new Map();
  for (const log of logs) {
    const key = dayKey(log.entryDate);
    if (!key) continue;
    const delta = (Number(log.moodAfter) || 0) - (Number(log.moodBefore) || 0);
    if (!byDay.has(key)) byDay.set(key, { total: 0, count: 0 });
    const row = byDay.get(key);
    row.total += delta;
    row.count += 1;
  }
  return byDay;
}

async function fetchActiveTopicTagsByDay(userId, since) {
  const events = await ChatInterventionEvent.find({
    userId: toObjectId(userId),
    createdAt: { $gte: since },
    eventType: { $in: ['clicked', 'completed'] },
    topicTag: { $exists: true, $nin: [null, '', 'continuity', 'general'] },
  })
    .select('topicTag createdAt')
    .lean();

  const byDay = new Map();
  for (const ev of events) {
    const key = dayKey(ev.createdAt);
    const tag = String(ev.topicTag || '').trim().toLowerCase();
    if (!key || !tag) continue;
    if (!byDay.has(key)) byDay.set(key, new Set());
    byDay.get(key).add(tag);
  }
  return byDay;
}

/**
 * Correlación observacional: días con tema X activo vs delta de ánimo BA.
 */
export async function computeTopicTagMoodCorrelations(userId, since) {
  if (!userId || !(since instanceof Date)) return [];

  const [moodByDay, topicsByDay] = await Promise.all([
    fetchBaMoodByDay(userId, since),
    fetchActiveTopicTagsByDay(userId, since),
  ]);

  if (moodByDay.size < MIN_BA_SESSIONS) return [];

  let globalTotal = 0;
  let globalCount = 0;
  moodByDay.forEach((row) => {
    globalTotal += row.total;
    globalCount += row.count;
  });
  const globalAvg = globalCount > 0 ? globalTotal / globalCount : 0;

  const tagStats = new Map();
  topicsByDay.forEach((tags, day) => {
    const moodRow = moodByDay.get(day);
    if (!moodRow || moodRow.count === 0) return;
    const dayAvg = moodRow.total / moodRow.count;
    tags.forEach((tag) => {
      if (!tagStats.has(tag)) tagStats.set(tag, { total: 0, days: 0 });
      const row = tagStats.get(tag);
      row.total += dayAvg;
      row.days += 1;
    });
  });

  return [...tagStats.entries()]
    .filter(([, stats]) => stats.days >= 2)
    .map(([topicTag, stats]) => {
      const tagAvg = stats.total / stats.days;
      const delta = tagAvg - globalAvg;
      const strength = Math.min(1, Math.abs(delta) / 3);
      if (strength < 0.12) return null;
      return {
        type: 'topic_mood_ba',
        sourceKind: 'topicTag',
        sourceId: topicTag,
        targetKind: 'ba_mood_delta',
        targetId: 'behavioral_activation',
        strength,
        metrics: {
          avgMoodDeltaOnTopicDays: Number(tagAvg.toFixed(2)),
          avgMoodDeltaOverall: Number(globalAvg.toFixed(2)),
          dayCount: stats.days,
        },
        direction: delta >= 0 ? 'lift' : 'dip',
        disclaimer: 'correlation_not_causation',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4);
}

/**
 * Agrega correlaciones para API grafo (#218 fase 3).
 */
export async function buildMultimodalCorrelations({
  userId,
  since,
  topicTagEdges = [],
  conceptEdges = [],
  conceptNodes = [],
}) {
  const topicCorrelations = computeTopicInterventionCorrelations(topicTagEdges);
  const conceptCorrelations = computeConceptInterventionCorrelations(conceptEdges, conceptNodes);
  const moodCorrelations = userId
    ? await computeTopicTagMoodCorrelations(userId, since).catch(() => [])
    : [];

  const correlations = [...conceptCorrelations, ...topicCorrelations, ...moodCorrelations]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 12);

  return {
    correlations,
    summary: {
      topicIntervention: topicCorrelations.length,
      conceptIntervention: conceptCorrelations.length,
      topicMoodBa: moodCorrelations.length,
    },
  };
}

export default {
  computeTopicInterventionCorrelations,
  computeConceptInterventionCorrelations,
  computeTopicTagMoodCorrelations,
  buildMultimodalCorrelations,
};
