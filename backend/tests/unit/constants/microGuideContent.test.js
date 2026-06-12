import {
  MICRO_GUIDE_IDS,
  getMicroGuideBrowseItems,
  getMicroGuideCardFields,
  getMicroGuideModule,
  normalizeMicroGuideId,
} from '../../../constants/microGuideContent.js';
import { INTERVENTION_CATALOG } from '../../../constants/interventionCatalog.js';

describe('microGuideContent', () => {
  it('todos los micro_guide del catálogo tienen módulo en español', () => {
    const catalogIds = Object.values(INTERVENTION_CATALOG)
      .filter((e) => e?.type === 'micro_guide')
      .map((e) => e.id);
    expect(catalogIds.sort()).toEqual([...MICRO_GUIDE_IDS].sort());
    catalogIds.forEach((id) => {
      const mod = getMicroGuideModule(id, 'es');
      expect(mod).not.toBeNull();
      expect(mod.steps?.length).toBeGreaterThanOrEqual(2);
      expect(mod.title).toBeTruthy();
    });
  });

  it('normalizeMicroGuideId rechaza IDs inválidos', () => {
    expect(normalizeMicroGuideId('')).toBeNull();
    expect(normalizeMicroGuideId('no_existe')).toBeNull();
    expect(normalizeMicroGuideId('dbt_stop_skill')).toBe('dbt_stop_skill');
  });

  it('getMicroGuideBrowseItems devuelve lista navegable', () => {
    const items = getMicroGuideBrowseItems('es');
    expect(items.length).toBe(MICRO_GUIDE_IDS.length);
    expect(items[0]).toMatchObject({
      guideId: expect.any(String),
      title: expect.any(String),
      stepCount: expect.any(Number),
      clinicalReview: expect.objectContaining({ version: expect.any(String) }),
    });
  });

  it('getMicroGuideCardFields incluye sello clínico (#111)', () => {
    const card = getMicroGuideCardFields('dbt_stop_skill', 'es');
    expect(card?.clinicalReview).toMatchObject({
      status: expect.any(String),
      version: expect.any(String),
    });
  });

  it('getMicroGuideCardFields incluye cardVariant micro_guide_native', () => {
    const card = getMicroGuideCardFields('dbt_stop_skill', 'es');
    expect(card).toMatchObject({
      cardVariant: 'micro_guide_native',
      previewTitle: expect.any(String),
      microSteps: expect.any(Array),
    });
    expect(card.microSteps.length).toBeGreaterThan(0);
  });

  it('módulos en inglés para guía conocida', () => {
    const mod = getMicroGuideModule('dbt_stop_skill', 'en');
    expect(mod?.title).toMatch(/STOP/i);
    expect(mod?.disclaimer).toMatch(/professional/i);
  });

  it('paridad ES/EN: cada guía tiene título y pasos en ambos idiomas', () => {
    MICRO_GUIDE_IDS.forEach((id) => {
      const es = getMicroGuideModule(id, 'es');
      const en = getMicroGuideModule(id, 'en');
      expect(es?.title).toBeTruthy();
      expect(en?.title).toBeTruthy();
      expect(es?.steps?.length).toBeGreaterThanOrEqual(2);
      expect(en?.steps?.length).toBe(es?.steps?.length);
    });
  });
});
