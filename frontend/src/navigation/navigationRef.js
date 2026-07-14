/**
 * Ref global del NavigationContainer para abrir pantallas desde push / enlaces.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';

import { getResetToMainTabsWithChatState } from './navigationHelpers';
import { shouldOpenActivitySummaryFromUrl } from './deepLinkUtils';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';
import { recordSessionStarted } from '../services/sessionTelemetryService';

export const navigationRef = createNavigationContainerRef();

let lastOpenChatDedupeKey = '';
let lastOpenChatDedupeAt = 0;
const OPEN_CHAT_DEDUPE_MS = 4000;
const MAX_SESSION_RESPONSE_LATENCY_MS = 3600000;

/**
 * Abre Chat desde una notificación de sesión programada (#15).
 * Usa navigationRef (no useNavigation): funciona desde AppNavigator / cold start.
 */
async function openScheduledSessionFromNotification(data) {
  const sessionId =
    typeof data.sessionId === 'string' ? data.sessionId.trim() : '';
  if (!sessionId) return;

  let notificationTime = Date.now();
  if (typeof data.timestamp === 'string') {
    const parsedTime = new Date(data.timestamp).getTime();
    if (!Number.isNaN(parsedTime) && Number.isFinite(parsedTime)) {
      notificationTime = parsedTime;
    }
  }

  const responseLatency = Math.max(0, Date.now() - notificationTime);
  const sanitizedLatency =
    responseLatency > MAX_SESSION_RESPONSE_LATENCY_MS
      ? MAX_SESSION_RESPONSE_LATENCY_MS
      : responseLatency;

  try {
    await recordSessionStarted(sessionId, {
      responseLatency: sanitizedLatency,
      platform: typeof Platform.OS === 'string' ? Platform.OS : 'unknown',
    });
  } catch (telemetryError) {
    console.warn(
      '[navigationRef] Telemetry scheduled_session failed (non-blocking):',
      telemetryError?.message || telemetryError,
    );
  }

  const chatParams = {
    scheduledSessionId: sessionId,
    source: 'scheduled_session_notification',
    responseLatency: sanitizedLatency,
  };

  const tryOpenChat = async () => {
    if (!navigationRef.isReady()) return false;
    try {
      await setChatEntryBackTarget('dash');
      navigationRef.reset(getResetToMainTabsWithChatState({ chatParams }));
      return true;
    } catch (e) {
      console.warn('[navigationRef] reset scheduled_session Chat:', e?.message || e);
      return false;
    }
  };

  if (!(await tryOpenChat())) {
    setTimeout(() => void tryOpenChat(), 400);
    setTimeout(() => void tryOpenChat(), 1500);
  }
}

/** Abre el tab Chat; opcionalmente fija la conversación en almacenamiento local. */
export async function handleNotificationData(data) {
  if (!data || typeof data !== 'object') return;

  if (data.type === 'scheduled_session') {
    await openScheduledSessionFromNotification(data);
    return;
  }

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
    }
    return false;
  };

  if (!(await tryOpenChat())) {
    setTimeout(() => void tryOpenChat(), 400);
    setTimeout(() => void tryOpenChat(), 1500);
  }
}

const ACTIVITY_SUMMARY_ROUTE = 'ActivitySummary';

/** Navega al resumen semanal/mensual cuando el enlace es anto://… (correo, CTA). */
export function handleActivitySummaryDeepLink(url) {
  if (!shouldOpenActivitySummaryFromUrl(url)) return;

  const tryNav = () => {
    if (!navigationRef.isReady()) return false;
    try {
      navigationRef.navigate(ACTIVITY_SUMMARY_ROUTE);
      return true;
    } catch (e) {
      console.warn('[navigationRef] navigate ActivitySummary:', e?.message || e);
      return false;
    }
  };

  if (!tryNav()) {
    setTimeout(() => void tryNav(), 400);
    setTimeout(() => void tryNav(), 1500);
  }
}
