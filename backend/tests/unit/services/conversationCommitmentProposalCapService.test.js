/**
 * Tests — cap de propuestas de compromiso (#202)
 */
import { jest } from '@jest/globals';

const mockFindById = jest.fn();
const mockUpdateOne = jest.fn();

await jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  __esModule: true,
  default: {
    findById: mockFindById,
    updateOne: mockUpdateOne,
  },
}));

const {
  filterProposedCommitmentsByConversationCap,
  COMMITMENT_PROPOSAL_COOLDOWN_MS,
} = await import('../../../services/conversationCommitmentProposalCapService.js');

describe('conversationCommitmentProposalCapService (#202)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateOne.mockResolvedValue({});
  });

  it('permite pedido explícito sin cooldown', async () => {
    const proposals = [{ id: '1', label: 'Paso pequeño' }];
    const out = await filterProposedCommitmentsByConversationCap(
      'guárdalo como compromiso',
      '507f1f77bcf86cd799439099',
      proposals,
    );
    expect(out).toEqual(proposals);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it('bloquea si el cooldown no expiró', async () => {
    mockFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({
          lastCommitmentProposalAt: new Date(Date.now() - COMMITMENT_PROPOSAL_COOLDOWN_MS + 60000),
        }),
      }),
    });
    const out = await filterProposedCommitmentsByConversationCap(
      'esta semana voy a intentar meditar',
      '507f1f77bcf86cd799439099',
      [{ id: '1', label: 'Meditar cinco minutos' }],
    );
    expect(out).toEqual([]);
  });
});
