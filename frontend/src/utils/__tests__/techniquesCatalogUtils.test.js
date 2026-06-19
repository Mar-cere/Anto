import { CATEGORIES } from '../../screens/therapeuticTechniques/therapeuticTechniquesConstants';
import {
  buildTechniqueCatalogRowSubtitle,
  createInitialCatalogExpanded,
  formatTechniqueCategoryCountA11y,
  hasTechniqueCatalogCategories,
  resolveTechniqueCatalogType,
} from '../techniquesCatalogUtils';

describe('techniquesCatalogUtils', () => {
  it('inicia el catálogo con todas las categorías colapsadas', () => {
    expect(createInitialCatalogExpanded()).toEqual({
      [CATEGORIES.IMMEDIATE]: false,
      [CATEGORIES.CBT]: false,
      [CATEGORIES.DBT]: false,
      [CATEGORIES.ACT]: false,
    });
  });

  it('resuelve tipo de técnica desde type o category', () => {
    expect(resolveTechniqueCatalogType({ type: 'cbt' })).toBe('CBT');
    expect(resolveTechniqueCatalogType({ category: 'immediate' })).toBe('immediate');
    expect(resolveTechniqueCatalogType(null)).toBe('immediate');
  });

  it('prioriza pasos en el subtítulo de fila', () => {
    expect(
      buildTechniqueCatalogRowSubtitle(
        { steps: [{}, {}], description: 'Larga descripción' },
        { singular: 'paso', plural: 'pasos' },
      ),
    ).toBe('2 pasos');
  });

  it('recorta descripción larga cuando no hay pasos', () => {
    const long = 'a'.repeat(60);
    expect(
      buildTechniqueCatalogRowSubtitle(
        { description: long },
        { singular: 'step', plural: 'steps' },
      ),
    ).toBe(`${'a'.repeat(52)}…`);
  });

  it('detecta si hay categorías con técnicas', () => {
    expect(
      hasTechniqueCatalogCategories(
        { [CATEGORIES.CBT]: [{ id: 1 }], [CATEGORIES.ACT]: [] },
        [CATEGORIES.IMMEDIATE, CATEGORIES.CBT, CATEGORIES.ACT],
      ),
    ).toBe(true);
    expect(
      hasTechniqueCatalogCategories(
        { [CATEGORIES.CBT]: [], [CATEGORIES.ACT]: [] },
        [CATEGORIES.CBT, CATEGORIES.ACT],
      ),
    ).toBe(false);
  });

  it('formatea contador de categoría para accesibilidad', () => {
    expect(formatTechniqueCategoryCountA11y(3, '{count} técnicas')).toBe('3 técnicas');
  });
});
