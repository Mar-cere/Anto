/**
 * Tests — compromisos entre sesiones (#202)
 */
import { jest } from '@jest/globals';

const mockFind = jest.fn();
const mockCreate = jest.fn();
const mockFindOneAndUpdate = jest.fn();

await jest.unstable_mockModule('../../../models/SessionCommitment.js', () => ({
  __esModule: true,
  default: {
    find: mockFind,
    create: mockCreate,
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

const {
  createSessionCommitment,
  listSessionCommitments,
  updateSessionCommitment,
} = await import('../../../services/sessionCommitmentService.js');

const userId = '507f1f77bcf86cd799439011';

describe('sessionCommitmentService (#202)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza etiquetas demasiado cortas', async () => {
    const result = await createSessionCommitment(userId, { label: 'a' });
    expect(result.error).toBe('labelRequired');
  });

  it('crea compromiso con follow-up por defecto', async () => {
    const created = {
      _id: '507f1f77bcf86cd799439012',
      label: 'Respirar antes de responder',
      status: 'active',
      source: 'session_insight',
      conversationId: null,
      followUpAt: new Date(),
      followUpAnswer: 'pending',
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCreate.mockResolvedValue({ toObject: () => created });

    const result = await createSessionCommitment(userId, {
      label: 'Respirar antes de responder',
      source: 'session_insight',
    });

    expect(result.commitment?.label).toBe('Respirar antes de responder');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('lista compromisos activos', async () => {
    mockFind.mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => [
            {
              _id: '507f1f77bcf86cd799439012',
              label: 'Caminar 10 min',
              status: 'active',
              source: 'manual',
              followUpAnswer: 'pending',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }),
      }),
    });

    const items = await listSessionCommitments(userId, { status: 'active', limit: 5 });
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('Caminar 10 min');
  });

  it('marca completado al responder follow-up yes', async () => {
    const updated = {
      _id: '507f1f77bcf86cd799439012',
      label: 'Caminar 10 min',
      status: 'completed',
      source: 'manual',
      followUpAnswer: 'yes',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindOneAndUpdate.mockReturnValue({
      lean: async () => updated,
    });

    const result = await updateSessionCommitment(userId, '507f1f77bcf86cd799439012', {
      followUpAnswer: 'yes',
    });

    expect(result.commitment?.status).toBe('completed');
    expect(mockFindOneAndUpdate).toHaveBeenCalled();
  });
});
