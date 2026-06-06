import {
  getInterventionCatalogEntry,
  getInterventionCatalogLabel,
  listCatalogInterventionIds,
} from '../../../constants/interventionCatalog.js';
import { INTERVENTION_LABELS_EN } from '../../../constants/interventionCatalogLabels.en.js';

describe('interventionCatalogLabels EN', () => {
  it('mapa EN tiene todas las claves del catálogo', () => {
    const ids = listCatalogInterventionIds();
    const missing = ids.filter((id) => !INTERVENTION_LABELS_EN[id]?.trim());
    expect(missing).toEqual([]);
    expect(Object.keys(INTERVENTION_LABELS_EN).length).toBe(ids.length);
  });

  it('getInterventionCatalogLabel devuelve inglés distinto del español', () => {
    listCatalogInterventionIds().forEach((id) => {
      const entry = getInterventionCatalogEntry(id);
      const en = getInterventionCatalogLabel(entry, 'en');
      const es = getInterventionCatalogLabel(entry, 'es');
      expect(en).toBeTruthy();
      expect(es).toBeTruthy();
      expect(en).not.toBe(es);
    });
  });
});
