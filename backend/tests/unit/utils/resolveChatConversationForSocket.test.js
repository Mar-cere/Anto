import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockSave = jest.fn();
const mockFindOne = jest.fn();

function chainLean(result) {
  return {
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(result),
    }),
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(result),
    }),
  };
}

await jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  default: function Conversation(data) {
    Object.assign(this, data);
    this._id = new mongoose.Types.ObjectId();
    this.sessionIntention = null;
    this.tccLiteState = undefined;
    this.rollingSummary = null;
    this.rollingSummaryAtMessageCount = 0;
    this.status = 'active';
    this.save = mockSave.mockResolvedValue(this);
  },
}));

const Conversation = (await import('../../../models/Conversation.js')).default;
Conversation.findOne = mockFindOne;

const { resolveChatConversationForSocket } = await import(
  '../../../utils/resolveChatConversationForSocket.js'
);

describe('resolveChatConversationForSocket', () => {
  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockReset();
  });

  it('usa conversationId del cliente si pertenece al usuario', async () => {
    const convId = new mongoose.Types.ObjectId();
    mockFindOne.mockImplementation(() =>
      chainLean({
        _id: convId,
        sessionIntention: 'vent',
        tccLiteState: null,
      }),
    );

    const out = await resolveChatConversationForSocket({
      userId,
      conversationId: String(convId),
    });

    expect(out._id).toEqual(convId);
    expect(mockFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: convId,
        userId,
      }),
    );
  });

  it('rechaza conversationId ajeno', async () => {
    mockFindOne.mockImplementation(() => chainLean(null));
    await expect(
      resolveChatConversationForSocket({
        userId,
        conversationId: new mongoose.Types.ObjectId().toString(),
      }),
    ).rejects.toMatchObject({ code: 'CONVERSATION_FORBIDDEN' });
  });

  it('usa conversación activa si no hay conversationId del cliente', async () => {
    const activeId = new mongoose.Types.ObjectId();
    mockFindOne.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: activeId,
            sessionIntention: 'vent',
            status: 'active',
          }),
        }),
      }),
    }));

    const out = await resolveChatConversationForSocket({ userId });
    expect(out._id).toEqual(activeId);
  });

  it('crea conversación nueva si no hay activa', async () => {
    mockFindOne.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    }));

    const out = await resolveChatConversationForSocket({ userId });
    expect(out._id).toBeDefined();
    expect(mockSave).toHaveBeenCalled();
  });
});
