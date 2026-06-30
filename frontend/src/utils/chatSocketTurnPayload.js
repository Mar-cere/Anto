import { sanitizeProposedProductActions } from './sanitizeProposedProductActions';

/**
 * Normaliza message:received del socket al payload de onDone del chat (paridad SSE).
 */
export function normalizeChatSocketTurnPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { done: true, content: '', messageId: null };
  }
  return {
    done: true,
    messageId: raw.id ? String(raw.id) : null,
    content: raw.text ?? '',
    conversationId: raw.conversationId ? String(raw.conversationId) : null,
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
    suggestionsPersonalized: raw.suggestionsPersonalized === true,
    proposedProductActions: sanitizeProposedProductActions(raw.proposedProductActions),
    productActionStatus: raw.productActionStatus || null,
    tccLite: raw.tccLite ?? null,
    crisisResources: raw.crisisResources ?? null,
    proposedEmergencyContactAlert: raw.proposedEmergencyContactAlert ?? null,
    crisisHardStop: raw.crisisHardStop === true,
    transport: 'socket',
  };
}
