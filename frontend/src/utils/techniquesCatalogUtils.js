import { CATEGORIES } from '../screens/therapeuticTechniques/therapeuticTechniquesConstants';

export const TECHNIQUE_TYPE_ICONS = {
  CBT: 'brain',
  DBT: 'heart-pulse',
  ACT: 'compass',
  immediate: 'lightning-bolt',
};

/** Acordeón del catálogo: todo colapsado al entrar. */
export function createInitialCatalogExpanded() {
  return {
    [CATEGORIES.IMMEDIATE]: false,
    [CATEGORIES.CBT]: false,
    [CATEGORIES.DBT]: false,
    [CATEGORIES.ACT]: false,
  };
}

/**
 * @param {{ type?: string, category?: string } | null | undefined} technique
 */
export function resolveTechniqueCatalogType(technique) {
  const raw = technique?.type ?? technique?.category ?? 'immediate';
  if (typeof raw !== 'string' || raw.trim() === '') return 'immediate';
  const lower = raw.trim().toLowerCase();
  if (lower === 'immediate') return 'immediate';
  const map = { cbt: 'CBT', dbt: 'DBT', act: 'ACT' };
  if (map[lower]) return map[lower];
  if (raw === 'CBT' || raw === 'DBT' || raw === 'ACT') return raw;
  return 'immediate';
}

/**
 * @param {{ steps?: unknown[], description?: string } | null | undefined} technique
 * @param {{ singular: string, plural: string }} stepLabels
 */
export function buildTechniqueCatalogRowSubtitle(technique, stepLabels) {
  const steps = Array.isArray(technique?.steps) ? technique.steps.length : 0;
  if (steps > 0) {
    return `${steps} ${steps === 1 ? stepLabels.singular : stepLabels.plural}`;
  }
  const desc = typeof technique?.description === 'string' ? technique.description.trim() : '';
  if (!desc) return null;
  return desc.length > 52 ? `${desc.slice(0, 52)}…` : desc;
}

/**
 * @param {Record<string, unknown[]>} groupedTechniques
 * @param {string[]} categoryOrder
 */
export function hasTechniqueCatalogCategories(groupedTechniques, categoryOrder) {
  return categoryOrder.some((key) => (groupedTechniques[key]?.length ?? 0) > 0);
}

/**
 * @param {number} count
 * @param {string} [template]
 */
export function formatTechniqueCategoryCountA11y(count, template = '{count}') {
  return String(template).replace('{count}', String(count));
}
