import { enrichInterventionGraphLabels } from '../../../services/graphSourceLabelService.js';

describe('graphSourceLabelService', () => {
  it('enrichInterventionGraphLabels añade displayLabel determinístico', async () => {
    const result = await enrichInterventionGraphLabels({
      topicFreeEdges: [
        {
          topicFree: 'No se solo me siento muy abrumado',
          interventionId: 'psychoeducation_depression',
          shown: 1,
        },
      ],
      conceptNodes: [],
      language: 'es',
    });

    expect(result.topicFreeEdges[0].displayLabel).toBe('Me siento muy abrumado');
    expect(result.topicFreeEdges[0].topicFree).toContain('abrumado');
  });
});
