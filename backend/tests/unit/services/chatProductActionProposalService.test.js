import {
  buildProposedProductActions,
  shouldOfferProductActions,
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

  it('buildProposedProductActions vacío si intención no es plan/organize', () => {
    const actions = buildProposedProductActions({
      ...base,
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
