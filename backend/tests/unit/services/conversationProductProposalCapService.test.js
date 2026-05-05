/**
 * Tests unitarios: tope de propuestas no explícitas por conversación (ESM + mock).
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

const findByIdMock = jest.fn();
const updateOneMock = jest.fn();

await jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  __esModule: true,
  default: {
    findById: (...args) => findByIdMock(...args),
    updateOne: (...args) => updateOneMock(...args)
  }
}));

const {
  filterProposedProductActionsByConversationCap,
  incrementNonExplicitProductProposalCountIfApplied,
  MAX_NON_EXPLICIT_PRODUCT_PROPOSALS_PER_CONVERSATION,
  NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS,
  CAP_BY_NEED_LEVEL,
  COOLDOWN_MS_BY_NEED_LEVEL
} = await import('../../../services/conversationProductProposalCapService.js');

describe('conversationProductProposalCapService', () => {
  const convId = new mongoose.Types.ObjectId().toString();
  const actions = [{ type: 'propose_task', id: 'x', draft: { title: 'T' } }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('expone máximo 2 no explícitas por conversación', () => {
    expect(MAX_NON_EXPLICIT_PRODUCT_PROPOSALS_PER_CONVERSATION).toBe(2);
  });

  it('expone enfriamiento para no sugerir en cada turno', () => {
    expect(NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS).toBe(10 * 60 * 1000);
  });

  it('expone cap y cooldown dinámicos por nivel', () => {
    expect(CAP_BY_NEED_LEVEL).toEqual({ low: 1, medium: 2, high: 3 });
    expect(COOLDOWN_MS_BY_NEED_LEVEL.low).toBe(20 * 60 * 1000);
    expect(COOLDOWN_MS_BY_NEED_LEVEL.medium).toBe(10 * 60 * 1000);
    expect(COOLDOWN_MS_BY_NEED_LEVEL.high).toBe(5 * 60 * 1000);
  });

  it('no consulta BD si el pedido es explícito', async () => {
    const out = await filterProposedProductActionsByConversationCap(
      'generala en mis tareas',
      convId,
      actions
    );
    expect(out).toEqual(actions);
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('toma "puedes generar la tarea" como explícito (sin cap/cooldown)', async () => {
    const out = await filterProposedProductActionsByConversationCap(
      'puedes generar la tarea',
      convId,
      actions
    );
    expect(out).toEqual(actions);
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('batería explícita no consulta BD (task + habit)', async () => {
    const explicitSamples = [
      'puedes generar la tarea',
      'crea la tarea',
      'genera una tarea',
      'agregarlo a mis tareas',
      'en mis tareas',
      'puedes generar el hábito',
      'crea un hábito',
      'genera un hábito',
      'agregarlo a mis hábitos',
      'en mis hábitos'
    ];
    for (const text of explicitSamples) {
      // eslint-disable-next-line no-await-in-loop
      const out = await filterProposedProductActionsByConversationCap(text, convId, actions);
      expect(out).toEqual(actions);
    }
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('vacía propuestas si ya se alcanzó el tope no explícito', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({ nonExplicitProductProposalCount: 2 })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'quiero ordenar mi día',
      convId,
      actions
    );
    expect(out).toEqual([]);
  });

  it('permite una oferta no explícita con count 1 cuando la necesidad es alta', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({ nonExplicitProductProposalCount: 1, lastNonExplicitProductProposalAt: null })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'estoy atareado, mañana examen y no sé por dónde empezar a estudiar',
      convId,
      actions
    );
    expect(out).toEqual(actions);
  });

  it('bloquea por enfriamiento si hubo propuesta reciente', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({
          nonExplicitProductProposalCount: 1,
          lastNonExplicitProductProposalAt: new Date(Date.now() - 30 * 1000).toISOString()
        })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'quiero ordenar mi día',
      convId,
      actions
    );
    expect(out).toEqual([]);
  });

  it('cap low permite 1 y bloquea desde la segunda no explícita', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({ nonExplicitProductProposalCount: 1, lastNonExplicitProductProposalAt: null })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'tengo mil cosas encima',
      convId,
      actions
    );
    expect(out).toEqual([]);
  });

  it('cap high permite hasta 3 no explícitas', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({ nonExplicitProductProposalCount: 2, lastNonExplicitProductProposalAt: null })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'estoy atareado, mañana examen y no sé por dónde empezar a estudiar',
      convId,
      actions
    );
    expect(out).toEqual(actions);
  });

  it('cooldown high (5m) permite tras 6m', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({
          nonExplicitProductProposalCount: 0,
          lastNonExplicitProductProposalAt: new Date(Date.now() - 6 * 60 * 1000).toISOString()
        })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'mañana examen, tengo mucho que estudiar y no sé por dónde empezar',
      convId,
      actions
    );
    expect(out).toEqual(actions);
  });

  it('incrementNonExplicit no llama updateOne si el mensaje es explícito', async () => {
    await incrementNonExplicitProductProposalCountIfApplied('ponelo en mis tareas', convId, 1);
    expect(updateOneMock).not.toHaveBeenCalled();
  });

  it('incrementNonExplicit llama updateOne si no es explícito y hubo emisión', async () => {
    updateOneMock.mockResolvedValue({ modifiedCount: 1 });
    await incrementNonExplicitProductProposalCountIfApplied('quiero ordenar la semana', convId, 1);
    expect(updateOneMock).toHaveBeenCalledWith(
      { _id: convId },
      {
        $inc: { nonExplicitProductProposalCount: 1 },
        $set: { lastNonExplicitProductProposalAt: expect.any(Date) }
      }
    );
  });
});
