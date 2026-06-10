/** Valores de escala para IntensityScalePicker (1–10, SUDS, etc.). */
export function buildScaleValues({ values, min = 1, max = 10, step = 1 } = {}) {
  if (Array.isArray(values) && values.length > 0) {
    return values.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  }
  const safeMin = Number(min);
  const safeMax = Number(max);
  const safeStep = Number(step) > 0 ? Number(step) : 1;
  if (!Number.isFinite(safeMin) || !Number.isFinite(safeMax) || safeMax < safeMin) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
  const out = [];
  for (let v = safeMin; v <= safeMax; v += safeStep) {
    out.push(v);
    if (out.length > 120) break;
  }
  return out.length ? out : [safeMin];
}
