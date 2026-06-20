import {
  buildProposedProductActions,
  shouldOfferProductActions,
  isExplicitProductActionRequest,
  isAffirmativeProductActionConfirmation,
  isLowValueEmotionalCheckout,
  resolveProductActionSourceFromHistory,
  resolveProductActionEnrichmentContext,
  getProductActionNeedLevel,
  alignProductActionsWithPsychoeducation,
  getPsychoeducationProductActionContext,
  mergeTaskDraftFromLlm,
  mergeHabitDraftFromLlm,
  mergeProductActionDraftFromLlm
} from '../../../services/chatProductActionProposalService.js';

describe('chatProductActionProposalService', () => {
  const base = {
    userContent: 'Quiero organizar la semana y dejar algo concreto para mañana',
    sessionIntention: 'plan',
    conversationId: '507f1f77bcf86cd799439011',
    assistantMessageId: '507f191e810c19729de860ea'
  };

  it('shouldOfferProductActions false si crisis', () => {
    expect(shouldOfferProductActions({ riskLevel: 'LOW', isCrisis: true })).toBe(false);
  });

  it('shouldOfferProductActions false si MEDIUM o HIGH', () => {
    expect(shouldOfferProductActions({ riskLevel: 'MEDIUM', isCrisis: false })).toBe(false);
    expect(shouldOfferProductActions({ riskLevel: 'HIGH', isCrisis: false })).toBe(false);
  });

  it('shouldOfferProductActions false si WARNING', () => {
    expect(shouldOfferProductActions({ riskLevel: 'WARNING', isCrisis: false })).toBe(false);
  });

  it('shouldOfferProductActions true si LOW sin crisis', () => {
    expect(shouldOfferProductActions({ riskLevel: 'LOW', isCrisis: false })).toBe(true);
  });

  it('buildProposedProductActions devuelve propose_task con intención plan', () => {
    const actions = buildProposedProductActions({
      ...base,
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_task');
    expect(actions[0].draft.title.length).toBeGreaterThanOrEqual(3);
    expect(actions[0].draft.dueDate).toBeTruthy();
  });

  it('shape de propuesta task cumple contrato v1 (type, id, draft mínimo)', () => {
    const actions = buildProposedProductActions({
      ...base,
      riskLevel: 'LOW',
      isCrisis: false
    });
    const a = actions[0];
    expect(a).toMatchObject({
      type: 'propose_task',
      id: expect.any(String),
      draft: {
        title: expect.any(String),
        description: expect.any(String),
        dueDate: expect.any(String),
        priority: expect.any(String),
        itemType: expect.any(String),
        category: expect.any(String),
        tags: expect.any(Array)
      }
    });
    expect(a.id.length).toBeGreaterThan(10);
  });

  it('buildProposedProductActions devuelve propose_habit si el texto sugiere hábito', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'Me gustaría un hábito diario de meditación de 5 minutos',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_habit');
    expect(actions[0].draft.icon).toBe('meditation');
  });

  it('buildProposedProductActions no propone tarea en check-in positivo sin ancla', () => {
    expect(isLowValueEmotionalCheckout('Hoy bien, me siento bien')).toBe(true);
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'Hoy bien, me siento bien',
      sessionIntention: 'plan',
      riskLevel: 'LOW',
      isCrisis: false,
    });
    expect(actions).toEqual([]);
  });

  it('buildProposedProductActions vacío en vent si no hay señal accionable', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'solo estoy triste hoy y no tengo ganas de hablar de nada concreto',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toEqual([]);
  });

  it('buildProposedProductActions en vent si la conversación sugiere orden o pasos (sin pedido explícito)', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'la cocina me agobia y no sé por dónde empezar',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_task');
  });

  it('buildProposedProductActions en vent con estudiar usa título concreto', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'estoy muy atareado, tengo mucho que estudiar',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_task');
    expect(actions[0].draft.title).toBe('Bloque de estudio prioritario');
  });

  it('buildProposedProductActions no propone tarea abstracta sin ancla accionable', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'me estresa la sobreplanificación, siento mucha autoexigencia',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toEqual([]);
  });

  it('buildProposedProductActions en vent si el usuario pide guardar en mis tareas', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'generala en mis tareas',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_task');
    expect(actions[0].draft.title).toMatch(/Paso acordado/i);
  });

  it('buildProposedProductActions detecta pedido explícito "puedes generar la tarea"', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'puedes generar la tarea',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_task');
  });

  it('batería explícita: tareas y hábitos detectados como pedido explícito', () => {
    const explicitSamples = [
      'puedes generar la tarea',
      'podés generar la tarea',
      'podrias crear la tarea',
      'podrías crear la tarea',
      'me generarías las tareas?',
      'me generarias las tareas?',
      'puedes generar las tareas',
      'podrías generar las tareas',
      'crea la tarea',
      'crear una tarea',
      'genera una tarea',
      'arma la tarea',
      'haz la tarea',
      'generame unas tareas',
      'genérame unas tareas',
      'agregalo a mis tareas',
      'agregarlo a mis tareas',
      'guardame como tarea',
      'en mis tareas',
      'puedes generar el hábito',
      'podés crear un hábito',
      'me generarías los hábitos?',
      'me generarias los habitos?',
      'crea el hábito',
      'genera un hábito',
      'guardar como hábito',
      'agregarlo a mis hábitos',
      'en mis hábitos'
    ];
    explicitSamples.forEach((text) => {
      expect(isExplicitProductActionRequest(text)).toBe(true);
    });
  });

  it('getProductActionNeedLevel clasifica low/medium/high', () => {
    expect(getProductActionNeedLevel('me siento raro, no sé')).toBe('low');
    expect(getProductActionNeedLevel('quiero ordenar la semana')).toBe('medium');
    expect(getProductActionNeedLevel('estoy atareado, mañana examen y no sé por dónde empezar a estudiar')).toBe('high');
  });

  it('isAffirmativeProductActionConfirmation detecta confirmaciones breves', () => {
    expect(isAffirmativeProductActionConfirmation('Sí')).toBe(true);
    expect(isAffirmativeProductActionConfirmation('vale')).toBe(true);
    expect(isAffirmativeProductActionConfirmation('me cuesta concentrarme')).toBe(false);
  });

  it('buildProposedProductActions tras «Sí» reutiliza el mensaje accionable previo', () => {
    const history = [
      { role: 'user', content: 'Sí' },
      {
        role: 'assistant',
        content: '¿Quieres que lo pasemos a una tarea concreta para empezar ahora?',
      },
      { role: 'user', content: 'La cocina me agobia y no sé por dónde empezar mañana' },
    ];
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'Sí',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false,
      conversationHistory: history,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('propose_task');
    expect(actions[0].draft.title).toMatch(/cocina|encimera/i);
  });

  it('resolveProductActionEnrichmentContext usa el turno previo en confirmaciones', () => {
    const history = [
      { role: 'user', content: 'Sí' },
      { role: 'assistant', content: 'Te propongo ordenar el escritorio por 15 minutos.' },
      { role: 'user', content: 'El escritorio está hecho un desastre' },
    ];
    expect(
      resolveProductActionEnrichmentContext({
        userContent: 'Sí',
        assistantContent: 'Perfecto, lo dejamos listo.',
        conversationHistory: history,
      }),
    ).toEqual({
      userContent: 'El escritorio está hecho un desastre',
      assistantContent: 'Te propongo ordenar el escritorio por 15 minutos.',
    });
    expect(
      resolveProductActionSourceFromHistory('ok', history),
    ).not.toBeNull();
  });

  it('no sugiere si el usuario pide no sugerencias de tareas', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'no me sugieras tareas, solo escuchar por favor',
      sessionIntention: 'vent',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toEqual([]);
  });

  it('buildProposedProductActions con intención technique si el texto planifica', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'Necesito una técnica pero también organizar mis tareas pendientes de esta semana',
      sessionIntention: 'technique',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions[0].type).toBe('propose_task');
  });

  it('buildProposedProductActions vacío si mensaje muy corto', () => {
    const actions = buildProposedProductActions({
      ...base,
      userContent: 'corto',
      riskLevel: 'LOW',
      isCrisis: false
    });
    expect(actions).toEqual([]);
  });

  it('buildProposedProductActions vacío si conversationId no es ObjectId válido', () => {
    expect(
      buildProposedProductActions({
        ...base,
        conversationId: 'no-es-un-objectid',
        riskLevel: 'LOW',
        isCrisis: false
      })
    ).toEqual([]);
  });

  it('mergeProductActionDraftFromLlm deja borrador intacto si type es desconocido', () => {
    const action = {
      type: 'propose_other',
      id: 'x',
      draft: { title: 'Solo', dueDate: new Date().toISOString() }
    };
    const next = mergeProductActionDraftFromLlm(action, { title: 'Cambiado' });
    expect(next.type).toBe('propose_other');
    expect(next.draft.title).toBe('Solo');
  });

  it('alignProductActionsWithPsychoeducation conserva tarea de preocupaciones si encaja con sueño', () => {
    const actions = [
      {
        type: 'propose_task',
        id: 't1',
        draft: { title: 'Registrar lo que me preocupa antes de dormir' },
        rationaleShort: 'Hay señales claras para bajar esto a un paso accionable.'
      }
    ];
    const aligned = alignProductActionsWithPsychoeducation(actions, {
      primaryPsychoeducationId: 'psychoeducation_sleep',
      language: 'es',
      userContent: 'No puedo dormir, sigo pensando en todo lo que salió mal hoy'
    });
    expect(aligned[0].draft.title).toBe('Registrar lo que me preocupa antes de dormir');
    expect(aligned[0].rationaleShort).toContain('accionable');
  });

  it('alignProductActionsWithPsychoeducation corrige tareas claramente fuera de tema', () => {
    const actions = [
      {
        type: 'propose_task',
        id: 't1',
        draft: { title: 'Ordenar encimera de cocina' },
        rationaleShort: 'Paso concreto.'
      }
    ];
    const aligned = alignProductActionsWithPsychoeducation(actions, {
      primaryPsychoeducationId: 'psychoeducation_sleep',
      language: 'es',
      userContent: 'No puedo dormir, sigo pensando en todo lo que salió mal hoy'
    });
    expect(aligned[0].draft.title).toBe(
      'Anotar brevemente lo que me preocupa antes de acostarme'
    );
    expect(aligned[0].rationaleShort).toContain('Sueño');
  });

  it('getPsychoeducationProductActionContext expone microSteps del tema', () => {
    const ctx = getPsychoeducationProductActionContext('psychoeducation_sleep', 'es');
    expect(ctx?.topicTitle).toBe('Sueño');
    expect(ctx?.microSteps?.[0]).toContain('despertar');
  });

  describe('merge desde LLM', () => {
    it('mergeTaskDraftFromLlm ignora dueDate anterior a hoy', () => {
      const baseline = {
        title: 'Base',
        description: '',
        dueDate: new Date(Date.now() + 48 * 3600000).toISOString(),
        priority: 'medium',
        itemType: 'task',
        category: 'General',
        tags: []
      };
      const past = new Date(Date.now() - 7 * 86400000).toISOString();
      const merged = mergeTaskDraftFromLlm(baseline, { title: 'Nuevo título', dueDate: past });
      expect(merged.title).toBe('Nuevo título');
      expect(merged.dueDate).toBe(baseline.dueDate);
    });

    it('mergeHabitDraftFromLlm ignora icon inválido', () => {
      const baseline = {
        title: 'Meditar',
        description: '',
        icon: 'meditation',
        frequency: 'daily',
        reminder: { enabled: true, time: new Date(Date.now() + 3600000).toISOString() },
        priority: 'medium'
      };
      const merged = mergeHabitDraftFromLlm(baseline, { icon: 'invalid_icon' });
      expect(merged.icon).toBe('meditation');
    });

    it('mergeProductActionDraftFromLlm acepta payload anidado en draft', () => {
      const action = {
        type: 'propose_task',
        id: 'id-1',
        draft: {
          title: 'X',
          description: '',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'low',
          itemType: 'task',
          category: 'General',
          tags: []
        }
      };
      const next = mergeProductActionDraftFromLlm(action, {
        draft: { title: 'Título refinado', priority: 'high' }
      });
      expect(next.draft.title).toBe('Título refinado');
      expect(next.draft.priority).toBe('high');
    });
  });
});
