import {
  accumulateStreamToolCallDeltas,
  buildProductActionResolveMetricData,
  buildProposedActionsFromToolArgs,
  extractProposeProductActionArgs,
  getProposeProductActionToolDefinition,
  isProductActionToolEligible,
  PROPOSE_PRODUCT_ACTION_TOOL_NAME,
  resolveTurnProposedProductActions,
  shouldFallbackToHeuristicProductActions,
} from '../../../../services/chat/productActionTool.js';

describe('productActionTool', () => {
  it('exporta definición de tool', () => {
    const def = getProposeProductActionToolDefinition();
    expect(def.function.name).toBe(PROPOSE_PRODUCT_ACTION_TOOL_NAME);
    expect(def.function.parameters.required).toContain('title');
  });

  it('elegible con pedido explícito', () => {
    expect(
      isProductActionToolEligible({
        userMessage: 'guárdalo en mis tareas',
        sessionIntention: 'vent',
        capAllows: false,
      }),
    ).toBe(true);
  });

  it('no elegible en guest, soft check-in o crisis', () => {
    expect(
      isProductActionToolEligible({
        isGuest: true,
        userMessage: 'crear tarea ordenar cocina',
        sessionIntention: 'plan',
      }),
    ).toBe(false);
    expect(
      isProductActionToolEligible({
        softCrisisCheckInActive: true,
        userMessage: 'crear tarea ordenar cocina',
        sessionIntention: 'plan',
      }),
    ).toBe(false);
    expect(
      isProductActionToolEligible({
        riskLevel: 'HIGH',
        userMessage: 'guárdalo en mis tareas',
      }),
    ).toBe(false);
  });

  it('parsea tool_calls y valida draft', () => {
    const args = extractProposeProductActionArgs([
      {
        function: {
          name: PROPOSE_PRODUCT_ACTION_TOOL_NAME,
          arguments: JSON.stringify({
            type: 'propose_task',
            title: 'Ordenar el escritorio 15 min',
          }),
        },
      },
    ]);
    const actions = buildProposedActionsFromToolArgs(args);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_task');
    expect(actions[0].draft.title).toMatch(/escritorio/i);
  });

  it('descarta títulos genéricos', () => {
    const actions = buildProposedActionsFromToolArgs({
      type: 'propose_task',
      title: 'Definir una rutina diaria simple',
    });
    expect(actions).toHaveLength(0);
  });

  it('acumula deltas de stream', () => {
    let acc = [];
    acc = accumulateStreamToolCallDeltas(acc, {
      tool_calls: [{ index: 0, id: 'c1', function: { name: 'propose_' } }],
    });
    acc = accumulateStreamToolCallDeltas(acc, {
      tool_calls: [{ index: 0, function: { name: 'product_action', arguments: '{"type":' } }],
    });
    acc = accumulateStreamToolCallDeltas(acc, {
      tool_calls: [
        {
          index: 0,
          function: { arguments: '"propose_task","title":"Llamar al médico"}' },
        },
      ],
    });
    const args = extractProposeProductActionArgs(acc);
    expect(args?.title).toMatch(/médico/i);
  });

  it('con tool enabled no hace fallback heurístico en necesidad media', () => {
    expect(
      shouldFallbackToHeuristicProductActions({
        productActionToolEnabled: true,
        userContent: 'quiero organizar mi escritorio',
      }),
    ).toBe(false);
  });

  it('con tool enabled sí hace fallback si pedido explícito o necesidad alta', () => {
    expect(
      shouldFallbackToHeuristicProductActions({
        productActionToolEnabled: true,
        userContent: 'guárdalo en mis tareas',
      }),
    ).toBe(true);
    expect(
      shouldFallbackToHeuristicProductActions({
        productActionToolEnabled: true,
        userContent:
          'estoy muy atareado, mañana examen y no sé por dónde empezar a estudiar',
      }),
    ).toBe(true);
  });

  it('sin tool enabled la heurística sigue siendo camino primario', () => {
    expect(
      shouldFallbackToHeuristicProductActions({
        productActionToolEnabled: false,
        userContent: 'quiero organizar un poco mi escritorio',
      }),
    ).toBe(true);
  });

  it('resolveTurn prioriza tool y omite heurística media si tool vacía', () => {
    let heuristicCalls = 0;
    const buildHeuristic = () => {
      heuristicCalls += 1;
      return [{ type: 'propose_task', draft: { title: 'desde heurística' } }];
    };
    const fromTool = resolveTurnProposedProductActions({
      toolActions: [{ type: 'propose_task', draft: { title: 'desde tool' } }],
      productActionToolEnabled: true,
      userContent: 'quiero organizar mi escritorio',
      buildHeuristic,
    });
    expect(fromTool.source).toBe('chat_tool_v1');
    expect(fromTool.actions[0].draft.title).toMatch(/tool/i);
    expect(heuristicCalls).toBe(0);

    const skipped = resolveTurnProposedProductActions({
      toolActions: [],
      productActionToolEnabled: true,
      userContent: 'quiero organizar mi escritorio',
      buildHeuristic,
    });
    expect(skipped.source).toBe('none');
    expect(skipped.actions).toHaveLength(0);
    expect(heuristicCalls).toBe(0);

    const explicit = resolveTurnProposedProductActions({
      toolActions: [],
      productActionToolEnabled: true,
      userContent: 'guárdalo en mis tareas',
      buildHeuristic,
    });
    expect(explicit.source).toBe('heuristic');
    expect(heuristicCalls).toBe(1);
  });

  it('buildProductActionResolveMetricData expone toolCalled y source', () => {
    const data = buildProductActionResolveMetricData({
      toolEnabled: true,
      source: 'chat_tool_v1',
      actions: [{ type: 'propose_task' }],
      transport: 'sse',
    });
    expect(data.toolCalled).toBe(true);
    expect(data.source).toBe('chat_tool_v1');
    expect(data.count).toBe(1);
  });
});
