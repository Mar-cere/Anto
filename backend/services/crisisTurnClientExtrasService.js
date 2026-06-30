/**
 * Extras de cliente para un turno de chat en modo crisis (protocolo v1).
 */
import Conversation from '../models/Conversation.js';
import {
  buildProposedEmergencyContactAlert,
} from './crisisContactAlertOfferService.js';
import emergencyAlertService from './emergencyAlertService.js';
import { crisisResourcesForTurn } from './crisisResourcesService.js';
import {
  evaluateCrisisProtocolTurn,
  recordCrisisProtocolExit,
} from './crisisProtocolService.js';

/**
 * Persiste protocolo y arma payload cliente (recursos + oferta MEDIUM).
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

  if (conversation?._id) {
    await Conversation.findByIdAndUpdate(conversation._id, {
      crisisProtocolState,
    }).catch(() => {});
  }

  if (crisisProtocolExit) {
    await recordCrisisProtocolExit(userId, conversation?._id, crisisProtocolExit);
  }

  const showContactAlertNotice =
    crisisProtocolState.hadContactAlert === true || hadContactAlert === true;

  const crisisResources = crisisResourcesForTurn({
    riskLevel,
    hardStop,
    isCrisis,
    preferences,
    phone,
    language,
    showContactAlertNotice,
  });

  let proposedEmergencyContactAlert = null;
  if (crisisDecision.shouldOfferContactAlert) {
    const contacts =
      user?.emergencyContacts ||
      (await emergencyAlertService.getEmergencyContacts(userId));
    proposedEmergencyContactAlert = buildProposedEmergencyContactAlert({
      crisisDecision,
      contacts,
      language,
    });
  }

  return {
    crisisDecision,
    crisisProtocolState,
    crisisProtocolExit,
    crisisResources,
    proposedEmergencyContactAlert,
  };
}

export async function markConversationContactAlertSent(conversationId) {
  if (!conversationId) return;
  await Conversation.findByIdAndUpdate(conversationId, {
    'crisisProtocolState.hadContactAlert': true,
  }).catch(() => {});
}

export default {
  applyCrisisProtocolForTurn,
  markConversationContactAlertSent,
};
