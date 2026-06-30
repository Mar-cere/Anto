/**
 * Extras de cliente para un turno de chat en modo crisis (protocolo v1 + check-in suave #19).
 */
import Conversation from '../models/Conversation.js';
import {
  buildProposedEmergencyContactAlert,
} from './crisisContactAlertOfferService.js';
import emergencyAlertService from './emergencyAlertService.js';
import { crisisResourcesForTurn } from './crisisResourcesService.js';
import {
  evaluateCrisisProtocolTurn,
  hasCrisisBatterySignal,
  normalizeCrisisProtocolState,
  recordCrisisProtocolExit,
} from './crisisProtocolService.js';
import {
  dismissSoftCrisisCheckInState,
  evaluateSoftCrisisCheckInTurn,
  normalizeSoftCrisisCheckInState,
  recordSoftCrisisCheckInExit,
} from './softCrisisCheckInService.js';

function shouldSkipContactAlertOffer(protocolState) {
  const protocol = normalizeCrisisProtocolState(protocolState);
  return (
    protocol.hadContactAlert === true ||
    protocol.contactAlertOfferDismissed === true
  );
}

/**
 * Persiste protocolo/check-in suave y arma payload cliente (recursos + oferta MEDIUM).
 */
export async function applyCrisisProtocolForTurn({
  conversation,
  userId,
  user = null,
  riskLevel,
  messageContent,
  contextualAnalysis,
  trendAnalysis,
  crisisHistory,
  conversationContext,
  hardStop = false,
  isCrisis = false,
  hadContactAlert = false,
  language = 'es',
  preferences = null,
  phone = null,
}) {
  const { crisisDecision, crisisProtocolState, crisisProtocolExit } = evaluateCrisisProtocolTurn({
    previousState: conversation?.crisisProtocolState,
    riskLevel,
    messageContent,
    contextualAnalysis,
    trendAnalysis,
    crisisHistory,
    conversationContext,
    hardStop,
    isCrisis,
    hadContactAlert,
  });

  const protocolWasActive = normalizeCrisisProtocolState(conversation?.crisisProtocolState).active;
  const protocolEntering = crisisProtocolState.active === true && !protocolWasActive;
  const batterySignal = hasCrisisBatterySignal(messageContent, crisisDecision);

  const softCheckInResult = evaluateSoftCrisisCheckInTurn({
    previousState: conversation?.softCrisisCheckInState,
    riskLevel,
    messageContent,
    crisisDecision,
    hardStop,
    crisisProtocolEntering: protocolEntering || crisisProtocolState.active === true,
    crisisProtocolActive: crisisProtocolState.active === true,
    language,
    preferences,
    phone,
  });

  let nextProtocolState = crisisProtocolState;
  let proposedEmergencyContactAlert = null;

  const skipOffer = shouldSkipContactAlertOffer(crisisProtocolState);
  if (crisisDecision.shouldOfferContactAlert && !skipOffer && crisisProtocolState.active) {
    const contacts =
      user?.emergencyContacts ||
      (await emergencyAlertService.getEmergencyContacts(userId));
    proposedEmergencyContactAlert = buildProposedEmergencyContactAlert({
      crisisDecision,
      contacts,
      language,
      existingPendingOfferId: crisisProtocolState.pendingContactAlertOfferId,
    });
    if (proposedEmergencyContactAlert?.id) {
      nextProtocolState = {
        ...crisisProtocolState,
        pendingContactAlertOfferId: proposedEmergencyContactAlert.id,
      };
    }
  }

  if (conversation?._id) {
    await Conversation.findByIdAndUpdate(conversation._id, {
      crisisProtocolState: nextProtocolState,
      softCrisisCheckInState: softCheckInResult.softCrisisCheckInState,
    }).catch(() => {});
  }

  if (crisisProtocolExit) {
    await recordCrisisProtocolExit(userId, conversation?._id, crisisProtocolExit);
  }

  if (softCheckInResult.softCrisisCheckInExit) {
    await recordSoftCrisisCheckInExit(
      userId,
      conversation?._id,
      softCheckInResult.softCrisisCheckInExit,
    );
  }

  const showContactAlertNotice =
    nextProtocolState.hadContactAlert === true || hadContactAlert === true;

  const crisisResources = crisisResourcesForTurn({
    riskLevel,
    hardStop,
    isCrisis,
    hasBatterySignal: batterySignal,
    crisisProtocolActive: nextProtocolState.active === true,
    preferences,
    phone,
    language,
    showContactAlertNotice,
  });

  const softCrisisCheckIn =
    crisisResources != null ? null : softCheckInResult.softCrisisCheckIn;

  return {
    crisisDecision,
    crisisProtocolState: nextProtocolState,
    crisisProtocolExit,
    crisisResources,
    proposedEmergencyContactAlert,
    softCrisisCheckIn,
    softCrisisCheckInState: softCheckInResult.softCrisisCheckInState,
    softCrisisCheckInExit: softCheckInResult.softCrisisCheckInExit,
  };
}

export async function markConversationContactAlertSent(conversationId) {
  if (!conversationId) return;
  await Conversation.findByIdAndUpdate(conversationId, {
    'crisisProtocolState.hadContactAlert': true,
    'crisisProtocolState.pendingContactAlertOfferId': null,
    'crisisProtocolState.contactAlertOfferDismissed': false,
  }).catch(() => {});
}

export async function dismissContactAlertOffer(conversationId, userId) {
  if (!conversationId || !userId) {
    return { ok: false, status: 400, code: 'invalid_request' };
  }
  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
  }).select('crisisProtocolState userId');
  if (!conversation) {
    return { ok: false, status: 404, code: 'conversation_not_found' };
  }
  const protocol = normalizeCrisisProtocolState(conversation.crisisProtocolState);
  if (!protocol.active) {
    return { ok: false, status: 409, code: 'protocol_not_active' };
  }
  await Conversation.findByIdAndUpdate(conversationId, {
    'crisisProtocolState.contactAlertOfferDismissed': true,
    'crisisProtocolState.pendingContactAlertOfferId': null,
  }).catch(() => {});
  return { ok: true };
}

export async function dismissSoftCrisisCheckInForConversation(conversationId, userId) {
  if (!conversationId || !userId) {
    return { ok: false, status: 400, code: 'invalid_request' };
  }
  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
  }).select('softCrisisCheckInState userId');
  if (!conversation) {
    return { ok: false, status: 404, code: 'conversation_not_found' };
  }
  const checkIn = normalizeSoftCrisisCheckInState(conversation.softCrisisCheckInState);
  if (!checkIn.active) {
    return { ok: false, status: 409, code: 'soft_check_in_not_active' };
  }
  await Conversation.findByIdAndUpdate(conversationId, {
    softCrisisCheckInState: dismissSoftCrisisCheckInState(checkIn),
  }).catch(() => {});
  return { ok: true };
}

export default {
  applyCrisisProtocolForTurn,
  markConversationContactAlertSent,
  dismissContactAlertOffer,
  dismissSoftCrisisCheckInForConversation,
};
