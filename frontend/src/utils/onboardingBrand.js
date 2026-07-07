/**
 * Acento y gradientes de marca para el recorrido.
 */
export function resolveOnboardingBrandAccent(colors = {}) {
  return colors.primary || '#1E83D3';
}

export function resolveOnboardingGradient(colors = {}, dark = false) {
  return {
    start: colors.primaryBright || '#44D7FB',
    mid: colors.primary || '#1E83D3',
    indigo: colors.accentSecondary || (dark ? '#8B7FE8' : '#5B4BD4'),
    warm: colors.accentWarm || '#E89BB8',
  };
}

/** Cuatro cuadrantes del conic-gradient de marca (sentido horario desde arriba-izquierda). */
export function getOnboardingConicSegments(gradient) {
  return [
    { color: gradient.start, from: 225, to: 315 },
    { color: gradient.mid, from: 315, to: 45 },
    { color: gradient.indigo, from: 45, to: 135 },
    { color: gradient.warm, from: 135, to: 225 },
  ];
}

function polarPoint(cx, cy, radius, degrees) {
  const rad = (degrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function buildConicWedgePath(cx, cy, radius, fromDeg, toDeg) {
  let endDeg = toDeg;
  if (endDeg <= fromDeg) endDeg += 360;
  const start = polarPoint(cx, cy, radius, fromDeg);
  const end = polarPoint(cx, cy, radius, endDeg % 360);
  const sweep = endDeg - fromDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export function buildConicRingArcPath(cx, cy, radius, fromDeg, toDeg) {
  let endDeg = toDeg;
  if (endDeg <= fromDeg) endDeg += 360;
  const start = polarPoint(cx, cy, radius, fromDeg);
  const end = polarPoint(cx, cy, radius, endDeg % 360);
  const sweep = endDeg - fromDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function buildOnboardingStepHighlights(texts, stepIndex) {
  const key = `STEP_${stepIndex}_HIGHLIGHTS`;
  const value = texts?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((line) => String(line || '').trim());
}
