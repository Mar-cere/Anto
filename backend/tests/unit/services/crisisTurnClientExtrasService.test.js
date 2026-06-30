/**
 * Tests de integración para crisisTurnClientExtrasService (#19 blindaje).
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({});
const mockFindOne = jest.fn();
const mockGetEmergencyContacts = jest.fn().mockResolvedValue([]);
const mockRecordMetric = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  default: {
    findByIdAndUpdate: (...args) => mockFindByIdAndUpdate(...args),
    findOne: (...args) => mockFindOne(...args),
  },
}));

jest.unstable_mockModule('../../../services/emergencyAlertService.js', () => ({
  default: {
    getEmergencyContacts: (...args) => mockGetEmergencyContacts(...args),
  },
}));

jest.unstable_mockModule('../../../services/metricsService.js', () => ({
  default: {
    recordMetric: (...args) => mockRecordMetric(...args),
  },
}));

const { applyCrisisProtocolForTurn, dismissSoftCrisisCheckInForConversation } =
  await import('../../../services/crisisTurnClientExtrasService.js');

describe('crisisTurnClientExtrasService (#19)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('WARNING sin batería devuelve softCrisisCheckIn sin crisisResources', async () => {
    const result = await applyCrisisProtocolForTurn({
      conversation: { _id: '507f1f77bcf86cd799439011' },
      userId: '507f1f77bcf86cd799439012',
      riskLevel: 'WARNING',
      messageContent: 'me siento muy mal y agobiado',
      preferences: { country: 'ES' },
      language: 'es',
    });

    expect(result.crisisResources).toBeNull();
    expect(result.softCrisisCheckIn?.active).toBe(true);
    expect(result.softCrisisCheckIn?.techniques?.length).toBeGreaterThanOrEqual(2);
    expect(result.proposedEmergencyContactAlert).toBeNull();
    expect(mockFindByIdAndUpdate).toHaveBeenCalled();
  });

  it('MEDIUM devuelve crisisResources sin softCrisisCheckIn', async () => {
    const result = await applyCrisisProtocolForTurn({
      conversation: { _id: '507f1f77bcf86cd799439011' },
      userId: '507f1f77bcf86cd799439012',
      riskLevel: 'MEDIUM',
      messageContent: 'no aguanto más',
      preferences: { country: 'ES' },
      language: 'es',
    });

    expect(result.crisisResources).not.toBeNull();
    expect(result.softCrisisCheckIn).toBeNull();
    expect(result.crisisProtocolState.active).toBe(true);
  });

  it('dismissSoftCrisisCheckInForConversation marca dismissed en conversación', async () => {
    mockFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        softCrisisCheckInState: { active: true, stableUserTurns: 0, dismissed: false },
        userId: '507f1f77bcf86cd799439012',
      }),
    });

    const outcome = await dismissSoftCrisisCheckInForConversation(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
    );

    expect(outcome.ok).toBe(true);
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.objectContaining({
        softCrisisCheckInState: expect.objectContaining({ dismissed: true, active: true }),
      }),
    );
  });
});
