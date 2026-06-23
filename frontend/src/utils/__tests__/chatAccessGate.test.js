import {
  accountWithinFirstSessionGrace,
  canAttemptChatAccess,
  FIRST_SESSION_GRACE_MS,
} from '../chatAccessGate';
import paymentService from '../../services/paymentService';
import { subscriptionLooksCurrentlyUsable } from '../subscriptionAccess';

jest.mock('../../services/paymentService', () => ({
  __esModule: true,
  default: {
    getSubscriptionStatus: jest.fn(),
    getTrialInfo: jest.fn(),
  },
}));

describe('chatAccessGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accountWithinFirstSessionGrace acepta cuentas de menos de 24 h', () => {
    const recent = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(accountWithinFirstSessionGrace(recent)).toBe(true);
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(accountWithinFirstSessionGrace(old)).toBe(false);
  });

  it('FIRST_SESSION_GRACE_MS exportado para paridad con backend', () => {
    expect(FIRST_SESSION_GRACE_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('canAttemptChatAccess true con suscripción usable', async () => {
    paymentService.getSubscriptionStatus.mockResolvedValue({
      success: true,
      hasSubscription: true,
      status: 'premium',
      isActive: true,
    });
    paymentService.getTrialInfo.mockResolvedValue({ success: true, isInTrial: false });
    expect(subscriptionLooksCurrentlyUsable(await paymentService.getSubscriptionStatus())).toBe(true);
    await expect(canAttemptChatAccess({ createdAt: new Date(0) })).resolves.toBe(true);
  });

  it('canAttemptChatAccess true en gracia de primera sesión sin suscripción', async () => {
    paymentService.getSubscriptionStatus.mockResolvedValue({
      success: true,
      hasSubscription: false,
      isActive: false,
      status: 'free',
    });
    paymentService.getTrialInfo.mockResolvedValue({ success: true, isInTrial: false });
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await expect(canAttemptChatAccess({ createdAt: recent })).resolves.toBe(true);
  });

  it('canAttemptChatAccess false sin trial, suscripción ni gracia', async () => {
    paymentService.getSubscriptionStatus.mockResolvedValue({
      success: true,
      hasSubscription: false,
      isActive: false,
      status: 'expired',
    });
    paymentService.getTrialInfo.mockResolvedValue({ success: true, isInTrial: false });
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    await expect(canAttemptChatAccess({ createdAt: old })).resolves.toBe(false);
  });
});
