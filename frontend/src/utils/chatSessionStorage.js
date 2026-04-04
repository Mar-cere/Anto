/**
 * Persistencia local del chat (AsyncStorage). Centralizado para evitar IDs de
 * conversación de un usuario/sesión mezclados con otro tras login/logout.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearChatEntryBackTarget } from './chatEntryContext';

export const CHAT_SESSION_KEYS = {
  CONVERSATION_ID: 'currentConversationId',
  MESSAGES: 'chatMessages',
};

export async function clearPersistedChatSession() {
  try {
    await clearChatEntryBackTarget();
    await AsyncStorage.multiRemove([CHAT_SESSION_KEYS.CONVERSATION_ID, CHAT_SESSION_KEYS.MESSAGES]);
  } catch (e) {
    console.warn('[chatSessionStorage] Error limpiando sesión de chat:', e?.message);
  }
}
