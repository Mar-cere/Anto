import {
  filterPublicGraphCorrelations,
  filterPublicGraphInterventionEdges,
  INTERNAL_GRAPH_INTERVENTION_ID,
  isInternalGraphIntervention,
  resolveGraphInterventionLabel,
} from '../graphInterventionLabel';
import { buildTopicFreeGraphModel } from '../interventionGraphLayout';

describe('graphInterventionLabel', () => {
  it('detecta personal-pattern como intervención interna', () => {
    expect(isInternalGraphIntervention('personal-pattern')).toBe(true);
    expect(isInternalGraphIntervention('breathing_exercise')).toBe(false);
  });

  it('resolveGraphInterventionLabel oculta IDs internos', () => {
    expect(resolveGraphInterventionLabel('personal-pattern', 'personal-pattern')).toBeNull();
    expect(resolveGraphInterventionLabel('Respiración', 'breathing_exercise')).toBe('Respiración');
  });

  it('filterPublicGraphInterventionEdges elimina aristas internas', () => {
    const filtered = filterPublicGraphInterventionEdges([
      { interventionId: INTERNAL_GRAPH_INTERVENTION_ID, topicFree: 'idea' },
      { interventionId: 'grounding', topicFree: 'idea' },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].interventionId).toBe('grounding');
  });

  it('filterPublicGraphCorrelations elimina filas con targetId interno', () => {
    const filtered = filterPublicGraphCorrelations([
      { type: 'concept_intervention', targetId: INTERNAL_GRAPH_INTERVENTION_ID },
      { type: 'topic_intervention', targetId: 'grounding' },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].targetId).toBe('grounding');
  });
});

describe('interventionGraphLayout personal-pattern', () => {
  it('no muestra personal-pattern como nodo de técnica', () => {
    const model = buildTopicFreeGraphModel(
      [
        {
          topicFree: 'Plenitud y satisfacción personal',
          interventionId: 'personal-pattern',
          interventionLabel: 'personal-pattern',
          shown: 1,
          clicked: 0,
          completed: 0,
        },
      ],
      { canvasWidth: 340 },
    );
    expect(model.links).toEqual([]);
    expect(model.interventions).toEqual([]);
  });
});
