import {
  buildConceptInterventionEdges,
  buildTopicFreeConceptGraph,
  clusterTopicFreeItems,
} from '../../../services/topicFreeConceptClusterService.js';

describe('topicFreeConceptClusterService', () => {
  it('clusterTopicFreeItems agrupa vectores similares', () => {
    const { conceptNodes, assignments } = clusterTopicFreeItems([
      { topicFree: 'Me siento muy ansioso hoy', embedding: [1, 0, 0], topicTag: 'ansiedad' },
      { topicFree: 'Estoy ansioso por la reunión', embedding: [0.99, 0.01, 0], topicTag: 'ansiedad' },
      { topicFree: 'No tengo ganas de nada', embedding: [0, 1, 0], topicTag: 'tristeza' },
    ]);

    expect(conceptNodes.length).toBe(2);
    expect(assignments.size).toBe(3);
  });

  it('buildConceptInterventionEdges agrega por concepto', () => {
    const assignments = new Map([
      ['snippet a', 'concept_1'],
      ['snippet b', 'concept_1'],
    ]);
    const edges = buildConceptInterventionEdges(
      [
        {
          topicFree: 'snippet a',
          interventionId: 'breathing_exercise',
          shown: 2,
          clicked: 1,
          completed: 1,
        },
        {
          topicFree: 'snippet b',
          interventionId: 'breathing_exercise',
          shown: 1,
          clicked: 1,
          completed: 0,
        },
      ],
      assignments,
    );

    expect(edges).toHaveLength(1);
    expect(edges[0].shown).toBe(3);
    expect(edges[0].conceptId).toBe('concept_1');
  });

  it('buildTopicFreeConceptGraph produce nodos y aristas', () => {
    const embeddingIndex = new Map([
      [
        'ansiedad laboral',
        { topicFree: 'ansiedad laboral', embedding: [1, 0], topicTag: 'trabajo' },
      ],
      [
        'estrés en el trabajo',
        { topicFree: 'estrés en el trabajo', embedding: [0.98, 0.02], topicTag: 'trabajo' },
      ],
    ]);

    const { conceptNodes, conceptEdges } = buildTopicFreeConceptGraph(
      [
        {
          topicFree: 'ansiedad laboral',
          interventionId: 'psychoeducation_stress',
          shown: 2,
          clicked: 1,
          completed: 1,
        },
        {
          topicFree: 'estrés en el trabajo',
          interventionId: 'breathing_exercise',
          shown: 1,
          clicked: 1,
          completed: 0,
        },
      ],
      embeddingIndex,
    );

    expect(conceptNodes.length).toBeGreaterThan(0);
    expect(conceptEdges.length).toBeGreaterThan(0);
  });
});
