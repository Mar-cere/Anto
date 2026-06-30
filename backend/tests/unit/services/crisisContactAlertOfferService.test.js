/**
 * Tests unitarios para oferta/confirmación de alerta MEDIUM (protocolo v1).
 */
import { describe, expect, it } from '@jest/globals';
import {
  buildProposedEmergencyContactAlert,
  isValidEmergencyContactAlertOfferId,
  validateContactAlertOfferConfirmation,
} from '../../../services/crisisContactAlertOfferService.js';

describe('crisisContactAlertOfferService', () => {
  const baseConversation = {
    userId: '507f1f77bcf86cd799439011',
    crisisProtocolState: {
      active: true,
      hadContactAlert: false,
      pendingContactAlertOfferId: 'offer-abc12345',
      contactAlertOfferDismissed: false,
    },
  };

  it('isValidEmergencyContactAlertOfferId acepta UUID', () => {
    expect(isValidEmergencyContactAlertOfferId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidEmergencyContactAlertOfferId('short')).toBe(false);
  });

  it('validateContactAlertOfferConfirmation exige protocolo activo y offerId coincidente', () => {
    expect(
      validateContactAlertOfferConfirmation({
        offerId: 'offer-abc12345',
        conversation: baseConversation,
        userId: '507f1f77bcf86cd799439011',
      }).ok,
    ).toBe(true);

    expect(
      validateContactAlertOfferConfirmation({
        offerId: 'offer-otro-id9',
        conversation: baseConversation,
        userId: '507f1f77bcf86cd799439011',
      }),
    ).toMatchObject({ ok: false, code: 'offer_mismatch' });

    expect(
      validateContactAlertOfferConfirmation({
        offerId: 'offer-abc12345',
        conversation: {
          ...baseConversation,
          crisisProtocolState: { ...baseConversation.crisisProtocolState, active: false },
        },
        userId: '507f1f77bcf86cd799439011',
      }),
    ).toMatchObject({ ok: false, code: 'protocol_not_active' });

    expect(
      validateContactAlertOfferConfirmation({
        offerId: 'offer-abc12345',
        conversation: baseConversation,
        userId: '507f1f77bcf86cd799439099',
      }),
    ).toMatchObject({ ok: false, code: 'conversation_forbidden' });
  });

  it('buildProposedEmergencyContactAlert reutiliza pendingOfferId', () => {
    const offer = buildProposedEmergencyContactAlert({
      crisisDecision: { shouldOfferContactAlert: true },
      contacts: [{ name: 'Ana', phone: '+56911111111', enabled: true }],
      existingPendingOfferId: 'offer-pending1',
    });
    expect(offer?.id).toBe('offer-pending1');
    expect(offer?.message).toMatch(/Ana|avise/i);
  });

  it('buildProposedEmergencyContactAlert retorna null sin contactos habilitados', () => {
    expect(
      buildProposedEmergencyContactAlert({
        crisisDecision: { shouldOfferContactAlert: true },
        contacts: [{ name: 'Ana', phone: '+56911111111', enabled: false }],
      }),
    ).toBeNull();
  });
});
