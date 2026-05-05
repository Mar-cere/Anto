const MAX_ACTIONS = 2;

function rewriteActionTitle(raw) {
  const t = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  if (/\bestudiar|examen|materia|temario|apunte\b/i.test(t)) return 'Estudiar bloque prioritario hoy';
  if (/\bcocina|encimera\b/i.test(t)) return 'Ordenar encimera de cocina hoy';
  if (/\bescritorio|desorden\b/i.test(t)) return 'Ordenar escritorio por 15 minutos';
  if (/^(poner|hacer|resolver|dejar)\b/i.test(t)) return t;
  return t.length > 90 ? `${t.slice(0, 87)}...` : t;
}

/**
 * Solo acciones con forma mínima del contrato; evita inyectar objetos raros desde red.
 * @param {unknown} ppa
 * @returns {Array<{ type: string, id: string, draft: object, rationaleShort?: string }>}
 */
export function sanitizeProposedProductActions(ppa) {
  if (!Array.isArray(ppa)) return [];
  return ppa
    .filter(
      (a) =>
        a &&
        typeof a === 'object' &&
        (a.type === 'propose_task' || a.type === 'propose_habit') &&
        typeof a.id === 'string' &&
        a.id.length > 0 &&
        a.draft &&
        typeof a.draft === 'object' &&
        !Array.isArray(a.draft)
    )
    .map((a) => ({
      ...a,
      draft: {
        ...a.draft,
        title: rewriteActionTitle(a.draft?.title)
      }
    }))
    .slice(0, MAX_ACTIONS);
}
