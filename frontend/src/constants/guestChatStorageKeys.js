/**
 * Claves AsyncStorage del modo invitado (sin dependencias de React Native UI).
 * Usado por chatService en tests Node sin mockear Dimensions.
 */
export const GUEST_CHAT_STORAGE_KEYS = {
  CHAT_MODE: 'chatMode',
  GUEST_TOKEN: 'guestChatToken',
  GUEST_CONVERSATION_ID: 'guestConversationId',
  /** Tras login: resumen opcional del chat invitado para el primer mensaje con cuenta */
  GUEST_HANDOFF_PENDING: 'guestHandoffPending',
};
