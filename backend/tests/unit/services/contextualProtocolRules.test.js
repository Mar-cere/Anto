/**
 * Tests — reglas catálogo #90–#99
 */
import {
  CONTEXTUAL_PROTOCOL_RULES,
  resolveContextualProtocolIds,
} from '../../../services/actionSuggestionService.js';
import { getInterventionCatalogEntry } from '../../../constants/interventionCatalog.js';

describe('CONTEXTUAL_PROTOCOL_RULES (#90–#99)', () => {
  it('cada id del catálogo extendido existe en interventionCatalog', () => {
    const missing = CONTEXTUAL_PROTOCOL_RULES.filter(
      ({ id }) => !getInterventionCatalogEntry(id),
    );
    expect(missing).toEqual([]);
  });

  it('detecta grief_roadmap en mensaje de duelo', () => {
    const ids = resolveContextualProtocolIds('Sigo en duelo desde que falleció mi madre');
    expect(ids).toContain('grief_roadmap');
  });

  it('detecta problem_solving_psst en indecisión', () => {
    const ids = resolveContextualProtocolIds('No sé qué hacer, tengo dos opciones y no decido');
    expect(ids).toContain('problem_solving_psst');
  });

  it('limita a dos protocolos contextuales por mensaje', () => {
    const ids = resolveContextualProtocolIds(
      'Sigo en duelo, no puedo dormir y quiero meditar para calmarme',
    );
    expect(ids.length).toBeLessThanOrEqual(2);
    expect(ids[0]).toBe('grief_roadmap');
  });
});
