/**
 * Hook con la lógica de estado y efectos de la pantalla de chat.
 * Centraliza: mensajes, carga, envío, limpieza, scroll, trial, websocket y auth.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, AppState, InteractionManager, Platform, Vibration } from 'react-native';
import chatService from '../services/chatService';
import paymentService from '../services/paymentService';
import websocketService from '../services/websocketService';
import { useAuth } from '../context/AuthContext';
import { canAttemptChatAccess } from '../utils/chatAccessGate';
import { isSubscriptionRequiredError } from '../utils/subscriptionAccess';
import { useNetworkStatus } from './useNetworkStatus';
import { ROUTES } from '../constants/routes';
import {
  FADE_ANIMATION_DURATION,
  FADE_ANIMATION_TO_VALUE,
  GUEST_MAX_USER_MESSAGES,
  MESSAGE_ID_PREFIXES,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  SCROLL_THRESHOLD,
  STORAGE_KEYS,
  useChatTexts,
} from '../screens/chat/chatScreenConstants';
import { dispatchRootReset, getResetToMainTabsWithInicioState } from '../navigation/navigationHelpers';
import {
  clearChatEntryBackTarget,
  resolveChatBackTarget,
} from '../utils/chatEntryContext';
import {
  clearOfflinePendingMessage,
  getOfflinePendingMessage,
  setOfflinePendingMessage as setOfflinePendingMessageStorage,
} from '../services/chatOfflinePending';
import { captureChatError } from '../utils/sentry';
import { useToast } from '../context/ToastContext';
import { isValidSessionIntentionId } from '../constants/sessionIntention';
import { recordInterventionClicked, recordInterventionDismissed } from '../utils/recordInterventionCompleted';
import { CHAT_SESSION_KEYS } from '../utils/chatSessionStorage';
import {
  loadDismissedContinuityIds,
  persistDismissedContinuityId,
} from '../utils/tccContinuityDismissStorage';
import { newClientRequestId } from '../utils/clientRequestId';
import { isValidMongoObjectId24 } from '../utils/mongoId';
import { sanitizeProposedProductActions } from '../utils/sanitizeProposedProductActions';
import { sanitizeProposedCommitments } from '../utils/sanitizeProposedCommitments';
import { createSessionCommitment } from '../services/sessionCommitmentsService';
import { postCommitmentTelemetry } from '../utils/commitmentTelemetry';
import {
  parseGuestHandoffPendingFromStorage,
  parseUserIdFromUserDataStorage,
} from '../utils/safeStorageJson';
import signalsService from '../services/signalsService';
import useChatTypingTelemetry from './useChatTypingTelemetry';
import {
  finalizeLoadedChatMessages,
  pickChatWelcomeGreeting,
} from '../utils/chatWelcomeGreeting';
import { getAppLanguage } from '../config/api';
import {
  findLatestCrisisContextFromMessages,
  normalizeCrisisResourcesPayload,
} from '../utils/crisisResources';
import { normalizeSoftCrisisCheckInPayload } from '../utils/softCrisisCheckIn';
import { fetchCrisisResources } from '../services/crisisResourcesService';
import { updateSessionCommitment } from '../services/sessionCommitmentsService';
import userService from '../services/userService';
import {
  clearPendingTccLiteResume,
  peekPendingTccLiteResume,
  setPendingTccLiteResume,
} from '../utils/chatTccLiteResume';
import { countNonemptyUserTurns, hasNonemptyUserTurns } from '../utils/chatTurnUtils';
import { isGenericCommitmentLabel } from '../utils/commitmentDisplayCopy';
import {
  buildAssistantMetadataFromTurnPayload,
  resolveTccLiteAtHandoffFromPayload,
  shouldClearTccLiteHandoff,
} from '../utils/chatTccLiteClient';

/** Retroalimentación al recibir respuesta del asistente (háptica + vibración corta en Android). */
function hapticAssistantMessageReceived() {
  try {
    const p = Haptics.impactAsync(
      Platform.OS === 'android'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
    if (p && typeof p.then === 'function') p.catch(() => {});
  } catch (_) {
    /* continúa con vibración en Android */
  }
  if (Platform.OS === 'android') {
    try {
      // Refuerzo: en varios fabricantes el impacto háptico es casi imperceptible.
      if (typeof Vibration.vibrate === 'function') {
        Vibration.vibrate(45);
      }
    } catch (_) {}
  }
}

function extractErrorCode(errorLike) {
  const directErrorCode = String(errorLike?.errorCode || '').trim();
  if (directErrorCode) return directErrorCode.toUpperCase();

  const backendCode = String(errorLike?.response?.data?.code || '').trim();
  if (backendCode) return backendCode.toUpperCase();

  const directCode = String(errorLike?.code || '').trim();
  if (directCode) return directCode.toUpperCase();

  return '';
}

export function useChatScreen() {
  const TEXTS = useChatTexts();
  const textsRef = useRef(TEXTS);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingTelemetryEnabled, setTypingTelemetryEnabled] = useState(false);
  const typingTelemetry = useChatTypingTelemetry();
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [trialInfo, setTrialInfo] = useState(null);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  /** Modo invitado: mensajes restantes (null si no aplica) */
  const [guestQuota, setGuestQuota] = useState(null);
  /** Handoff invitado→cuenta: payload para modal (null = cerrado) */
  const [guestHandoffModal, setGuestHandoffModal] = useState(null);
  const guestHandoffUiShownRef = useRef(false);
  /** Un solo mensaje pendiente por falta de red o error de red */
  const [offlinePendingMessage, setOfflinePendingMessage] = useState(null);
  /** #72: intención de sesión antes del primer mensaje del usuario (solo cuenta registrada) */
  const [showSessionIntentionPrompt, setShowSessionIntentionPrompt] = useState(false);
  const [sessionIntentionSubmitting, setSessionIntentionSubmitting] = useState(false);
  const [tccContinuityItems, setTccContinuityItems] = useState([]);
  const [dismissedContinuityIds, setDismissedContinuityIds] = useState([]);
  const dismissedContinuityIdsRef = useRef([]);
  const [tccLiteAtHandoff, setTccLiteAtHandoff] = useState(null);
  const [crisisResourcesPanel, setCrisisResourcesPanel] = useState(null);
  const [softCrisisCheckInPanel, setSoftCrisisCheckInPanel] = useState(null);
  const [crisisContactAlertNotice, setCrisisContactAlertNotice] = useState(null);
  const [emergencyContactAlertConfirmingId, setEmergencyContactAlertConfirmingId] = useState(null);
  const crisisResourcesDismissedRef = useRef(false);
  const softCrisisCheckInDismissedRef = useRef(false);
  const pendingTccLiteResumeRef = useRef(null);
  // Señal #202: al abrir desde "retomar conversación", forzar el follow-up de
  // compromiso en el primer mensaje aunque el hilo ya tenga historial.
  const pendingResumeCommitmentFollowUpRef = useRef(false);
  /** Invalida respuestas en vuelo de loadTccContinuity (p. ej. tras borrar el chat). */
  const tccContinuityRequestIdRef = useRef(0);
  const handleSendRef = useRef(null);
  /** Evita doble POST / doble respuesta del asistente si el usuario envía dos veces muy rápido. */
  const sendRequestInFlightRef = useRef(false);
  const flushingOfflineRef = useRef(false);
  const prevIsOfflineRef = useRef(null);
  const historyPageRef = useRef(1);
  const activeStreamAbortRef = useRef(null);
  const streamAbortControllerRef = useRef(null);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState(false);
  /** Evita bucles de reintento silencioso ante STREAM_INCOMPLETE. */
  const streamIncompleteRetryStateRef = useRef({
    key: null,
    count: 0,
    windowStart: 0,
  });
  /** Ref sincronizado con `messages` para programar resumen al salir / background sin cierre obsoleto. */
  const messagesRef = useRef(messages);
  const lastSessionSummaryScheduleAtRef = useRef(0);
  /** Turnos de usuario al abrir el chat en esta visita (no todo el historial). */
  const userTurnBaselineRef = useRef(0);
  const captureVisitBaselineRef = useRef(true);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  /** Si el usuario está cerca del final; solo auto-scroll cuando es true (evita saltar si leyó arriba). */
  const stickToBottomRef = useRef(true);
  /** Ref estable para callbacks (socket / init) que no deben depender del cierre sobre `scrollToBottom`. */
  const scrollToBottomStableRef = useRef(null);
  const contentSizeScrollTimerRef = useRef(null);

  useEffect(() => {
    textsRef.current = TEXTS;
  }, [TEXTS]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_IMMERSIVE_MODE);
        setImmersiveMode(raw === 'true');
      } catch (_) {
        setImmersiveMode(false);
      }
    })();
  }, []);

  const cancelActiveStream = useCallback(() => {
    activeStreamAbortRef.current?.();
    activeStreamAbortRef.current = null;
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = null;
  }, []);

  const applyMessagePagination = useCallback((pagination) => {
    if (!pagination || typeof pagination.page !== 'number' || typeof pagination.pages !== 'number') {
      setHistoryHasMore(false);
      return;
    }
    historyPageRef.current = pagination.page;
    setHistoryHasMore(pagination.page < pagination.pages);
  }, []);

  const toggleImmersiveMode = useCallback(async () => {
    const next = !immersiveMode;
    setImmersiveMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_IMMERSIVE_MODE, next ? 'true' : 'false');
    } catch (_) {
      /* noop */
    }
  }, [immersiveMode]);

  const scrollToBottom = useCallback((animated = true, options = {}) => {
    const force = options.force === true;
    const attempt = () => {
      if (!force && !stickToBottomRef.current) return;
      try {
        flatListRef.current?.scrollToEnd?.({ animated });
      } catch (_) {}
    };
    attempt();
    requestAnimationFrame(attempt);
    requestAnimationFrame(() => requestAnimationFrame(attempt));
    if (force) {
      InteractionManager.runAfterInteractions(() => {
        attempt();
        setTimeout(attempt, 120);
        setTimeout(attempt, 300);
      });
    } else {
      setTimeout(attempt, 72);
    }
  }, []);
  scrollToBottomStableRef.current = scrollToBottom;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const captureUserTurnBaseline = useCallback((messageList) => {
    userTurnBaselineRef.current = countNonemptyUserTurns(messageList);
    captureVisitBaselineRef.current = false;
  }, []);

  /** Best-effort: programa continuidad del último chat en servidor (#4 + #47). */
  const scheduleLastSessionSummaryDeferred = useCallback(async () => {
    const DEBOUNCE_MS = 20000;
    if (Date.now() - lastSessionSummaryScheduleAtRef.current < DEBOUNCE_MS) return;
    try {
      if (await chatService.isGuestChatMode()) return;
      const newUserTurns = Math.max(
        0,
        countNonemptyUserTurns(messagesRef.current) - userTurnBaselineRef.current,
      );
      if (newUserTurns < 1) return;
      const cid = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (!cid || !isValidMongoObjectId24(cid)) return;
      lastSessionSummaryScheduleAtRef.current = Date.now();
      await chatService.scheduleLastSessionSummary(cid);
    } catch (_) {
      /* silencioso: no bloquear UX */
    }
  }, []);

  useEffect(() => {
    const add = AppState?.addEventListener;
    if (typeof add !== 'function') return undefined;
    const sub = add.call(AppState, 'change', (next) => {
      if (next === 'active') return;
      void scheduleLastSessionSummaryDeferred();
    });
    return () => sub?.remove?.();
  }, [scheduleLastSessionSummaryDeferred]);

  const handleMessagesContentSizeChange = useCallback(() => {
    if (!stickToBottomRef.current) return;
    if (contentSizeScrollTimerRef.current) clearTimeout(contentSizeScrollTimerRef.current);
    contentSizeScrollTimerRef.current = setTimeout(() => {
      contentSizeScrollTimerRef.current = null;
      scrollToBottom(false, { force: false });
    }, 20);
  }, [scrollToBottom]);

  const handleMessagesListLayout = useCallback(() => {
    if (!stickToBottomRef.current) return;
    scrollToBottom(false, { force: false });
  }, [scrollToBottom]);

  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const fromEnd = contentSize.height - contentOffset.y - layoutMeasurement.height;
    stickToBottomRef.current = fromEnd <= SCROLL_THRESHOLD;
    setShowScrollButton(fromEnd > SCROLL_THRESHOLD);
  }, []);

  const loadTrialInfo = useCallback(async () => {
    try {
      const trialInfoResult = await paymentService.getTrialInfo();
      if (trialInfoResult.success && trialInfoResult.isInTrial) {
        setTrialInfo(trialInfoResult);
      } else {
        setTrialInfo(null);
      }
    } catch (err) {
      console.error('[ChatScreen] Error cargando info de trial:', err);
      setTrialInfo(null);
    }
  }, []);

  const handleTrialBannerDismiss = useCallback(() => {
    setTrialBannerDismissed(true);
  }, []);

  const applyCrisisResourcesFromTurn = useCallback((payload) => {
    const normalizedResources = normalizeCrisisResourcesPayload(payload?.crisisResources);
    const normalizedSoft = normalizeSoftCrisisCheckInPayload(payload?.softCrisisCheckIn);

    if (normalizedResources) {
      crisisResourcesDismissedRef.current = false;
      setCrisisResourcesPanel(normalizedResources);
      setSoftCrisisCheckInPanel(null);
      return;
    }

    if (normalizedSoft && !softCrisisCheckInDismissedRef.current) {
      softCrisisCheckInDismissedRef.current = false;
      setSoftCrisisCheckInPanel(normalizedSoft);
      setCrisisResourcesPanel(null);
      return;
    }

    if (!normalizedSoft) {
      setSoftCrisisCheckInPanel(null);
    }
  }, []);

  const dismissSoftCrisisCheckInPanel = useCallback(async () => {
    softCrisisCheckInDismissedRef.current = true;
    setSoftCrisisCheckInPanel(null);
    try {
      const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (!convId || !isValidMongoObjectId24(convId)) return;
      await userService.dismissSoftCrisisCheckInFromChat({ conversationId: convId });
    } catch (e) {
      console.warn('[useChatScreen] soft crisis check-in dismiss:', e?.message || e);
    }
  }, []);

  const handleOpenSoftCrisisTechnique = useCallback(
    (technique) => {
      if (!technique?.screen) return;
      navigation.navigate(technique.screen, technique.params || {});
    },
    [navigation],
  );

  const hydrateCrisisResourcesFromMessages = useCallback(async (messageList) => {
    if (crisisResourcesDismissedRef.current) return;
    const ctx = findLatestCrisisContextFromMessages(messageList);
    if (!ctx) {
      setCrisisResourcesPanel(null);
      return;
    }
    try {
      const fetched = await fetchCrisisResources();
      if (!fetched) return;
      setCrisisResourcesPanel({
        ...fetched,
        riskLevel: ctx.riskLevel || fetched.riskLevel,
        hardStop: ctx.hardStop === true,
      });
    } catch (_) {
      /* sin panel si falla la red */
    }
  }, []);

  const openCrisisResourcesPanel = useCallback(async () => {
    crisisResourcesDismissedRef.current = false;
    try {
      const fetched = await fetchCrisisResources();
      if (fetched) setCrisisResourcesPanel(fetched);
    } catch (_) {
      /* el usuario puede reintentar desde el menú */
    }
  }, []);

  const dismissCrisisResourcesPanel = useCallback(() => {
    crisisResourcesDismissedRef.current = true;
    setCrisisResourcesPanel(null);
  }, []);

  const openEmergencyContactsFromChat = useCallback(() => {
    navigation.navigate('MainTabs', { screen: 'Perfil' });
  }, [navigation]);

  const initializeConversation = useCallback(async () => {
    const texts = textsRef.current;
    const appLanguage = await getAppLanguage();
    const dedupeAndSetMessages = (serverMessages, sessionIntentionMeta, flags) => {
      const isRegistered = flags?.isRegistered === true;
      if (!serverMessages || serverMessages.length === 0) return false;
      const uniqueMessages = serverMessages.reduce((acc, message) => {
        const messageId = message._id || message.id;
        if (!messageId) {
          console.warn('[ChatScreen] Mensaje sin ID encontrado al inicializar:', message);
          return acc;
        }
        const exists = acc.some((msg) => msg._id === messageId || msg.id === messageId);
        if (!exists) acc.push(message);
        return acc;
      }, []);
      uniqueMessages.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
        return timeA - timeB;
      });
      setMessages(finalizeLoadedChatMessages(uniqueMessages, appLanguage));
      if (flags?.pagination) applyMessagePagination(flags.pagination);
      void hydrateCrisisResourcesFromMessages(uniqueMessages);
      if (flags?.captureVisitBaseline) {
        captureUserTurnBaseline(uniqueMessages);
      }
      if (isRegistered) {
        const userCount = uniqueMessages.filter((m) => m.type !== 'quickReplies' && m.role === MESSAGE_ROLES.USER).length;
        setShowSessionIntentionPrompt(userCount === 0 && !sessionIntentionMeta);
      } else {
        setShowSessionIntentionPrompt(false);
      }
      return true;
    };

    try {
      const silentReload = messagesRef.current.length > 0;
      if (!silentReload) {
        setIsLoading(true);
        historyPageRef.current = 1;
        setHistoryHasMore(false);
      }
      const userToken = await AsyncStorage.getItem('userToken');

      if (userToken) {
        setGuestQuota(null);
        const mayUseChat = await canAttemptChatAccess(user);
        if (!mayUseChat) {
          Alert.alert(texts.SUBSCRIPTION_REQUIRED_TITLE, texts.SUBSCRIPTION_REQUIRED_DEFAULT, [
            { text: texts.COMMON_CANCEL, style: 'cancel', onPress: () => navigation.goBack() },
            {
              text: texts.SUBSCRIPTION_VIEW_PLANS,
              onPress: () => navigation.navigate('Subscription'),
            },
          ]);
          setMessages([]);
          setShowSessionIntentionPrompt(false);
          return;
        }
        await chatService.initializeSocket();
        const paramOpenId = route.params?.openConversationId;
        if (paramOpenId && isValidMongoObjectId24(String(paramOpenId))) {
          const cidParam = String(paramOpenId);
          await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, cidParam);
          if (route.params?.resumeCommitmentFollowUp === true) {
            pendingResumeCommitmentFollowUpRef.current = true;
          }
          try {
            navigation.setParams({ openConversationId: undefined, resumeCommitmentFollowUp: undefined });
          } catch (_) {}
        }
        let conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        if (conversationId) {
          const pack = await chatService.getMessages(conversationId);
          if (
            dedupeAndSetMessages(pack.messages, pack.sessionIntention, {
              isRegistered: true,
              pagination: pack.pagination,
              captureVisitBaseline: captureVisitBaselineRef.current,
            })
          )
            return;
        }
        const idAfterFetch = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        if (!idAfterFetch) {
          await chatService.initializeSocket();
          conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
          if (conversationId) {
            const retryPack = await chatService.getMessages(conversationId);
            if (
              dedupeAndSetMessages(
                retryPack.messages,
                retryPack.sessionIntention,
                {
                  isRegistered: true,
                  pagination: retryPack.pagination,
                  captureVisitBaseline: captureVisitBaselineRef.current,
                },
              )
            )
              return;
          }
        }
        const welcomeMessage = {
          id: `${MESSAGE_ID_PREFIXES.WELCOME}-${Date.now()}`,
          content: pickChatWelcomeGreeting(appLanguage),
          role: MESSAGE_ROLES.ASSISTANT,
          type: MESSAGE_TYPES.TEXT,
          metadata: { timestamp: new Date().toISOString(), type: MESSAGE_TYPES.WELCOME },
        };
        setMessages([welcomeMessage]);
        if (captureVisitBaselineRef.current) captureUserTurnBaseline([]);
        setShowSessionIntentionPrompt(true);
        await chatService.saveMessages([welcomeMessage]);
        return;
      }

      navigation.reset({ index: 0, routes: [{ name: ROUTES.SIGN_IN }] });
      return;
    } catch (err) {
      if (err.guestAuthFailed) {
        setError(null);
        setGuestQuota(null);
        Alert.alert(texts.GUEST_SESSION_EXPIRED_TITLE, texts.GUEST_SESSION_EXPIRED_MESSAGE, [
          {
            text: texts.COMMON_OK,
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
        setMessages([]);
        setShowSessionIntentionPrompt(false);
        return;
      }
      if (extractErrorCode(err) === 'RATE_LIMIT') {
        setError(null);
        Alert.alert(texts.GUEST_RATE_LIMIT_TITLE, texts.GUEST_RATE_LIMIT_MESSAGE, [
          {
            text: texts.COMMON_OK,
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
        setMessages([]);
        setShowSessionIntentionPrompt(false);
        return;
      }
      if (isSubscriptionRequiredError(err) || extractErrorCode(err) === 'SUBSCRIPTION_REQUIRED') {
        setError(null);
        Alert.alert(texts.SUBSCRIPTION_REQUIRED_TITLE, texts.SUBSCRIPTION_REQUIRED_DEFAULT, [
          { text: texts.COMMON_CANCEL, style: 'cancel', onPress: () => navigation.goBack() },
          {
            text: texts.SUBSCRIPTION_VIEW_PLANS,
            onPress: () => navigation.navigate('Subscription'),
          },
        ]);
        setMessages([]);
        setShowSessionIntentionPrompt(false);
        return;
      }
      console.error('[ChatScreen] Error al inicializar chat:', err.message);
      setError(texts.NETWORK_ERROR_INIT);
    } finally {
      setIsLoading(false);
      stickToBottomRef.current = true;
      InteractionManager.runAfterInteractions(() => {
        scrollToBottomStableRef.current?.(false, { force: true });
      });
    }
  }, [
    navigation,
    route.params?.openConversationId,
    route.params?.resumeCommitmentFollowUp,
    user,
    applyMessagePagination,
    hydrateCrisisResourcesFromMessages,
    captureUserTurnBaseline,
  ]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlderMessages || !historyHasMore) return;
    if (await chatService.isGuestChatMode()) return;
    const cid = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
    if (!cid || !isValidMongoObjectId24(cid)) return;
    const nextPage = historyPageRef.current + 1;
    setLoadingOlderMessages(true);
    try {
      const appLanguage = await getAppLanguage();
      const pack = await chatService.getMessages(cid, { page: nextPage });
      const older = Array.isArray(pack.messages) ? pack.messages : [];
      if (!older.length) {
        setHistoryHasMore(false);
        return;
      }
      applyMessagePagination(pack.pagination);
      setMessages((prev) => {
        const merged = [...older, ...prev];
        const unique = merged.reduce((acc, message) => {
          const messageId = message._id || message.id;
          if (!messageId) return acc;
          const exists = acc.some((msg) => msg._id === messageId || msg.id === messageId);
          if (!exists) acc.push(message);
          return acc;
        }, []);
        unique.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
          const timeB = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
          return timeA - timeB;
        });
        return finalizeLoadedChatMessages(unique, appLanguage);
      });
      stickToBottomRef.current = false;
    } catch (_) {
      /* silencioso */
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [loadingOlderMessages, historyHasMore, applyMessagePagination]);

  const skipSessionIntention = useCallback(() => {
    setShowSessionIntentionPrompt(false);
  }, []);

  const selectSessionIntention = useCallback(
    async (intentionId) => {
      const texts = textsRef.current;
      if (!isValidSessionIntentionId(intentionId)) return;
      if (sessionIntentionSubmitting) return;
      if (await chatService.isGuestChatMode()) return;
      if (isOffline) {
        showToast({ message: texts.NETWORK_ERROR, type: 'warning' });
        return;
      }
      setSessionIntentionSubmitting(true);
      try {
        let cid = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        if (!cid) {
          await chatService.createConversation({ sessionIntention: intentionId });
          cid = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        } else {
          await chatService.setSessionIntention(cid, intentionId);
        }
        if (cid) {
          const pack = await chatService.getMessages(cid);
          const list = pack.messages || [];
          const uniqueMessages = list.reduce((acc, message) => {
            const messageId = message._id || message.id;
            if (!messageId) return acc;
            const exists = acc.some((msg) => msg._id === messageId || msg.id === messageId);
            if (!exists) acc.push(message);
            return acc;
          }, []);
          uniqueMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
            return timeA - timeB;
          });
          const lang = await getAppLanguage();
          setMessages(finalizeLoadedChatMessages(uniqueMessages, lang));
          stickToBottomRef.current = true;
          requestAnimationFrame(() => {
            scrollToBottomStableRef.current?.(false, { force: true });
          });
        }
        setShowSessionIntentionPrompt(false);
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (_) {}
      } catch (e) {
        console.warn('[useChatScreen] sessionIntention:', e?.message || e);
        showToast({
          message: texts.CONVERSATION_ERROR,
          type: 'error',
        });
      } finally {
        setSessionIntentionSubmitting(false);
      }
    },
    [isOffline, sessionIntentionSubmitting, showToast]
  );

  const handleProductProposalPress = useCallback(
    async (action, proposalsMessage) => {
      try {
        const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        const assistantMessageId = proposalsMessage?.metadata?.assistantMessageId;
        if (
          !convId ||
          !assistantMessageId ||
          !isValidMongoObjectId24(convId) ||
          !isValidMongoObjectId24(assistantMessageId)
        ) {
          return;
        }
        if (
          !action ||
          typeof action !== 'object' ||
          !action.draft ||
          typeof action.draft !== 'object' ||
          Array.isArray(action.draft)
        ) {
          return;
        }
        const origin = {
          conversationId: String(convId),
          sourceMessageId: String(assistantMessageId),
          source: 'chat_v1',
        };
        chatService
          .submitProductProposalFeedback(convId, 'accepted')
          .catch((e) => console.warn('[useChatScreen] proposal accepted feedback:', e?.message || e));
        if (action?.type === 'propose_task' && action.draft) {
          navigation.navigate('Tasks', {
            mode: 'create',
            initialTaskDraft: action.draft,
            taskChatOrigin: origin,
            taskClientRequestId: newClientRequestId(),
          });
        } else if (action?.type === 'propose_habit' && action.draft) {
          navigation.navigate('Tasks', {
            tab: 'habits',
            chatHabitDraft: action.draft,
            habitChatOrigin: origin,
            habitClientRequestId: newClientRequestId(),
          });
        }
      } catch (e) {
        console.warn('[useChatScreen] product proposal:', e?.message || e);
      }
    },
    [navigation]
  );

  const handleCommitmentFollowUpAnswer = useCallback(async (commitmentId, answer, followUpMessage) => {
    if (!commitmentId) return;
    // Optimista: quitar el bloque de chips de inmediato (#202).
    setMessages((prev) =>
      prev.filter((m) => {
        if (m.type !== 'commitment_follow_up') return true;
        const id = m.id || m._id;
        const targetId = followUpMessage?.id || followUpMessage?._id;
        if (targetId) return String(id) !== String(targetId);
        return m.commitmentFollowUp?.id !== commitmentId;
      }),
    );
    try {
      await updateSessionCommitment(commitmentId, { followUpAnswer: answer });
    } catch (e) {
      console.warn('[useChatScreen] commitment follow-up answer:', e?.message || e);
    }
  }, []);

  const handleProductProposalReject = useCallback(async (proposalsMessage) => {
    try {
      const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (!convId || !isValidMongoObjectId24(convId)) return;
      await chatService.submitProductProposalFeedback(convId, 'rejected');
      setMessages((prev) =>
        prev.filter((m) => {
          const id = m.id || m._id;
          const targetId = proposalsMessage?.id || proposalsMessage?._id;
          return String(id) !== String(targetId);
        })
      );
    } catch (e) {
      console.warn('[useChatScreen] proposal rejected feedback:', e?.message || e);
    }
  }, []);

  const handleCommitmentProposalPress = useCallback(
    async (proposal, proposalsMessage) => {
      try {
        const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        const assistantMessageId = proposalsMessage?.metadata?.assistantMessageId;
        const label = String(proposal?.label || '').trim();
        if (!label || label.length < 2) return;
        await createSessionCommitment({
          label,
          conversationId:
            convId && isValidMongoObjectId24(convId) ? String(convId) : undefined,
          source: 'chat_proposed',
          sourceMeta: {
            ...(proposal?.sourceMeta && typeof proposal.sourceMeta === 'object'
              ? proposal.sourceMeta
              : {}),
            ...(assistantMessageId && isValidMongoObjectId24(assistantMessageId)
              ? { proposedMessageId: String(assistantMessageId) }
              : {}),
          },
        });
        setMessages((prev) =>
          prev.filter((m) => {
            const id = m.id || m._id;
            const targetId = proposalsMessage?.id || proposalsMessage?._id;
            return String(id) !== String(targetId);
          }),
        );
      } catch (e) {
        console.warn('[useChatScreen] commitment proposal:', e?.message || e);
      }
    },
    [],
  );

  const handleCommitmentProposalReject = useCallback(async (proposalsMessage) => {
    void postCommitmentTelemetry({ event: 'create_dismissed', surface: 'chat' });
    setMessages((prev) =>
      prev.filter((m) => {
        const id = m.id || m._id;
        const targetId = proposalsMessage?.id || proposalsMessage?._id;
        return String(id) !== String(targetId);
      }),
    );
  }, []);

  const handleEmergencyContactAlertConfirm = useCallback(async (offerMessage) => {
    const offer = offerMessage?.proposedEmergencyContactAlert;
    const offerKey = offerMessage?.id || offerMessage?._id || offer?.id;
    if (!offer?.id || emergencyContactAlertConfirmingId) return;
    try {
      const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (!convId || !isValidMongoObjectId24(convId)) return;
      setEmergencyContactAlertConfirmingId(String(offerKey));
      await userService.confirmEmergencyContactAlertFromChat({
        offerId: offer.id,
        conversationId: convId,
      });
      const texts = textsRef.current;
      setCrisisContactAlertNotice(texts.CRISIS_POST_CONTACT_ALERT_NOTICE);
      setMessages((prev) =>
        prev.filter((m) => {
          const id = m.id || m._id;
          const targetId = offerMessage?.id || offerMessage?._id;
          return String(id) !== String(targetId);
        }),
      );
    } catch (e) {
      console.warn('[useChatScreen] emergency contact alert confirm:', e?.message || e);
    } finally {
      setEmergencyContactAlertConfirmingId(null);
    }
  }, [emergencyContactAlertConfirmingId]);

  const handleEmergencyContactAlertReject = useCallback(async (offerMessage) => {
    setMessages((prev) =>
      prev.filter((m) => {
        const id = m.id || m._id;
        const targetId = offerMessage?.id || offerMessage?._id;
        return String(id) !== String(targetId);
      }),
    );
    try {
      const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (!convId || !isValidMongoObjectId24(convId)) return;
      await userService.dismissEmergencyContactAlertFromChat({ conversationId: convId });
    } catch (e) {
      console.warn('[useChatScreen] emergency contact alert dismiss:', e?.message || e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (await chatService.isGuestChatMode()) return;
        const consent = await signalsService.getSignalConsent();
        if (!cancelled) {
          setTypingTelemetryEnabled(consent?.typingTelemetry?.enabled === true);
        }
      } catch (_) {
        /* consent opcional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          if (await chatService.isGuestChatMode()) {
            if (!cancelled) setTypingTelemetryEnabled(false);
            return;
          }
          const consent = await signalsService.getSignalConsent();
          if (!cancelled) {
            setTypingTelemetryEnabled(consent?.typingTelemetry?.enabled === true);
          }
        } catch (_) {}
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleInputChange = useCallback(
    (text) => {
      if (typingTelemetryEnabled) typingTelemetry.trackChange(text);
      setInputText(text);
    },
    [typingTelemetryEnabled, typingTelemetry],
  );

  const handleSend = useCallback(async (presetText) => {
    const texts = textsRef.current;
    const messageText =
      typeof presetText === 'string' && presetText.trim() !== ''
        ? presetText.trim()
        : inputText.trim();
    if (messageText === '') return;
    setShowSessionIntentionPrompt(false);

    const isPresetMessage =
      typeof presetText === 'string' && presetText.trim() !== '' && presetText.trim() !== inputText.trim();

    if (typingTelemetryEnabled && !isPresetMessage) {
      const metrics = typingTelemetry.buildPayload();
      typingTelemetry.resetDraft();
      if (metrics && metrics.draftDurationMs >= 400) {
        void (async () => {
          try {
            const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
            await signalsService.submitTypingTelemetry({
              conversationId: convId,
              metrics,
            });
          } catch (_) {
            /* best-effort */
          }
        })();
      }
    } else if (isPresetMessage) {
      typingTelemetry.resetDraft();
    }

    if (isOffline) {
      try {
        await setOfflinePendingMessageStorage(messageText);
        setOfflinePendingMessage(messageText);
      } catch (_) {}
      setInputText('');
      return;
    }

    if (sendRequestInFlightRef.current) {
      return;
    }
    sendRequestInFlightRef.current = true;
    try {
      setInputText('');

      if (await chatService.isGuestChatMode()) {
        if (guestQuota !== null && guestQuota.remaining <= 0) {
          Alert.alert(texts.GUEST_LIMIT_TITLE, texts.GUEST_LIMIT_MESSAGE, [
            { text: texts.COMMON_CANCEL, style: 'cancel' },
            {
              text: texts.COMMON_CREATE_ACCOUNT,
              onPress: async () => {
                try {
                  await chatService.clearGuestChat();
                } catch (_) {}
                navigation.navigate(ROUTES.REGISTER);
              },
            },
            {
              text: texts.COMMON_SIGN_IN,
              onPress: async () => {
                try {
                  await chatService.clearGuestChat();
                } catch (_) {}
                navigation.navigate(ROUTES.SIGN_IN);
              },
            },
          ]);
          return;
        }
      }

      setIsTyping(true);

    const tempUserMessage = {
      id: `${MESSAGE_ID_PREFIXES.TEMP}-${Date.now()}`,
      content: messageText,
      role: MESSAGE_ROLES.USER,
      type: MESSAGE_TYPES.TEXT,
      metadata: { timestamp: new Date().toISOString(), pending: true },
    };

    const tempAssistantId = `${MESSAGE_ID_PREFIXES.TEMP}-assistant-${Date.now()}`;
    const tempAssistantMessage = {
      id: tempAssistantId,
      content: '',
      role: MESSAGE_ROLES.ASSISTANT,
      type: MESSAGE_TYPES.TEXT,
      metadata: { timestamp: new Date().toISOString(), streaming: true },
    };

    // Reducir fricción/perf: muchos "chunks" del streaming generan demasiados setState.
    // Acumulamos chunks y flusheamos a intervalos.
    let pendingChunk = '';
    let flushTimer = null;

    const flushPendingChunk = () => {
      if (!pendingChunk) return;
      const chunk = pendingChunk;
      pendingChunk = '';

      flushTimer = null;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        // Fast path: durante streaming el assistant temporal debería ser el último item.
        if (last?.id === tempAssistantId) {
          const updatedLast = { ...last, content: (last.content || '') + chunk };
          return [...prev.slice(0, -1), updatedLast];
        }

        // Fallback: localizar por id si el ordering cambió.
        const idx = prev.findIndex((m) => m?.id === tempAssistantId);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], content: (prev[idx].content || '') + chunk };
        const next = prev.slice();
        next[idx] = updated;
        return next;
      });
      scrollToBottom(true, { force: false });
    };

    try {
      stickToBottomRef.current = true;
      setMessages((prev) => {
        const cleaned = prev.filter((m) => m.type !== 'quickReplies');
        return [...cleaned, tempUserMessage, tempAssistantMessage];
      });
      scrollToBottom(true, { force: true });

      let resumePayload = pendingTccLiteResumeRef.current;
      if (!resumePayload) {
        resumePayload = await peekPendingTccLiteResume();
      }
      if (resumePayload?.distortionType) {
        pendingTccLiteResumeRef.current = resumePayload;
      }

      cancelActiveStream();
      const streamController = new AbortController();
      streamAbortControllerRef.current = streamController;

      const resumeCommitmentFollowUp = pendingResumeCommitmentFollowUpRef.current === true;
      pendingResumeCommitmentFollowUpRef.current = false;

      await chatService.sendMessageStream(messageText, {
        resumeTccLite: resumePayload,
        resumeCommitmentFollowUp,
        signal: streamController.signal,
        registerAbort: (fn) => {
          activeStreamAbortRef.current = fn;
        },
        onChunk(content) {
          pendingChunk += content;
          if (!flushTimer) {
            flushTimer = setTimeout(flushPendingChunk, 60); // ~16fps
          }
        },
        onDone(payload) {
          applyCrisisResourcesFromTurn(payload);
          // Descartar chunks en bruto del stream: el servidor envía la versión saneada en onDone.
          pendingChunk = '';
          if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
          }

          if (payload.guest) {
            setGuestQuota({
              max: payload.guest.maxUserMessages,
              remaining: payload.guest.remainingAfterThis,
            });
          }

          setMessages((prev) => {
            const filtered = prev
              .filter((msg) => msg.id !== tempAssistantId)
              .filter((msg) => msg.type !== 'quickReplies')
              .filter((msg) => msg.type !== 'suggestions');
            const finalAssistant = {
              id: payload.messageId || tempAssistantId,
              _id: payload.messageId || tempAssistantId,
              content: payload.content ?? '',
              role: MESSAGE_ROLES.ASSISTANT,
              type: MESSAGE_TYPES.TEXT,
              metadata: buildAssistantMetadataFromTurnPayload(payload, {
                timestamp: new Date().toISOString(),
              }),
            };
            const next = [...filtered, finalAssistant];
            const hasServerSuggestions =
              payload.suggestions && payload.suggestions.length > 0;
            if (hasServerSuggestions) {
              next.push({
                id: `suggestions-${Date.now()}`,
                role: 'suggestions',
                type: 'suggestions',
                suggestions: payload.suggestions,
                metadata: {
                  timestamp: new Date().toISOString(),
                  rankingPersonalized: payload.suggestionsPersonalized === true,
                },
              });
            }
            const ppa = sanitizeProposedProductActions(payload.proposedProductActions);
            if (ppa.length > 0) {
              next.push({
                id: `product-proposals-${Date.now()}`,
                role: 'suggestions',
                type: 'product_proposals',
                proposedProductActions: ppa,
                metadata: {
                  timestamp: new Date().toISOString(),
                  assistantMessageId: payload.messageId,
                },
              });
            }
            const pc = sanitizeProposedCommitments(payload.proposedCommitments);
            if (pc.length > 0) {
              next.push({
                id: `commitment-proposals-${Date.now()}`,
                role: 'suggestions',
                type: 'commitment_proposals',
                proposedCommitments: pc,
                metadata: {
                  timestamp: new Date().toISOString(),
                  assistantMessageId: payload.messageId,
                },
              });
            }
            const eca = payload.proposedEmergencyContactAlert;
            if (eca && eca.id && eca.message) {
              next.push({
                id: `emergency-contact-offer-${eca.id}`,
                role: 'suggestions',
                type: 'emergency_contact_alert_offer',
                proposedEmergencyContactAlert: eca,
                metadata: {
                  timestamp: new Date().toISOString(),
                  assistantMessageId: payload.messageId,
                },
              });
            }
            if (payload.productActionStatus?.askFirst && payload.productActionStatus?.askFirstPrompt) {
              next.push({
                id: `product-actions-ask-first-${Date.now()}`,
                role: MESSAGE_ROLES.ASSISTANT,
                type: MESSAGE_TYPES.TEXT,
                content: payload.productActionStatus.askFirstPrompt,
                metadata: { timestamp: new Date().toISOString() }
              });
            }
            if (
              payload.commitmentFollowUp?.id &&
              !isGenericCommitmentLabel(payload.commitmentFollowUp.label)
            ) {
              next.push({
                id: `commitment-follow-up-${Date.now()}`,
                role: 'suggestions',
                type: 'commitment_follow_up',
                commitmentFollowUp: payload.commitmentFollowUp,
                metadata: { timestamp: new Date().toISOString() },
              });
            }
            const handoff = resolveTccLiteAtHandoffFromPayload(payload);
            if (handoff) setTccLiteAtHandoff(handoff);
            else if (shouldClearTccLiteHandoff(payload)) setTccLiteAtHandoff(null);
            return next;
          });
          pendingTccLiteResumeRef.current = null;
          void clearPendingTccLiteResume();
          scrollToBottom(true, { force: false });
          requestAnimationFrame(() => {
            hapticAssistantMessageReceived();
          });
        },
      });
    } catch (err) {
      if (extractErrorCode(err) === 'ABORTED' || err?.name === 'AbortError') {
        return;
      }
      console.error('Error al enviar mensaje:', err);

      // Limpiar flush pendiente si hubo error.
      // (pendingChunk no afecta el state porque el message temporal se remueve abajo)
      if (flushTimer) {
        clearTimeout(flushTimer);
      }

      // Quitar mensajes temporales en error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id && msg.id !== tempAssistantId));

      const resumePayload = pendingTccLiteResumeRef.current;
      if (resumePayload?.distortionType) {
        pendingTccLiteResumeRef.current = resumePayload;
        void setPendingTccLiteResume(resumePayload);
      }

      const backendCode = extractErrorCode(err);
      const isNetworkError =
        backendCode === 'NETWORK_ERROR' ||
        backendCode === 'ECONNREFUSED' ||
        err.message?.includes('Network request failed') ||
        err.message?.includes('network') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('timeout') ||
        !isConnected ||
        isOffline;

      if (isNetworkError) {
        try {
          await setOfflinePendingMessageStorage(messageText);
          setOfflinePendingMessage(messageText);
        } catch (_) {}
        setIsTyping(false);
        return;
      }

      if (backendCode === 'MESSAGE_IN_FLIGHT') {
        showToast({
          message: texts.MESSAGE_IN_FLIGHT_DEFAULT,
          type: 'warning',
        });
        setInputText(messageText);
        setIsTyping(false);
        return;
      }

      if (
        backendCode === 'STREAM_INCOMPLETE' ||
        backendCode === 'SOCKET_TIMEOUT' ||
        backendCode === 'TURN_ABORTED'
      ) {
        let recoveredFromServer = false;
        // Recuperación silenciosa: evitar avisos de stream incompleto.
        // Intentamos reconciliar estado con el servidor para obtener la respuesta final persistida.
        try {
          if (await chatService.isGuestChatMode()) {
            const convId = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_CONVERSATION_ID);
            if (convId) {
              const serverMessages = await chatService.getGuestMessages(convId);
              if (serverMessages?.length > 0) {
                const uniqueMessages = serverMessages.reduce((acc, message) => {
                  const messageId = message._id || message.id;
                  if (!messageId) return acc;
                  const exists = acc.some((msg) => msg._id === messageId || msg.id === messageId);
                  if (!exists) acc.push(message);
                  return acc;
                }, []);
                uniqueMessages.sort((a, b) => {
                  const timeA = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
                  const timeB = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
                  return timeA - timeB;
                });
                const sentAt = new Date(tempUserMessage.metadata?.timestamp || Date.now()).getTime();
                recoveredFromServer = uniqueMessages.some((m) => {
                  if (m.role !== MESSAGE_ROLES.ASSISTANT) return false;
                  const content = String(m.content || '').trim();
                  if (!content) return false;
                  const createdAt = new Date(m.createdAt || m.metadata?.timestamp || 0).getTime();
                  return Number.isFinite(createdAt) ? createdAt >= sentAt - 1000 : true;
                });
                const langGuest = await getAppLanguage();
                setMessages(finalizeLoadedChatMessages(uniqueMessages, langGuest));
              }
            }
          } else {
            const convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
            if (convId) {
              const pack = await chatService.getMessages(convId);
              const serverMessages = pack.messages || [];
              if (serverMessages.length > 0) {
                const uniqueMessages = serverMessages.reduce((acc, message) => {
                  const messageId = message._id || message.id;
                  if (!messageId) return acc;
                  const exists = acc.some((msg) => msg._id === messageId || msg.id === messageId);
                  if (!exists) acc.push(message);
                  return acc;
                }, []);
                uniqueMessages.sort((a, b) => {
                  const timeA = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
                  const timeB = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
                  return timeA - timeB;
                });
                const sentAt = new Date(tempUserMessage.metadata?.timestamp || Date.now()).getTime();
                recoveredFromServer = uniqueMessages.some((m) => {
                  if (m.role !== MESSAGE_ROLES.ASSISTANT) return false;
                  const content = String(m.content || '').trim();
                  if (!content) return false;
                  const createdAt = new Date(m.createdAt || m.metadata?.timestamp || 0).getTime();
                  return Number.isFinite(createdAt) ? createdAt >= sentAt - 1000 : true;
                });
                const langReg = await getAppLanguage();
                setMessages(finalizeLoadedChatMessages(uniqueMessages, langReg));
              }
            }
          }
          scrollToBottom(true, { force: true });
        } catch (reconcileErr) {
          console.warn('[ChatScreen] Reconciliación tras STREAM_INCOMPLETE falló:', reconcileErr?.message || reconcileErr);
        }

        // Si no se pudo recuperar respuesta final desde servidor, reintento silencioso 1 vez.
        if (!recoveredFromServer) {
          const now = Date.now();
          const key = String(messageText || '').trim().toLowerCase();
          const state = streamIncompleteRetryStateRef.current;
          const sameWindow = state.key === key && now - state.windowStart < 60_000;
          const canRetry = !sameWindow || state.count < 1;
          if (canRetry) {
            streamIncompleteRetryStateRef.current = {
              key,
              count: sameWindow ? state.count + 1 : 1,
              windowStart: sameWindow ? state.windowStart : now,
            };
            setTimeout(() => {
              handleSendRef.current?.(messageText);
            }, 250);
          }
        }
        setIsTyping(false);
        return;
      }

      if (backendCode === 'ETIMEDOUT' || backendCode === 'TIMEOUT') {
        showToast({
          message: texts.SEND_TIMEOUT_DEFAULT,
          type: 'warning',
        });
        setIsTyping(false);
        return;
      }

      if (err.guestAuthFailed) {
        setGuestQuota(null);
        Alert.alert(texts.GUEST_SESSION_EXPIRED_TITLE, texts.GUEST_SESSION_EXPIRED_MESSAGE, [
          {
            text: texts.COMMON_OK,
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
        setIsTyping(false);
        return;
      }

      if (backendCode === 'RATE_LIMIT') {
        showToast({
          message: texts.GUEST_RATE_LIMIT_TITLE,
          type: 'warning',
        });
        setIsTyping(false);
        return;
      }

      if (backendCode === 'GUEST_CONTENT_TOO_LONG') {
        showToast({
          message: texts.GUEST_CONTENT_TOO_LONG_TITLE,
          type: 'warning',
        });
        setIsTyping(false);
        return;
      }

      if (backendCode === 'GUEST_LIMIT_REACHED' || err.requiresAccount) {
        Alert.alert(texts.GUEST_LIMIT_TITLE, texts.GUEST_LIMIT_MESSAGE, [
          { text: texts.COMMON_CANCEL, style: 'cancel' },
          {
            text: texts.COMMON_CREATE_ACCOUNT,
            onPress: async () => {
              try {
                await chatService.clearGuestChat();
              } catch (_) {}
              navigation.navigate(ROUTES.REGISTER);
            },
          },
          {
            text: texts.COMMON_SIGN_IN,
            onPress: async () => {
              try {
                await chatService.clearGuestChat();
              } catch (_) {}
              navigation.navigate(ROUTES.SIGN_IN);
            },
          },
        ]);
        setIsTyping(false);
        return;
      }

      const isSubscriptionError =
        backendCode === 'SUBSCRIPTION_REQUIRED' ||
        err.message?.includes('suscripción') ||
        err.message?.includes('subscription') ||
        err.message?.includes('trial') ||
        err.message?.includes('Se requiere suscripción activa') ||
        (err.response?.status === 403 && err.response?.data?.requiresSubscription);

      if (isSubscriptionError) {
        Alert.alert(texts.SUBSCRIPTION_REQUIRED_TITLE, texts.SUBSCRIPTION_REQUIRED_DEFAULT, [
          { text: texts.COMMON_CANCEL, style: 'cancel' },
          { text: texts.SUBSCRIPTION_VIEW_PLANS, onPress: () => navigation.navigate('Subscription') },
        ]);
        setIsTyping(false);
        return;
      }

      if (
        backendCode === 'CONVERSATION_CREATE_FAILED' ||
        (err.message?.includes('conversación') && !isSubscriptionError)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
            content: texts.CONVERSATION_ERROR,
            role: MESSAGE_ROLES.ASSISTANT,
            type: MESSAGE_TYPES.ERROR,
            metadata: { timestamp: new Date().toISOString(), error: true },
          },
        ]);
        scrollToBottom(true, { force: true });
        setIsTyping(false);
        return;
      }

      captureChatError(err, {
        code: backendCode || err?.name,
        phase: 'send_message_stream',
        guest: guestQuota !== null,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
          content: texts.ERROR_SEND,
          role: MESSAGE_ROLES.ASSISTANT,
          type: MESSAGE_TYPES.ERROR,
          metadata: { timestamp: new Date().toISOString(), error: true },
        },
      ]);
      scrollToBottom(true, { force: true });
    } finally {
      setIsTyping(false);
      activeStreamAbortRef.current = null;
      streamAbortControllerRef.current = null;
    }
    } finally {
      sendRequestInFlightRef.current = false;
    }
  }, [inputText, scrollToBottom, isConnected, isOffline, navigation, guestQuota, showToast, typingTelemetryEnabled, typingTelemetry, cancelActiveStream]);

  handleSendRef.current = handleSend;

  const retryOfflinePending = useCallback(async () => {
    const text = offlinePendingMessage || (await getOfflinePendingMessage());
    if (!text) return;
    if (flushingOfflineRef.current) return;
    flushingOfflineRef.current = true;
    await clearOfflinePendingMessage();
    setOfflinePendingMessage(null);
    try {
      await handleSendRef.current?.(text);
    } finally {
      flushingOfflineRef.current = false;
    }
  }, [offlinePendingMessage]);

  useEffect(() => {
    const prev = prevIsOfflineRef.current;
    prevIsOfflineRef.current = isOffline;

    const flushPendingIfOnline = async () => {
      const pending = await getOfflinePendingMessage();
      if (!pending) return;
      if (flushingOfflineRef.current) return;
      flushingOfflineRef.current = true;
      await clearOfflinePendingMessage();
      setOfflinePendingMessage(null);
      try {
        await handleSendRef.current?.(pending);
      } finally {
        flushingOfflineRef.current = false;
      }
    };

    if (prev === null) {
      if (!isOffline) {
        flushPendingIfOnline();
      }
      return;
    }
    if (prev === true && isOffline === false) {
      flushPendingIfOnline();
    }
  }, [isOffline]);

  useEffect(() => {
    (async () => {
      const p = await getOfflinePendingMessage();
      setOfflinePendingMessage(p);
    })();
  }, []);

  const clearConversation = useCallback(async () => {
    const texts = textsRef.current;
    try {
      cancelActiveStream();
      tccContinuityRequestIdRef.current += 1;
      historyPageRef.current = 1;
      setHistoryHasMore(false);
      setMessages([]);
      messagesRef.current = [];
      await clearOfflinePendingMessage();
      setOfflinePendingMessage(null);
      dismissedContinuityIdsRef.current = [];
      setDismissedContinuityIds([]);
      setTccLiteAtHandoff(null);
      setTccContinuityItems([]);
      crisisResourcesDismissedRef.current = false;
      setCrisisResourcesPanel(null);
      softCrisisCheckInDismissedRef.current = false;
      setSoftCrisisCheckInPanel(null);
      userTurnBaselineRef.current = 0;
      captureVisitBaselineRef.current = true;
      pendingTccLiteResumeRef.current = null;
      void clearPendingTccLiteResume();
      await chatService.clearMessages();
      await initializeConversation();
      setShowClearModal(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}
    } catch (err) {
      console.error('Error al borrar la conversación:', err);
      setError(texts.ERROR_CLEAR);
      tccContinuityRequestIdRef.current += 1;
      try {
        await initializeConversation();
      } catch (_) {
        /* mejor esfuerzo: rehidratar desde servidor */
      }
    }
  }, [initializeConversation, cancelActiveStream]);

  const refreshMessages = useCallback(async () => {
    try {
      setRefreshing(true);
      const refreshLang = await getAppLanguage();
      if (await chatService.isGuestChatMode()) {
        const convId = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_CONVERSATION_ID);
        if (convId) {
          const serverMessages = await chatService.getGuestMessages(convId);
          const used = serverMessages.filter((m) => m.role === 'user').length;
          setGuestQuota({
            max: GUEST_MAX_USER_MESSAGES,
            remaining: Math.max(0, GUEST_MAX_USER_MESSAGES - used),
          });
          if (serverMessages && serverMessages.length > 0) {
            const uniqueMessages = serverMessages.reduce((acc, message) => {
              const messageId = message._id || message.id;
              if (!messageId) return acc;
              const exists = acc.some((msg) => msg._id === messageId || msg.id === messageId);
              if (!exists) acc.push(message);
              return acc;
            }, []);
            uniqueMessages.sort((a, b) => {
              const timeA = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
              const timeB = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
              return timeA - timeB;
            });
            setMessages(finalizeLoadedChatMessages(uniqueMessages, refreshLang));
            void hydrateCrisisResourcesFromMessages(uniqueMessages);
          }
        }
        return;
      }
      const conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (conversationId) {
        const pack = await chatService.getMessages(conversationId);
        const serverMessages = pack.messages || [];
        if (serverMessages.length > 0) {
          const uniqueMessages = serverMessages.reduce((acc, message) => {
            const messageId = message._id || message.id;
            if (!messageId) return acc;
            const exists = acc.some((msg) => msg._id === messageId || msg.id === messageId);
            if (!exists) acc.push(message);
            return acc;
          }, []);
          uniqueMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
            return timeA - timeB;
          });
          setMessages(finalizeLoadedChatMessages(uniqueMessages, refreshLang));
          void hydrateCrisisResourcesFromMessages(uniqueMessages);
          const uc = uniqueMessages.filter((m) => m.role === 'user').length;
          setShowSessionIntentionPrompt(uc === 0 && !pack.sessionIntention);
        }
      }
    } catch (err) {
      console.error('[ChatScreen] Error al recargar mensajes:', err.message);
    } finally {
      setRefreshing(false);
    }
  }, [hydrateCrisisResourcesFromMessages]);

  const handleBack = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const target = await resolveChatBackTarget(route.params);
      await clearChatEntryBackTarget();
      void scheduleLastSessionSummaryDeferred();

      if (!token) {
        dispatchRootReset(navigation, { index: 0, routes: [{ name: 'Home' }] });
        return;
      }

      const newUserTurns = Math.max(
        0,
        countNonemptyUserTurns(messagesRef.current) - userTurnBaselineRef.current,
      );

      if (newUserTurns >= 1 && !(await chatService.isGuestChatMode())) {
        const cid = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        if (cid && isValidMongoObjectId24(cid)) {
          const parentNav = navigation.getParent?.() || navigation;
          parentNav.navigate('SessionInsight', {
            conversationId: cid,
            backTarget: target,
            loading: true,
          });
          return;
        }
      }

      if (target === 'home') {
        dispatchRootReset(navigation, { index: 0, routes: [{ name: 'Home' }] });
        return;
      }
      dispatchRootReset(navigation, getResetToMainTabsWithInicioState());
    } catch (err) {
      console.error('[ChatScreen] Error en goBack:', err);
      try {
        await clearChatEntryBackTarget();
        dispatchRootReset(navigation, { index: 0, routes: [{ name: 'Home' }] });
      } catch (e2) {
        console.error('[ChatScreen] goBack recuperación:', e2);
      }
    }
  }, [navigation, route.params, scheduleLastSessionSummaryDeferred]);

  const guestHandoffStartFresh = useCallback(async () => {
    try {
      await chatService.clearGuestHandoff();
    } catch (_) {}
    setGuestHandoffModal(null);
  }, []);

  const guestHandoffUseSummary = useCallback(async () => {
    const texts = textsRef.current;
    const summaryText = guestHandoffModal?.summaryText;
    if (!summaryText) return;
    const prefill = `${texts.GUEST_HANDOFF_PREFILL_PREFIX}\n\n${summaryText}`;
    setInputText(prefill);
    try {
      await chatService.clearGuestHandoff();
    } catch (_) {}
    setGuestHandoffModal(null);
    setTimeout(() => {
      try {
        inputRef.current?.focus?.();
      } catch (_) {}
    }, 400);
  }, [guestHandoffModal, setInputText]);

  /** Tras login/registro: ofrecer resumen del chat invitado en el primer mensaje (opcional). Una vez por montaje del chat (sesión de pantalla). */
  const offerGuestHandoffIfPending = useCallback(async () => {
    try {
      if (guestHandoffUiShownRef.current) return;
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      if (await chatService.isGuestChatMode()) return;
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_HANDOFF_PENDING);
      if (!raw) return;
      const payload = parseGuestHandoffPendingFromStorage(raw);
      if (!payload) {
        await chatService.clearGuestHandoff();
        return;
      }
      guestHandoffUiShownRef.current = true;
      setGuestHandoffModal({
        summaryText: payload.summaryText,
        messageCount: payload.messageCount,
      });
    } catch (e) {
      console.warn('[GuestHandoff]', e);
    }
  }, []);

  // Efecto inicial: animación y listeners (la conversación se carga al enfocar la pantalla)
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: FADE_ANIMATION_TO_VALUE,
      duration: FADE_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();

    const messageUnsubscribe = chatService.onMessage((message) => {
      const messageId = message._id || message.id;
      if (!messageId) return;
      const role = message?.role;
      const isAssistant = role === MESSAGE_ROLES.ASSISTANT;
      const isError = message?.type === MESSAGE_TYPES.ERROR;

      let appended = false;
      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === messageId || msg.id === messageId);
        if (exists) return prev;
        appended = true;
        const newMessages = [...prev, message];
        chatService.saveMessages(newMessages);
        return newMessages;
      });
      if (appended && isAssistant && !isError) {
        requestAnimationFrame(() => {
          hapticAssistantMessageReceived();
        });
      }
      requestAnimationFrame(() => {
        scrollToBottomStableRef.current?.(true, { force: false });
      });
      setTimeout(() => {
        scrollToBottomStableRef.current?.(true, { force: false });
      }, 100);
    });
    const errorUnsubscribe = chatService.onError((err) => {
      console.error('[ChatScreen] Error en el chat:', err.message || err);
      setError(textsRef.current.ERROR_COMMUNICATION);
    });
    return () => {
      messageUnsubscribe();
      errorUnsubscribe();
      chatService.closeSocket();
    };
  }, [fadeAnim]);

  // WebSocket: chat (typing), alertas de emergencia y errores de conexión
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;
        const userData = await AsyncStorage.getItem('userData');
        const userId = parseUserIdFromUserDataStorage(userData);
        if (userId) await websocketService.connect(userId);
      } catch (err) {
        console.error('[ChatScreen] Error conectando WebSocket:', err);
      }
    };
    connectWebSocket();

    const unsubscribeTyping = websocketService.on('chat:typing', (typing) => {
      if (!typing && sendRequestInFlightRef.current) return;
      setIsTyping(Boolean(typing));
    });
    const unsubscribeAlert = websocketService.on('emergency:alert:sent', (data) => {
      const texts = textsRef.current;
      if (data && !data.isTest) {
        setCrisisContactAlertNotice(
          texts.CRISIS_POST_CONTACT_ALERT_NOTICE ||
            texts.EMERGENCY_ALERT_SENT_BODY
              ?.replace('{successful}', String(data.successfulSends))
              ?.replace('{total}', String(data.totalContacts)),
        );
      }
    });
    const unsubscribeError = websocketService.on('error', (err) => {
      console.error('[ChatScreen] Error en WebSocket:', err);
    });
    return () => {
      unsubscribeTyping();
      unsubscribeAlert();
      unsubscribeError();
      websocketService.disconnect();
    };
  }, []);

  // Auth: requiere sesión iniciada (sin modo invitado)
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) return;
        if (await chatService.isGuestChatMode()) {
          await chatService.clearGuestChat();
        }
        navigation.reset({ index: 0, routes: [{ name: ROUTES.SIGN_IN }] });
      } catch (err) {
        console.error('[ChatScreen] Error verificando autenticación:', err);
        navigation.reset({ index: 0, routes: [{ name: ROUTES.SIGN_IN }] });
      }
    };
    checkAuthentication();
  }, [navigation]);

  const loadTccContinuity = useCallback(async () => {
    const requestId = tccContinuityRequestIdRef.current + 1;
    tccContinuityRequestIdRef.current = requestId;
    try {
      if (dismissedContinuityIdsRef.current.length === 0) {
        const stored = await loadDismissedContinuityIds();
        if (stored.length > 0) {
          dismissedContinuityIdsRef.current = stored;
          setDismissedContinuityIds(stored);
        }
      }
      const convId = await AsyncStorage.getItem(CHAT_SESSION_KEYS.CONVERSATION_ID);
      const items = await chatService.fetchTccContinuity(convId);
      if (requestId !== tccContinuityRequestIdRef.current) return;
      if (!hasNonemptyUserTurns(messagesRef.current)) {
        setTccContinuityItems([]);
        return;
      }
      setTccContinuityItems(Array.isArray(items) ? items : []);
    } catch {
      if (requestId !== tccContinuityRequestIdRef.current) return;
      setTccContinuityItems([]);
    }
  }, []);

  const hasUserMessagesInChat = useMemo(
    () => hasNonemptyUserTurns(messages),
    [messages],
  );

  const visibleTccContinuityItems = useMemo(
    () =>
      hasUserMessagesInChat
        ? (tccContinuityItems || []).filter(
            (item) => item?.id && !dismissedContinuityIds.includes(item.id),
          )
        : [],
    [tccContinuityItems, dismissedContinuityIds, hasUserMessagesInChat],
  );

  const handleOpenTccContinuityItem = useCallback(
    (item) => {
      if (!item?.screen) return;
      if (item.interventionId) {
        recordInterventionClicked(item.interventionId);
      }
      navigation.navigate(item.screen, item.params || {});
    },
    [navigation],
  );

  const handleDismissTccContinuityItem = useCallback((item) => {
    if (!item?.id) return;
    if (item.interventionId) {
      recordInterventionDismissed(item.interventionId);
    }
    dismissedContinuityIdsRef.current = dismissedContinuityIdsRef.current.includes(item.id)
      ? dismissedContinuityIdsRef.current
      : [...dismissedContinuityIdsRef.current, item.id];
    setDismissedContinuityIds(dismissedContinuityIdsRef.current);
    void persistDismissedContinuityId(item.id);
  }, []);

  const handleOpenTccLiteAtHandoff = useCallback(
    async (handoff) => {
      if (!handoff?.screen) return;
      recordInterventionClicked('automatic_thought_record');
      setTccLiteAtHandoff(null);
      try {
        const conversationHistory = messages
          .filter((m) => m?.role === MESSAGE_ROLES.USER || m?.role === MESSAGE_ROLES.ASSISTANT)
          .slice(-14)
          .map((m) => ({
            role: m.role,
            content: String(m.content || '').trim(),
          }))
          .filter((m) => m.content);
        const draft = await chatService.createTccLiteAtDraft({
          conversationHistory,
          handoffParams: handoff.params,
          distortionType: handoff.params?.prefillDistortionType,
        });
        if (draft?.screen) {
          navigation.navigate(draft.screen, draft.params || {});
          return;
        }
      } catch {
        // fallback: navegación con prefill local
      }
      navigation.navigate(handoff.screen, handoff.params || {});
    },
    [messages, navigation],
  );

  const handleDismissTccLiteAtHandoff = useCallback(() => {
    setTccLiteAtHandoff(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const routeResume = route.params?.resumeTccLite;
        if (routeResume?.distortionType) {
          pendingTccLiteResumeRef.current = routeResume;
          await setPendingTccLiteResume(routeResume);
          try {
            navigation.setParams({ resumeTccLite: undefined });
          } catch (_) {}
        } else {
          const peek = await peekPendingTccLiteResume();
          if (peek?.distortionType) {
            pendingTccLiteResumeRef.current = peek;
          }
        }
      })();
    }, [navigation, route.params?.resumeTccLite]),
  );

  useFocusEffect(
    useCallback(() => {
      captureVisitBaselineRef.current = true;
      (async () => {
        if (await chatService.isGuestChatMode()) {
          setTrialInfo(null);
        } else {
          loadTrialInfo();
        }
        const p = await getOfflinePendingMessage();
        setOfflinePendingMessage(p);
        await initializeConversation();
        if (captureVisitBaselineRef.current) {
          captureUserTurnBaseline(messagesRef.current);
        }
        if (!(await chatService.isGuestChatMode())) {
          await loadTccContinuity();
        }
      })();
      const handoffTimer = setTimeout(() => {
        offerGuestHandoffIfPending();
      }, 650);
      return () => {
        clearTimeout(handoffTimer);
        if (contentSizeScrollTimerRef.current) {
          clearTimeout(contentSizeScrollTimerRef.current);
          contentSizeScrollTimerRef.current = null;
        }
        cancelActiveStream();
        void scheduleLastSessionSummaryDeferred();
        setShowSessionIntentionPrompt(false);
      };
    }, [
      loadTrialInfo,
      loadTccContinuity,
      initializeConversation,
      offerGuestHandoffIfPending,
      scheduleLastSessionSummaryDeferred,
      cancelActiveStream,
      captureUserTurnBaseline,
    ])
  );

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    handleInputChange,
    isLoading,
    error,
    isTyping,
    showScrollButton,
    showClearModal,
    setShowClearModal,
    trialInfo,
    trialBannerDismissed,
    handleTrialBannerDismiss,
    refreshing,
    fadeAnim,
    flatListRef,
    inputRef,
    initializeConversation,
    loadTrialInfo,
    handleSend,
    clearConversation,
    refreshMessages,
    scrollToBottom,
    handleMessagesContentSizeChange,
    handleMessagesListLayout,
    handleScroll,
    handleBack,
    isOffline,
    navigation,
    guestQuota,
    guestHandoffModal,
    guestHandoffStartFresh,
    guestHandoffUseSummary,
    offlinePendingMessage,
    retryOfflinePending,
    handleProductProposalPress,
    handleProductProposalReject,
    handleCommitmentFollowUpAnswer,
    handleCommitmentProposalPress,
    handleCommitmentProposalReject,
    showSessionIntentionPrompt,
    sessionIntentionSubmitting,
    selectSessionIntention,
    skipSessionIntention,
    visibleTccContinuityItems,
    handleOpenTccContinuityItem,
    handleDismissTccContinuityItem,
    tccLiteAtHandoff,
    handleOpenTccLiteAtHandoff,
    handleDismissTccLiteAtHandoff,
    crisisResourcesPanel,
    softCrisisCheckInPanel,
    crisisContactAlertNotice,
    dismissCrisisResourcesPanel,
    dismissSoftCrisisCheckInPanel,
    handleOpenSoftCrisisTechnique,
    openCrisisResourcesPanel,
    openEmergencyContactsFromChat,
    handleEmergencyContactAlertConfirm,
    handleEmergencyContactAlertReject,
    emergencyContactAlertConfirmingId,
    historyHasMore,
    loadingOlderMessages,
    loadOlderMessages,
    immersiveMode,
    toggleImmersiveMode,
  };
}
