import { describe, expect, it } from '@jest/globals';
import { resolveBillingProvider } from '../../../utils/subscriptionBillingProvider.js';

describe('resolveBillingProvider', () => {
  const now = new Date('2026-07-21T12:00:00.000Z');

  it('prioriza Mercado Pago cuando hay preapproval', () => {
    expect(
      resolveBillingProvider(
        { mercadopagoSubscriptionId: 'pre_123', status: 'active' },
        { status: 'premium' },
        now,
      ),
    ).toBe('mercadopago');
  });

  it('detecta Apple solo con metadata explícita', () => {
    expect(
      resolveBillingProvider(
        {
          status: 'active',
          metadata: { appleOriginalTransactionId: '1000000123' },
        },
        { status: 'premium' },
        now,
      ),
    ).toBe('apple');
  });

  it('detecta trial vigente sin pago', () => {
    expect(
      resolveBillingProvider(
        null,
        {
          status: 'trial',
          trialEndDate: new Date('2026-07-25T00:00:00.000Z'),
        },
        now,
      ),
    ).toBe('trial');
  });

  it('trata premium User sin MP ni Apple como unknown', () => {
    expect(
      resolveBillingProvider(
        null,
        {
          status: 'premium',
          subscriptionEndDate: new Date('2026-08-01T00:00:00.000Z'),
        },
        now,
      ),
    ).toBe('unknown');
  });

  it('no marca apple por status active sin evidencia', () => {
    expect(
      resolveBillingProvider({ status: 'active', metadata: {} }, { status: 'premium' }, now),
    ).toBe('unknown');
  });

  it('devuelve none sin acceso activo', () => {
    expect(resolveBillingProvider(null, { status: 'free' }, now)).toBe('none');
  });
});
