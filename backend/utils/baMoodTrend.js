/**
 * Tendencia de ánimo en registros BA (#88): delta medio reciente vs anterior.
 */

export function computeBaMoodTrend(records = []) {
  const list = (Array.isArray(records) ? records : [])
    .filter((r) => Number.isFinite(r?.moodBefore) && Number.isFinite(r?.moodAfter))
    .slice(0, 10);

  if (list.length < 2) {
    return { eligible: false, sampleSize: list.length, avgDelta: null, direction: null };
  }

  const deltas = list.map((r) => Number(r.moodAfter) - Number(r.moodBefore));
  const avgDelta = Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;

  let direction = 'stable';
  if (avgDelta >= 0.5) direction = 'improving';
  else if (avgDelta <= -0.5) direction = 'declining';

  return {
    eligible: true,
    sampleSize: list.length,
    avgDelta,
    direction,
  };
}
