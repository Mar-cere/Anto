/**
 * Oferta de alerta a contactos en MEDIUM (protocolo v1, opción C híbrida).
 */
import crypto from 'crypto';
import { getCrisisProtocolCopy } from '../constants/crisisProtocolCopy.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import emergencyAlertService from './emergencyAlertService.js';

const OFFER_ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;

export function buildProposedEmergencyContactAlert({
  crisisDecision,
  contacts = [],
  language = 'es',
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

  return {
    id: crypto.randomUUID(),
    type: 'propose_emergency_contact_alert',
    contactCount: enabled.length,
    contactPreview: preview,
    message,
    riskLevel: 'MEDIUM',
  };
}

export function isValidEmergencyContactAlertOfferId(id) {
  return typeof id === 'string' && OFFER_ID_PATTERN.test(id);
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
  confirmEmergencyContactAlertFromChat,
};
