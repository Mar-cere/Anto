/**
 * Auditoría catálogo ↔ sugerencias (#127)
 */
import actionSuggestionService from '../../../services/actionSuggestionService.js';
import {
  getInterventionCatalogEntry,
  isValidInterventionId,
  listCatalogInterventionIds,
} from '../../../constants/interventionCatalog.js';

describe('interventionCatalog', () => {
  it('todos los IDs de actionSuggestionService existen en el catálogo', () => {
    const referenced = actionSuggestionService.getAllReferencedInterventionIds();
    expect(referenced.length).toBeGreaterThan(0);
    const missing = referenced.filter((id) => !getInterventionCatalogEntry(id));
    expect(missing).toEqual([]);
  });

  it('formatSuggestions no devuelve interventionType unknown para IDs mapeados', () => {
    const referenced = actionSuggestionService.getAllReferencedInterventionIds();
    const formatted = actionSuggestionService.formatSuggestions(referenced);
    const unknown = formatted.filter((s) => s.interventionType === 'unknown');
    expect(unknown).toEqual([]);
  });

  it('rechaza IDs con caracteres inválidos', () => {
    expect(isValidInterventionId('breathing_exercise')).toBe(true);
    expect(isValidInterventionId('')).toBe(false);
    expect(isValidInterventionId('DROP TABLE')).toBe(false);
    expect(isValidInterventionId('a'.repeat(81))).toBe(false);
  });

  it('catálogo no tiene claves duplicadas ni vacías', () => {
    const keys = listCatalogInterventionIds();
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((k) => expect(isValidInterventionId(k)).toBe(true));
  });
});
