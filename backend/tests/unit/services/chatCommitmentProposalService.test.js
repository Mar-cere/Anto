/**
 * Tests — propuestas de compromiso en chat (#202)
 */
import { jest } from '@jest/globals';

const mockCountDocuments = jest.fn();

await jest.unstable_mockModule('../../../models/SessionCommitment.js', () => ({
  __esModule: true,
  default: { countDocuments: mockCountDocuments },
}));

const {
  shouldOfferCommitmentProposals,
  buildProposedCommitments,
  isExplicitCommitmentRequest,
} = await import('../../../services/chatCommitmentProposalService.js');

const userId = '507f1f77bcf86cd799439011';
const conversationId = '507f1f77bcf86cd799439099';
const assistantMessageId = '507f1f77bcf86cd799439088';

describe('chatCommitmentProposalService (#202)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
  });

  it('bloquea propuestas en crisis', () => {
    expect(shouldOfferCommitmentProposals({ isCrisis: true, riskLevel: 'LOW' })).toBe(false);
    expect(shouldOfferCommitmentProposals({ isCrisis: false, riskLevel: 'HIGH' })).toBe(false);
  });

  it('detecta pedido explícito de compromiso', () => {
    expect(isExplicitCommitmentRequest('guárdalo como compromiso de sesión')).toBe(true);
    expect(isExplicitCommitmentRequest('solo escuchar')).toBe(false);
  });

  it('no propone sin ancla accionable en desahogo', async () => {
    const items = await buildProposedCommitments({
      userId,
      riskLevel: 'LOW',
      isCrisis: false,
      userContent: 'estoy triste y no sé qué hacer con mi vida',
      assistantContent: 'Te escucho.',
      sessionIntention: 'vent',
      conversationId,
      assistantMessageId,
    });
    expect(items).toEqual([]);
  });

  it('propone compromiso con acuerdo accionable', async () => {
    const items = await buildProposedCommitments({
      userId,
      riskLevel: 'LOW',
      isCrisis: false,
      userContent: 'Esta semana voy a intentar caminar diez minutos después del almuerzo',
      assistantContent: 'Me parece un paso pequeño y concreto.',
      sessionIntention: 'plan',
      conversationId,
      assistantMessageId,
    });
    expect(items).toHaveLength(1);
    expect(items[0].label.length).toBeGreaterThan(2);
    expect(items[0].id).toBeTruthy();
  });

  it('no propone si ya hay 3 compromisos activos visibles', async () => {
    mockCountDocuments.mockResolvedValue(3);
    const items = await buildProposedCommitments({
      userId,
      riskLevel: 'LOW',
      isCrisis: false,
      userContent: 'Esta semana voy a intentar ordenar el escritorio',
      assistantContent: 'Quedamos en un paso pequeño.',
      sessionIntention: 'organize',
      conversationId,
      assistantMessageId,
    });
    expect(items).toEqual([]);
  });
});
