/**
 * Exclusión de compromisos tras crisis reciente (CONTRATO_COMPROMISOS_V1 §8).
 * Sin crear, follow-up ni notificaciones durante 24 h tras hard-stop o salida de protocolo.
 */
import mongoose from 'mongoose';

const POST_CRISIS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
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
 * @returns {Promise<boolean>}
 */
export async function isUserInPostCrisisCommitmentCooldown(userId) {
  if (!userId) return false;
  const Metric = getMetricModel();
  if (!Metric) return false;
  const uid = new mongoose.Types.ObjectId(String(userId));
  const since = new Date(Date.now() - POST_CRISIS_COOLDOWN_MS);
  const hit = await Metric.findOne({
    userId: uid,
    type: { $in: CRISIS_COOLDOWN_METRIC_TYPES },
    timestamp: { $gte: since },
  })
    .select('_id')
    .lean();
  return Boolean(hit);
}

export { POST_CRISIS_COOLDOWN_MS, CRISIS_COOLDOWN_METRIC_TYPES };

export default { isUserInPostCrisisCommitmentCooldown };
