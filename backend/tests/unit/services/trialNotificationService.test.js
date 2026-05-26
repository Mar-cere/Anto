/**
 * Tests unitarios para servicio de notificaciones de trial
 */
import { jest } from '@jest/globals';

const mockSendTrialExpiring = jest.fn().mockResolvedValue({ success: true });
const mockFindById = jest.fn();

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: (...args) => ({
      select: () => mockFindById(...args),
    }),
  },
}));

jest.unstable_mockModule('../../../models/Subscription.js', () => ({
  default: {
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../services/pushNotificationService.js', () => ({
  default: {
    sendTrialExpiring: (...args) => mockSendTrialExpiring(...args),
    sendSubscriptionReminder: jest.fn(),
  },
}));

const { default: trialNotificationService } = await import(
  '../../../services/trialNotificationService.js'
);

describe('TrialNotificationService', () => {
  beforeEach(() => {
    mockSendTrialExpiring.mockClear();
    mockFindById.mockReset();
  });

  it('expone métodos del servicio', () => {
    expect(trialNotificationService).toBeDefined();
    expect(typeof trialNotificationService.sendTrialExpirationNotification).toBe('function');
  });

  it('sendTrialExpirationNotification usa pool bilingüe según preferences.language', async () => {
    mockFindById.mockResolvedValue({
      email: 'en@example.com',
      username: 'user',
      pushToken: 'ExponentPushToken[test]',
      preferences: { language: 'en' },
    });

    await trialNotificationService.sendTrialExpirationNotification('user-id', 4);

    expect(mockSendTrialExpiring).toHaveBeenCalledWith('ExponentPushToken[test]', {
      daysRemaining: 4,
      language: 'en',
    });
  });

  it('sendTrialExpirationNotification no envía mensaje hardcodeado en español', async () => {
    mockFindById.mockResolvedValue({
      email: 'es@example.com',
      pushToken: 'ExponentPushToken[test]',
      preferences: { language: 'es' },
    });

    await trialNotificationService.sendTrialExpirationNotification('user-id', 5);

    expect(mockSendTrialExpiring).toHaveBeenCalledTimes(1);
    const call = mockSendTrialExpiring.mock.calls[0];
    expect(call[1]).toEqual({ daysRemaining: 5, language: 'es' });
    expect(call[1].message).toBeUndefined();
  });
});
