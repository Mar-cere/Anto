/** Estado de micro-pasos interactivos en tarjetas psicoed (#78). */
export function toggleMicroStepCompletion(doneSteps, index, total) {
  const next = new Set(doneSteps);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return {
    doneSteps: next,
    allDone: total > 0 && next.size === total,
  };
}
