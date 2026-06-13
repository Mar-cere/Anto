/**
 * Utilidades vectoriales para similitud semántica (topicFree #218 fase 3).
 */

export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return 0;
  if (left.length === 0 || left.length !== right.length) return 0;

  let dot = 0;
  let normLeft = 0;
  let normRight = 0;
  for (let i = 0; i < left.length; i += 1) {
    const a = Number(left[i]) || 0;
    const b = Number(right[i]) || 0;
    dot += a * b;
    normLeft += a * a;
    normRight += b * b;
  }
  const denom = Math.sqrt(normLeft) * Math.sqrt(normRight);
  if (!Number.isFinite(denom) || denom <= 0) return 0;
  return dot / denom;
}
