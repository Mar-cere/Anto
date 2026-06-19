import {
  filterPublicGraphCorrelations,
  filterPublicGraphInterventionEdges,
  isInternalGraphIntervention,
} from '../../../utils/internalGraphInterventions.js';

describe('internalGraphInterventions', () => {
  const MEMORY_INTERVENTION_ID = 'personal-pattern';
  it('detecta personal-pattern como intervención interna', () => {
    expect(isInternalGraphIntervention(MEMORY_INTERVENTION_ID)).toBe(true);
    expect(isInternalGraphIntervention('grounding')).toBe(false);
  });

  it('filterPublicGraphInterventionEdges elimina aristas internas', () => {
    const filtered = filterPublicGraphInterventionEdges([
      { interventionId: MEMORY_INTERVENTION_ID, topicFree: 'idea' },
      { interventionId: 'grounding', topicFree: 'idea' },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].interventionId).toBe('grounding');
  });

  it('filterPublicGraphCorrelations elimina filas con targetId interno', () => {
    const filtered = filterPublicGraphCorrelations([
      {
        type: 'concept_intervention',
        targetId: MEMORY_INTERVENTION_ID,
        sourceId: 'c1',
      },
      {
        type: 'topic_intervention',
        targetId: 'breathing_exercise',
        sourceId: 'ansiedad',
      },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].targetId).toBe('breathing_exercise');
  });
});
