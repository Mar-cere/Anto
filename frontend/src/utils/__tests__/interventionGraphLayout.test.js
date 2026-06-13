import {
  buildInterventionGraphModel,
  buildInterventionGraphViewModel,
  buildTopicFreeGraphModel,
  computeEdgeWeight,
  formatTopicTagLabel,
  localizeGraphModel,
  normalizeStrokeWidth,
} from '../interventionGraphLayout';

describe('interventionGraphLayout', () => {
  const sampleEdges = [
    {
      topicTag: 'trabajo',
      interventionId: 'behavioral_activation',
      interventionLabel: 'Activación conductual',
      shown: 4,
      clicked: 3,
      completed: 2,
      ctr: 0.75,
      completionRate: 0.66,
    },
    {
      topicTag: 'ansiedad',
      interventionId: 'breathing_exercise',
      interventionLabel: 'Respiración',
      shown: 2,
      clicked: 1,
      completed: 1,
      ctr: 0.5,
      completionRate: 1,
    },
    {
      topicTag: 'trabajo',
      interventionId: 'psychoeducation_stress',
      interventionLabel: 'Estrés',
      shown: 1,
      clicked: 0,
      completed: 0,
      ctr: 0,
      completionRate: 0,
    },
  ];

  it('computeEdgeWeight pondera completación', () => {
    const low = computeEdgeWeight({ shown: 1, clicked: 0, completed: 0 });
    const high = computeEdgeWeight({ shown: 1, clicked: 1, completed: 1, ctr: 1, completionRate: 1 });
    expect(high).toBeGreaterThan(low);
  });

  it('normalizeStrokeWidth escala entre min y max', () => {
    expect(normalizeStrokeWidth(0, 10)).toBeLessThan(normalizeStrokeWidth(10, 10));
  });

  it('buildInterventionGraphModel produce nodos y enlaces', () => {
    const model = buildInterventionGraphModel(sampleEdges, { canvasWidth: 320 });
    expect(model.topics.length).toBeGreaterThan(0);
    expect(model.interventions.length).toBeGreaterThan(0);
    expect(model.links.length).toBeGreaterThan(0);
    expect(model.height).toBeGreaterThan(80);
    expect(model.links[0]).toMatchObject({
      x1: expect.any(Number),
      x2: expect.any(Number),
      weight: expect.any(Number),
    });
  });

  it('formatTopicTagLabel localiza temas conocidos', () => {
    expect(formatTopicTagLabel('trabajo', 'es')).toBe('Trabajo');
    expect(formatTopicTagLabel('trabajo', 'en')).toBe('Work');
    expect(formatTopicTagLabel('ansiedad', 'en')).toBe('Anxiety');
    expect(formatTopicTagLabel('continuity', 'en')).toBe('Continuity');
    expect(formatTopicTagLabel('tristeza', 'es')).toBe('Tristeza');
  });

  it('localizeGraphModel actualiza labels de temas', () => {
    const model = buildInterventionGraphModel(sampleEdges);
    const localized = localizeGraphModel(model, 'es');
    expect(localized.topics[0].label).toBe('Trabajo');
  });

  it('buildInterventionGraphModel vacío sin edges válidos', () => {
    const model = buildInterventionGraphModel([]);
    expect(model.topics).toEqual([]);
    expect(model.links).toEqual([]);
    expect(model.height).toBe(120);
  });

  it('buildInterventionGraphModel respeta límites de nodos', () => {
    const many = [];
    for (let i = 0; i < 12; i += 1) {
      many.push({
        topicTag: `tema${i}`,
        interventionId: `int${i}`,
        interventionLabel: `Intervención ${i}`,
        shown: i + 1,
        clicked: 0,
        completed: 0,
      });
    }
    const model = buildInterventionGraphModel(many, { maxTopics: 3, maxInterventions: 4 });
    expect(model.topics.length).toBeLessThanOrEqual(3);
    expect(model.interventions.length).toBeLessThanOrEqual(4);
  });

  it('computeEdgeWeight tolera entrada inválida', () => {
    expect(computeEdgeWeight(null)).toBe(0);
    expect(computeEdgeWeight({ shown: 'x', clicked: null })).toBe(0);
  });

  it('formatTopicTagLabel capitaliza tags desconocidos', () => {
    expect(formatTopicTagLabel('custom_tag', 'es')).toBe('Custom_tag');
  });

  it('buildTopicFreeGraphModel conecta snippets con intervenciones', () => {
    const topicFreeEdges = [
      {
        topicFree: 'No tengo ganas de levantarme por la mañana',
        topicTag: 'trabajo',
        interventionId: 'behavioral_activation',
        interventionLabel: 'Activación conductual',
        shown: 2,
        clicked: 1,
        completed: 1,
      },
    ];
    const model = buildTopicFreeGraphModel(topicFreeEdges, { canvasWidth: 360 });
    expect(model.mode).toBe('topicFree');
    expect(model.topicFreeNodes.length).toBe(1);
    expect(model.interventions.length).toBe(1);
    expect(model.links[0].linkKind).toBe('topicFree');
  });

  it('buildInterventionGraphViewModel prefiere topicFree cuando hay datos', () => {
    const model = buildInterventionGraphViewModel(
      sampleEdges,
      [
        {
          topicFree: 'Me cuesta dormir y doy vueltas a todo',
          interventionId: 'breathing_exercise',
          interventionLabel: 'Respiración',
          shown: 1,
          clicked: 1,
          completed: 0,
        },
      ],
      { canvasWidth: 320 },
    );
    expect(model.mode).toBe('topicFree');
    expect(model.links.length).toBeGreaterThan(0);
  });
});
