/**
 * Tests — limpieza de estado al borrar mensajes
 */
import { jest } from '@jest/globals';

const mockUpdateOne = jest.fn();
const mockDeleteMany = jest.fn();

await jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  __esModule: true,
  default: { updateOne: mockUpdateOne },
}));

await jest.unstable_mockModule('../../../models/ChatInterventionEvent.js', () => ({
  __esModule: true,
  default: { deleteMany: mockDeleteMany },
}));

const { resetConversationSessionState } = await import(
  '../../../services/conversationClearService.js'
);

describe('conversationClearService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockDeleteMany.mockResolvedValue({ deletedCount: 2 });
  });

  it('no hace nada si full=false', async () => {
    await resetConversationSessionState('507f1f77bcf86cd799439011', { full: false });
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it('limpia rollingSummary y eventos del grafo', async () => {
    await resetConversationSessionState('507f1f77bcf86cd799439011');
    expect(mockUpdateOne).toHaveBeenCalled();
    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: expect.anything() }),
    );
  });
});
