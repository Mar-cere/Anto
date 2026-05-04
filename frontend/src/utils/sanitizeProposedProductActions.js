const MAX_ACTIONS = 2;

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
    .slice(0, MAX_ACTIONS);
}
