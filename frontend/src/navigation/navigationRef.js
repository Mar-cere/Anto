/**
 * Ref global del NavigationContainer para abrir pantallas desde push / enlaces.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNavigationContainerRef } from '@react-navigation/native';

import { getResetToMainTabsWithChatState } from './navigationHelpers';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';

export const navigationRef = createNavigationContainerRef();

let lastOpenChatDedupeKey = '';
let lastOpenChatDedupeAt = 0;
const OPEN_CHAT_DEDUPE_MS = 4000;

/** Abre el tab Chat; opcionalmente fija la conversación en almacenamiento local. */
export async function handleNotificationData(data) {
  if (!data || typeof data !== 'object') return;

  const action = data.action;
  if (action !== 'open_chat') return;

  const rawIdEarly = data.conversationId;
  const dedupeKey = `${rawIdEarly ?? ''}`;
  const now = Date.now();
  if (dedupeKey === lastOpenChatDedupeKey && now - lastOpenChatDedupeAt < OPEN_CHAT_DEDUPE_MS) {
    return;
  }
  lastOpenChatDedupeKey = dedupeKey;
  lastOpenChatDedupeAt = now;

  const rawId = rawIdEarly;
  if (rawId != null && rawId !== '') {
    try {
      await AsyncStorage.setItem('currentConversationId', String(rawId));
    } catch (_) {
      /* ignore */
    }
  }

  const tryOpenChat = async () => {
    if (!navigationRef.isReady()) return false;
    try {
      await setChatEntryBackTarget('dash');
      navigationRef.reset(getResetToMainTabsWithChatState());
      return true;
    } catch (e) {
      console.warn('[navigationRef] reset MainTabs/Chat:', e?.message || e);
      return false;
    }
  };

  if (!(await tryOpenChat())) {
    setTimeout(() => void tryOpenChat(), 400);
    setTimeout(() => void tryOpenChat(), 1500);
  }
}
