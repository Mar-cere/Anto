/**
 * Tests — marco TCC lite in-chat (#201 MVP).
 */
import {
  planChatTccLite,
  readLastTccLiteFromHistory,
  toTccLiteClientPayload,
  attachTccLiteToAssistantMetadata,
} from '../../../services/chatTccLiteService.js';

describe('chatTccLiteService', () => {
  const baseContext = {
    userContent: 'Seguro que todo va a salir mal y nunca voy a poder con esto',
    emotionalAnalysis: { intensity: 7, mainEmotion: 'ansiedad' },
    contextualAnalysis: {
      primaryDistortion: {
        type: 'catastrophizing',
        name: 'Catastrofismo',
        confidence: 0.8,
      },
    },
    conversationHistory: [],
    riskLevel: 'LOW',
    sessionIntention: undefined,
    language: 'es',
  };

  it('activa en paso capture_thought con distorsión clara', () => {
    const plan = planChatTccLite(baseContext);
    expect(plan.active).toBe(true);
    expect(plan.step).toBe('capture_thought');
    expect(plan.distortionType).toBe('catastrophizing');
    expect(plan.promptSnippet).toContain('MARCO TCC LITE');
  });

  it('no activa en riesgo alto', () => {
    const plan = planChatTccLite({ ...baseContext, riskLevel: 'HIGH' });
    expect(plan.active).toBe(false);
  });

  it('no activa si el usuario pide parar', () => {
    const plan = planChatTccLite({
      ...baseContext,
      userContent: 'mejor no, solo quiero hablar',
    });
    expect(plan.active).toBe(false);
  });

  it('avanza de paso según historial del asistente', () => {
    const history = [
      {
        role: 'assistant',
        metadata: { tccLite: { step: 'capture_thought', distortionType: 'catastrophizing' } },
      },
    ];
    const plan = planChatTccLite({
      ...baseContext,
      userContent: 'La frase que me repito es que voy a fracasar siempre',
      conversationHistory: history,
    });
    expect(plan.active).toBe(true);
    expect(plan.step).toBe('check_evidence');
  });

  it('reanuda desde estado persistido si no hay metadata en historial', () => {
    const plan = planChatTccLite({
      ...baseContext,
      userContent: 'Sigo pensando que todo saldrá mal en el examen',
      conversationHistory: [],
      persistedState: { step: 'check_evidence', distortionType: 'catastrophizing', completed: false },
    });
    expect(plan.active).toBe(true);
    expect(plan.step).toBe('build_alternative');
  });

  it('readLastTccLiteFromHistory lee el paso del asistente más reciente', () => {
    const history = [
      { role: 'assistant', metadata: { tccLite: { step: 'check_evidence' } } },
      { role: 'user', content: 'hola' },
    ];
    expect(readLastTccLiteFromHistory(history)?.step).toBe('check_evidence');
  });

  it('readLastTccLiteFromHistory devuelve null si el asistente más reciente no tiene tccLite', () => {
    const history = [
      { role: 'assistant', metadata: { status: 'sent' } },
      { role: 'assistant', metadata: { tccLite: { step: 'capture_thought' } } },
    ];
    expect(readLastTccLiteFromHistory(history)).toBeNull();
  });

  it('toTccLiteClientPayload expone labels para UI', () => {
    const plan = planChatTccLite(baseContext);
    const client = toTccLiteClientPayload(plan, 'es');
    expect(client.active).toBe(true);
    expect(client.stepLabel).toBe('Pensamiento');
    expect(client.kicker).toBe('Explorando tu pensamiento');
  });

  it('attachTccLiteToAssistantMetadata añade tccLite enriquecido al metadata', () => {
    const plan = planChatTccLite(baseContext);
    const meta = attachTccLiteToAssistantMetadata({ status: 'sent' }, plan, 'es');
    expect(meta.tccLite.step).toBe('capture_thought');
    expect(meta.tccLite.stepIndex).toBe(0);
    expect(meta.tccLite.stepTotal).toBe(4);
    expect(meta.tccLite.frameLabel).toBe('Explorando tu pensamiento');
    expect(meta.tccLite.stepShort).toBe('Nombrar la idea');
  });

  it('no ofrece atHandoff mientras el paso wrap_up está activo', () => {
    const history = [
      {
        role: 'assistant',
        metadata: { tccLite: { step: 'build_alternative', distortionType: 'catastrophizing' } },
      },
    ];
    const plan = planChatTccLite({
      ...baseContext,
      userContent: 'Una lectura más equilibrada sería ir paso a paso sin exigirme perfección',
      conversationHistory: history,
    });
    expect(plan.active).toBe(true);
    expect(plan.step).toBe('wrap_up');
    expect(plan.atHandoff).toBeNull();
  });

  it('toTccLiteClientPayload incluye atHandoff solo al completar', () => {
    const completed = {
      active: false,
      completed: true,
      atHandoff: { screen: 'AutomaticThoughtRecord', params: {} },
    };
    const client = toTccLiteClientPayload(completed, 'es');
    expect(client.active).toBe(false);
    expect(client.completed).toBe(true);
    expect(client.atHandoff?.screen).toBe('AutomaticThoughtRecord');

    const activeWrap = toTccLiteClientPayload(
      {
        active: true,
        step: 'wrap_up',
        stepIndex: 3,
        stepTotal: 4,
        completed: false,
        atHandoff: { screen: 'AutomaticThoughtRecord', params: {} },
      },
      'es',
    );
    expect(activeWrap.active).toBe(true);
    expect(activeWrap.atHandoff).toBeNull();
  });

  it('attachTccLiteToAssistantMetadata ignora pasos inválidos', () => {
    const meta = attachTccLiteToAssistantMetadata(
      { status: 'sent' },
      { active: true, step: 'invalid', stepIndex: 0, stepTotal: 4 },
      'es',
    );
    expect(meta.tccLite).toBeUndefined();
  });

  it('genera prompt en inglés', () => {
    const plan = planChatTccLite({ ...baseContext, language: 'en' });
    expect(plan.promptSnippet).toContain('TCC LITE FRAME');
  });

  it('activa desde resumeFromInsight sin distorsión en el mensaje', () => {
    const plan = planChatTccLite({
      userContent: 'Hola, quiero seguir',
      emotionalAnalysis: { intensity: 4 },
      contextualAnalysis: {},
      conversationHistory: [],
      riskLevel: 'LOW',
      language: 'es',
      resumeFromInsight: {
        distortionType: 'all_or_nothing',
        distortionLabel: 'Todo o nada',
      },
    });
    expect(plan.active).toBe(true);
    expect(plan.step).toBe('capture_thought');
    expect(plan.distortionType).toBe('all_or_nothing');
    expect(plan.resumedFromInsight).toBe(true);
  });

  it('construye atHandoff al completar tras wrap_up', () => {
    const history = [
      {
        role: 'assistant',
        metadata: { tccLite: { step: 'wrap_up', distortionType: 'catastrophizing' } },
      },
    ];
    const plan = planChatTccLite({
      userContent: 'Me ayudó pensar que puedo ir paso a paso',
      emotionalAnalysis: { intensity: 5 },
      contextualAnalysis: {},
      conversationHistory: history,
      riskLevel: 'LOW',
      language: 'es',
    });
    expect(plan.completed).toBe(true);
    expect(plan.active).toBe(false);
    expect(plan.atHandoff?.screen).toBe('AutomaticThoughtRecord');
  });
});
