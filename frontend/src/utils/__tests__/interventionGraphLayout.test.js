import {
  buildConceptGraphModel,
  buildInterventionGraphModel,
  buildInterventionGraphViewModel,
  buildTopicFreeGraphModel,
  computeEdgeWeight,
  formatTopicTagLabel,
  localizeGraphModel,
  measureLabelLines,
  normalizeStrokeWidth,
  nodeParticipatesInGraphLink,
  pickPrimaryGraphLink,
  pickStrongestLinkForSourceNode,
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

  it('measureLabelLines envuelve texto largo en varias líneas', () => {
    const { lines, height } = measureLabelLines(
      'No sé, solo me siento muy abrumado con todo lo que tengo encima',
      22,
      3,
    );
    expect(lines.length).toBeGreaterThan(1);
    expect(height).toBeGreaterThan(40);
  });

  it('buildInterventionGraphModel produce nodos con líneas legibles', () => {
    const longTopicFree = [
      {
        topicFree: 'No sé, solo me siento muy abrumado con todo lo que tengo encima',
        interventionId: 'psychoeducation_depression',
        interventionLabel: 'Entender la Depresión (psicoeducación)',
        shown: 1,
        clicked: 1,
        completed: 1,
      },
    ];
    const model = buildTopicFreeGraphModel(longTopicFree, { canvasWidth: 340 });
    expect(model.topicFreeNodes[0].lines.length).toBeGreaterThan(0);
    expect(model.topicFreeNodes[0].label).toMatch(/siento muy|abrumado/i);
    expect(model.topicFreeNodes[0].label).not.toMatch(/^no sé/i);
    expect(model.topicFreeNodes[0].width).toBeGreaterThan(0);
    expect(model.links[0].x1).toBeLessThan(model.links[0].x2);
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

  it('buildConceptGraphModel agrupa conceptos con intervenciones', () => {
    const conceptNodes = [{ id: 'c1', label: 'Ansiedad laboral', memberCount: 2 }];
    const conceptEdges = [
      {
        conceptId: 'c1',
        interventionId: 'breathing_exercise',
        interventionLabel: 'Respiración',
        shown: 2,
        clicked: 2,
        completed: 1,
        weight: 2.5,
      },
    ];
    const model = buildConceptGraphModel(conceptNodes, conceptEdges, { canvasWidth: 320 });
    expect(model.mode).toBe('concept');
    expect(model.conceptNodes.length).toBe(1);
    expect(model.links[0].linkKind).toBe('concept');
  });

  it('buildInterventionGraphViewModel prefiere conceptos sobre topicFree', () => {
    const model = buildInterventionGraphViewModel(
      sampleEdges,
      [
        {
          topicFree: 'snippet suelto',
          interventionId: 'grounding',
          interventionLabel: 'Grounding',
          shown: 1,
          clicked: 1,
          completed: 0,
        },
      ],
      {
        canvasWidth: 320,
        conceptNodes: [{ id: 'c1', label: 'Idea agrupada', memberCount: 3 }],
        conceptEdges: [
          {
            conceptId: 'c1',
            interventionId: 'grounding',
            interventionLabel: 'Grounding',
            shown: 3,
            clicked: 2,
            completed: 1,
            weight: 3,
          },
        ],
      },
    );
    expect(model.mode).toBe('concept');
  });

  it('pickPrimaryGraphLink elige la arista de mayor peso', () => {
    const links = [
      { key: 'a', weight: 1.2, sourceId: 's1', targetId: 't1' },
      { key: 'b', weight: 4.5, sourceId: 's2', targetId: 't2' },
    ];
    expect(pickPrimaryGraphLink(links)?.key).toBe('b');
  });

  it('pickStrongestLinkForSourceNode prioriza peso sobre orden', () => {
    const links = [
      { key: 'a', weight: 1, sourceId: 'idea-a', targetId: 't1' },
      { key: 'b', weight: 5, sourceId: 'idea-a', targetId: 't2' },
    ];
    expect(pickStrongestLinkForSourceNode(links, 'idea-a')?.key).toBe('b');
  });

  it('nodeParticipatesInGraphLink reconoce extremos de la arista', () => {
    const link = { sourceId: 'idea', targetId: 'ba', topicFree: 'idea' };
    expect(nodeParticipatesInGraphLink('idea', link)).toBe(true);
    expect(nodeParticipatesInGraphLink('ba', link)).toBe(true);
    expect(nodeParticipatesInGraphLink('other', link)).toBe(false);
  });
});
