/**
 * Tests unitarios: enriquecimiento LLM de propuestas tarea/hábito (mock OpenAI, ESM).
 */
import { jest } from '@jest/globals';

const createResilient = jest.fn();

await jest.unstable_mockModule('../../../services/openaiService.js', () => ({
  __esModule: true,
  default: {
    createChatCompletionResilient: (...args) => createResilient(...args)
  }
}));

await jest.unstable_mockModule('../../../utils/withTimeout.js', () => ({
  withTimeout: (p) => p
}));

const { default: chatProductActionLlmService } = await import(
  '../../../services/chatProductActionLlmService.js'
);

describe('chatProductActionLlmService', () => {
  const prevKey = process.env.OPENAI_API_KEY;
  const prevLlm = process.env.CHAT_PRODUCT_ACTION_LLM;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key-for-jest';
    if (prevLlm === undefined) delete process.env.CHAT_PRODUCT_ACTION_LLM;
    else process.env.CHAT_PRODUCT_ACTION_LLM = prevLlm;
  });

  afterAll(() => {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    if (prevLlm === undefined) delete process.env.CHAT_PRODUCT_ACTION_LLM;
    else process.env.CHAT_PRODUCT_ACTION_LLM = prevLlm;
  });

  it('enrichProposedProductActionsWithLlm fusiona tarea cuando el modelo devuelve JSON', async () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString();
    createResilient.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Llamar al contador mañana',
              description: 'Consultar facturas',
              dueDate: future,
              priority: 'high',
              itemType: 'task'
            })
          }
        }
      ]
    });

    const baselineDraft = {
      title: 'Texto largo original del usuario que debe ser reemplazado',
      description: '',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: 'medium',
      itemType: 'task',
      category: 'General',
      tags: []
    };

    const actions = [
      {
        type: 'propose_task',
        id: 'a1',
        draft: baselineDraft,
        rationaleShort: 'x'
      }
    ];

    const out = await chatProductActionLlmService.enrichProposedProductActionsWithLlm(actions, {
      userContent: 'Necesito llamar al contador',
      assistantContent: 'Puedes anotarlo como tarea.'
    });

    expect(createResilient).toHaveBeenCalled();
    expect(out[0].draft.title).toBe('Llamar al contador mañana');
    expect(out[0].draft.description).toBe('Consultar facturas');
    expect(out[0].draft.priority).toBe('high');
  });

  it('solo enriquece las primeras 2 acciones con LLM', async () => {
    createResilient.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ title: 'Desde LLM' }) } }]
    });
    const mk = (id, title) => ({
      type: 'propose_task',
      id,
      draft: {
        title,
        description: '',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: 'medium',
        itemType: 'task',
        category: 'General',
        tags: []
      }
    });
    const actions = [mk('1', 'A'), mk('2', 'B'), mk('3', 'C')];
    const out = await chatProductActionLlmService.enrichProposedProductActionsWithLlm(actions, {
      userContent: 'plan',
      assistantContent: 'ok'
    });
    expect(createResilient).toHaveBeenCalledTimes(2);
    expect(out).toHaveLength(3);
    expect(out[2].draft.title).toBe('C');
  });

  it('enrichProposedProductActionsWithLlm conserva tarea coherente con sueño y rumiación', async () => {
    createResilient.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Registrar lo que me preocupa antes de dormir'
            })
          }
        }
      ]
    });

    const actions = [
      {
        type: 'propose_task',
        id: 'a1',
        draft: {
          title: 'Paso genérico',
          description: '',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'medium',
          itemType: 'task',
          category: 'General',
          tags: []
        }
      }
    ];

    const out = await chatProductActionLlmService.enrichProposedProductActionsWithLlm(actions, {
      userContent: 'No puedo dormir, sigo pensando en todo lo que salió mal hoy',
      assistantContent: 'Podemos anotar tus preocupaciones.',
      primaryPsychoeducationId: 'psychoeducation_sleep',
      language: 'es'
    });

    expect(out[0].draft.title).toBe('Registrar lo que me preocupa antes de dormir');
  });

  it('enrichProposedProductActionsWithLlm devuelve acciones sin cambio si CHAT_PRODUCT_ACTION_LLM=false', async () => {
    process.env.CHAT_PRODUCT_ACTION_LLM = 'false';
    const actions = [
      {
        type: 'propose_task',
        id: 'a1',
        draft: { title: 'Solo heurística', dueDate: new Date().toISOString() }
      }
    ];
    const out = await chatProductActionLlmService.enrichProposedProductActionsWithLlm(actions, {
      userContent: 'hola',
      assistantContent: 'hola'
    });
    expect(createResilient).not.toHaveBeenCalled();
    expect(out[0].draft.title).toBe('Solo heurística');
  });
});
