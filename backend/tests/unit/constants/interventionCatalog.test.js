/**
 * Auditoría catálogo ↔ sugerencias (#127)
 */
import actionSuggestionService from '../../../services/actionSuggestionService.js';
import {
  getInterventionCatalogEntry,
  isValidInterventionId,
  listCatalogInterventionIds,
} from '../../../constants/interventionCatalog.js';
import { normalizePsychoeducationTopic } from '../../../constants/psychoeducationTopicNormalize.js';

describe('interventionCatalog', () => {
  it('todos los IDs de actionSuggestionService existen en el catálogo', () => {
    const referenced = actionSuggestionService.getAllReferencedInterventionIds();
    expect(referenced.length).toBeGreaterThan(0);
    const missing = referenced.filter((id) => !getInterventionCatalogEntry(id));
    expect(missing).toEqual([]);
  });

  it('formatSuggestions no devuelve interventionType unknown para IDs mapeados', () => {
    const referenced = actionSuggestionService.getAllReferencedInterventionIds();
    const formatted = actionSuggestionService.formatSuggestions(referenced, 'es');
    const unknown = formatted.filter((s) => s.interventionType === 'unknown');
    expect(unknown).toEqual([]);
  });

  it('cada entrada psychoeducation_* tiene topic válido en params', () => {
    const psycho = listCatalogInterventionIds().filter((id) => id.startsWith('psychoeducation_'));
    expect(psycho.length).toBe(7);
    psycho.forEach((id) => {
      const entry = getInterventionCatalogEntry(id);
      expect(normalizePsychoeducationTopic(entry.params?.topic)).toBeTruthy();
    });
  });

  it('enriquece tarjetas de psicoeducación para chat (#78)', () => {
    const [card] = actionSuggestionService.formatSuggestions(['psychoeducation_anxiety'], 'es');
    expect(card.interventionType).toBe('psychoeducation');
    expect(card.cardVariant).toBe('psychoeducation_native');
    expect(card.previewSummary).toMatch(/ansiedad|apoyo/i);
    expect(card.mechanismLine).toBeTruthy();
    expect(card.estimatedMinutes).toBe(2);
  });

  it('etiquetas de psicoeducación en inglés en formatSuggestions', () => {
    const [card] = actionSuggestionService.formatSuggestions(
      ['psychoeducation_anger'],
      'en',
    );
    expect(card.label).toMatch(/Anger/i);
    expect(card.previewTitle).toMatch(/Anger/i);
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
