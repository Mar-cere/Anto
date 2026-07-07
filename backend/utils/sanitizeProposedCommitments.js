const MAX_ITEMS = 1;
const MAX_LABEL = 240;

/**
 * @param {unknown} raw
 * @returns {Array<{ id: string, label: string, rationaleShort?: string, sourceMeta?: object, suggestTask?: boolean, suggestHabit?: boolean }>}
 */
export function sanitizeProposedCommitments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        typeof item.label === 'string' &&
        item.label.trim().length >= 2,
    )
    .map((item) => ({
      id: item.id,
      label: String(item.label).trim().replace(/\s+/g, ' ').slice(0, MAX_LABEL),
      rationaleShort:
        typeof item.rationaleShort === 'string' ? item.rationaleShort.trim().slice(0, 200) : undefined,
      sourceMeta:
        item.sourceMeta && typeof item.sourceMeta === 'object' && !Array.isArray(item.sourceMeta)
          ? item.sourceMeta
          : undefined,
      suggestTask: item.suggestTask === true,
      suggestHabit: item.suggestHabit === true,
    }))
    .slice(0, MAX_ITEMS);
}
