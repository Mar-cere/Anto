/**
 * Tests — limpieza de estado al borrar mensajes
 */
import { jest } from '@jest/globals';

const mockUpdateOne = jest.fn();
const mockDeleteMany = jest.fn();
const mockSessionJobUpdateMany = jest.fn();
const mockExperientialJobUpdateMany = jest.fn();
const mockUserUpdateOne = jest.fn();

await jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  __esModule: true,
  default: { updateOne: mockUpdateOne },
}));

await jest.unstable_mockModule('../../../models/ChatInterventionEvent.js', () => ({
  __esModule: true,
  default: { deleteMany: mockDeleteMany },
}));

await jest.unstable_mockModule('../../../models/SessionSummaryJob.js', () => ({
  __esModule: true,
  default: { updateMany: mockSessionJobUpdateMany },
}));

await jest.unstable_mockModule('../../../models/ExperientialPatternJob.js', () => ({
  __esModule: true,
  default: { updateMany: mockExperientialJobUpdateMany },
}));

await jest.unstable_mockModule('../../../models/User.js', () => ({
  __esModule: true,
  default: { updateOne: mockUserUpdateOne },
}));

const { resetConversationSessionState } = await import(
  '../../../services/conversationClearService.js'
);

describe('conversationClearService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockDeleteMany.mockResolvedValue({ deletedCount: 2 });
    mockSessionJobUpdateMany.mockResolvedValue({ modifiedCount: 1 });
    mockExperientialJobUpdateMany.mockResolvedValue({ modifiedCount: 1 });
    mockUserUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('no hace nada si full=false', async () => {
    await resetConversationSessionState('507f1f77bcf86cd799439011', { full: false });
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it('limpia rollingSummary, estado de crisis/TCC y eventos del grafo', async () => {
    await resetConversationSessionState('507f1f77bcf86cd799439011');
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      expect.objectContaining({
        $unset: expect.objectContaining({
          rollingSummary: '',
          tccLiteState: '',
          crisisProtocolState: '',
          softCrisisCheckInState: '',
        }),
      }),
    );
    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: expect.anything() }),
    );
    expect(mockSessionJobUpdateMany).not.toHaveBeenCalled();
    expect(mockExperientialJobUpdateMany).not.toHaveBeenCalled();
    expect(mockUserUpdateOne).not.toHaveBeenCalled();
  });

  it('cancela jobs y continuidad del dashboard si hay userId', async () => {
    await resetConversationSessionState('507f1f77bcf86cd799439011', {
      userId: '507f1f77bcf86cd799439099',
    });
    expect(mockSessionJobUpdateMany).toHaveBeenCalled();
    expect(mockExperientialJobUpdateMany).toHaveBeenCalled();
    expect(mockUserUpdateOne).toHaveBeenCalled();
  });

  it('al cancelar extract experiencial excluye jobs con transcriptSnapshot', async () => {
    await resetConversationSessionState('507f1f77bcf86cd799439011', {
      userId: '507f1f77bcf86cd799439099',
    });
    expect(mockExperientialJobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          expect.objectContaining({ transcriptSnapshot: { $exists: false } }),
        ]),
      }),
      expect.objectContaining({ $set: { status: 'cancelled' } }),
    );
  });
});
