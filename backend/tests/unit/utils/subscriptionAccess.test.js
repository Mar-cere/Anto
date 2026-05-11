/**
 * Tests unitarios para interpretSubscriptionAccess
 */
import { describe, it, expect } from '@jest/globals';
import { interpretSubscriptionAccess } from '../../../utils/subscriptionAccess.js';

describe('subscriptionAccess', () => {
  describe('interpretSubscriptionAccess', () => {
    it('deniega estados terminales aunque vengan flags sueltos', () => {
      const r = interpretSubscriptionAccess(
        { status: 'expired', isActive: true, hasSubscription: true },
        true,
      );
      expect(r.allowed).toBe(false);
    });

    it('permite premium con fecha de fin futura', () => {
      const end = new Date(Date.now() + 86400000);
      const r = interpretSubscriptionAccess(
        {
          status: 'premium',
          subscriptionEndDate: end,
          isActive: true,
        },
        true,
      );
      expect(r.allowed).toBe(true);
      expect(r.isActive).toBe(true);
    });

    it('permite trial User con trialEndDate futura', () => {
      const end = new Date(Date.now() + 86400000);
      const r = interpretSubscriptionAccess(
        {
          status: 'trial',
          trialEndDate: end,
        },
        true,
      );
      expect(r.allowed).toBe(true);
      expect(r.isInTrial).toBe(true);
    });

    it('permite cuando el servicio marca isActive true (Mercado Pago)', () => {
      const r = interpretSubscriptionAccess(
        {
          status: 'active',
          isActive: true,
          subscriptionEndDate: new Date(Date.now() + 86400000),
        },
        true,
      );
      expect(r.allowed).toBe(true);
    });

    it('deniega active con isActive false (periodo vencido en servicio)', () => {
      const r = interpretSubscriptionAccess(
        {
          status: 'active',
          isActive: false,
          subscriptionEndDate: new Date(Date.now() - 86400000),
        },
        true,
      );
      expect(r.allowed).toBe(false);
    });
  });
});
