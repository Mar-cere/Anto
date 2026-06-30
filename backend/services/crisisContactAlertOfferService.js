/**
 * Oferta de alerta a contactos en MEDIUM (protocolo v1, opción C híbrida).
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getCrisisProtocolCopy } from '../constants/crisisProtocolCopy.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { normalizeCrisisProtocolState } from './crisisProtocolService.js';
import emergencyAlertService from './emergencyAlertService.js';

const OFFER_ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;

export function isValidEmergencyContactAlertOfferId(id) {
  return typeof id === 'string' && OFFER_ID_PATTERN.test(id);
}

export function isValidConversationIdForOffer(conversationId) {
  if (!conversationId) return false;
  return mongoose.Types.ObjectId.isValid(String(conversationId));
}

/**
 * Valida confirmación de oferta MEDIUM antes de enviar alertas.
 * @returns {{ ok: true } | { ok: false, status: number, code: string }}
 */
export function validateContactAlertOfferConfirmation({
  offerId,
  conversation,
  userId,
} = {}) {
  if (!isValidEmergencyContactAlertOfferId(offerId)) {
    return { ok: false, status: 400, code: 'invalid_offer_id' };
  }
  if (!conversation || !userId) {
    return { ok: false, status: 404, code: 'conversation_not_found' };
  }
  if (String(conversation.userId) !== String(userId)) {
    return { ok: false, status: 403, code: 'conversation_forbidden' };
  }

  const protocol = normalizeCrisisProtocolState(conversation.crisisProtocolState);
  if (!protocol.active) {
    return { ok: false, status: 409, code: 'protocol_not_active' };
  }
  if (protocol.hadContactAlert) {
    return { ok: false, status: 409, code: 'alert_already_sent' };
  }
  if (protocol.contactAlertOfferDismissed) {
    return { ok: false, status: 409, code: 'offer_dismissed' };
  }
  if (!protocol.pendingContactAlertOfferId) {
    return { ok: false, status: 409, code: 'no_pending_offer' };
  }
  if (String(protocol.pendingContactAlertOfferId) !== String(offerId)) {
    return { ok: false, status: 409, code: 'offer_mismatch' };
  }

  return { ok: true };
}

export function buildProposedEmergencyContactAlert({
  crisisDecision,
  contacts = [],
  language = 'es',
  existingPendingOfferId = null,
} = {}) {
  if (!crisisDecision?.shouldOfferContactAlert) return null;
  const enabled = (contacts || []).filter((c) => c && c.enabled !== false && c.phone);
  if (enabled.length === 0) return null;

  const lang = normalizeApiLanguage(language);
  const copy = getCrisisProtocolCopy(lang);
  const preview = enabled.slice(0, 3).map((c) => ({
    contactId: c._id ? String(c._id) : c.contactId || null,
    name: String(c.name || c.label || '').trim().slice(0, 80) || (lang === 'en' ? 'Contact' : 'Contacto'),
  }));

  const firstName = preview[0]?.name;
  const message =
    enabled.length === 1
      ? copy.offerContactAlert(firstName)
      : copy.offerContactAlertMulti(enabled.length);

  const offerId =
    existingPendingOfferId && isValidEmergencyContactAlertOfferId(existingPendingOfferId)
      ? String(existingPendingOfferId)
      : crypto.randomUUID();

  return {
    id: offerId,
    type: 'propose_emergency_contact_alert',
    contactCount: enabled.length,
    contactPreview: preview,
    message,
    riskLevel: 'MEDIUM',
  };
}

export async function confirmEmergencyContactAlertFromChat(userId, {
  riskLevel = 'MEDIUM',
  messageContent = null,
  trendAnalysis = null,
  metadata = null,
} = {}) {
  return emergencyAlertService.sendEmergencyAlerts(userId, riskLevel, messageContent, {
    trendAnalysis,
    metadata: {
      ...metadata,
      source: 'chat_offer_confirmed',
    },
  });
}

export default {
  buildProposedEmergencyContactAlert,
  isValidEmergencyContactAlertOfferId,
  isValidConversationIdForOffer,
  validateContactAlertOfferConfirmation,
  confirmEmergencyContactAlertFromChat,
};
