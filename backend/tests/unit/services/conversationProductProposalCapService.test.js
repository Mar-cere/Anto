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
  NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS
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

  it('no consulta BD si el pedido es explícito', async () => {
    const out = await filterProposedProductActionsByConversationCap(
      'generala en mis tareas',
      convId,
      actions
    );
    expect(out).toEqual(actions);
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('vacía propuestas si ya se alcanzó el tope no explícito', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({ nonExplicitProductProposalCount: 2 })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'la cocina me agobia',
      convId,
      actions
    );
    expect(out).toEqual([]);
  });

  it('permite la segunda oferta no explícita cuando count es 1', async () => {
    findByIdMock.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue({ nonExplicitProductProposalCount: 1, lastNonExplicitProductProposalAt: null })
      })
    });
    const out = await filterProposedProductActionsByConversationCap(
      'necesito ordenar el escritorio',
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
