/**
 * Ventana post-crisis (#225 / compromisos §8): 48 h tras hard-stop o salida de protocolo.
 */
import mongoose from 'mongoose';

const POST_CRISIS_WINDOW_MS = 48 * 60 * 60 * 1000;
/** @deprecated Use POST_CRISIS_WINDOW_MS */
const POST_CRISIS_COOLDOWN_MS = POST_CRISIS_WINDOW_MS;
const CRISIS_COOLDOWN_METRIC_TYPES = ['crisis_hard_stop', 'crisis_protocol_exit'];

let MetricModel = null;

function getMetricModel() {
  if (MetricModel) return MetricModel;
  if (mongoose.models.Metric) {
    MetricModel = mongoose.models.Metric;
    return MetricModel;
  }
  return null;
}

/**
 * @param {unknown} userId
 * @returns {Promise<{ active: boolean, anchorAt: Date|null, endsAt: Date|null }>}
 */
export async function getPostCrisisWindow(userId) {
  if (!userId) {
    return { active: false, anchorAt: null, endsAt: null };
  }
  const rawId = String(userId);
  const ObjectId = mongoose.Types?.ObjectId;
  if (typeof ObjectId?.isValid === 'function' && !ObjectId.isValid(rawId)) {
    return { active: false, anchorAt: null, endsAt: null };
  }
  const Metric = getMetricModel();
  if (!Metric) {
    return { active: false, anchorAt: null, endsAt: null };
  }
  let uid;
  try {
    uid = new ObjectId(rawId);
  } catch {
    return { active: false, anchorAt: null, endsAt: null };
  }
  const since = new Date(Date.now() - POST_CRISIS_WINDOW_MS);
  const hit = await Metric.findOne({
    userId: uid,
    type: { $in: CRISIS_COOLDOWN_METRIC_TYPES },
    timestamp: { $gte: since },
  })
    .sort({ timestamp: -1 })
    .select('timestamp')
    .lean();

  if (!hit?.timestamp) {
    return { active: false, anchorAt: null, endsAt: null };
  }
  const anchorAt = new Date(hit.timestamp);
  const endsAt = new Date(anchorAt.getTime() + POST_CRISIS_WINDOW_MS);
  if (endsAt.getTime() <= Date.now()) {
    return { active: false, anchorAt: null, endsAt: null };
  }
  return { active: true, anchorAt, endsAt };
}

/**
 * @param {unknown} userId
 * @returns {Promise<boolean>}
 */
export async function isUserInPostCrisisWindow(userId) {
  const window = await getPostCrisisWindow(userId);
  return window.active === true;
}

/**
 * Alias histórico (compromisos / experiencial).
 * @param {unknown} userId
 * @returns {Promise<boolean>}
 */
export async function isUserInPostCrisisCommitmentCooldown(userId) {
  return isUserInPostCrisisWindow(userId);
}

export {
  POST_CRISIS_WINDOW_MS,
  POST_CRISIS_COOLDOWN_MS,
  CRISIS_COOLDOWN_METRIC_TYPES,
};

export default {
  getPostCrisisWindow,
  isUserInPostCrisisWindow,
  isUserInPostCrisisCommitmentCooldown,
};
