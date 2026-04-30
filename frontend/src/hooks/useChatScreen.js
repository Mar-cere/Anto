/**
 * Hook con la lógica de estado y efectos de la pantalla de chat.
 * Centraliza: mensajes, carga, envío, limpieza, scroll, trial, websocket y auth.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, InteractionManager } from 'react-native';
import chatService from '../services/chatService';
import paymentService from '../services/paymentService';
import websocketService from '../services/websocketService';
import { useNetworkStatus } from './useNetworkStatus';
import { ROUTES } from '../constants/routes';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import {
  FADE_ANIMATION_DURATION,
  FADE_ANIMATION_TO_VALUE,
  GUEST_MAX_USER_MESSAGES,
  MESSAGE_ID_PREFIXES,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  SCROLL_THRESHOLD,
  STORAGE_KEYS,
  TEXTS,
} from '../screens/chat/chatScreenConstants';
import { getResetToMainTabsWithInicioState } from '../navigation/navigationHelpers';
import {
  clearChatEntryBackTarget,
  resolveChatBackTarget,
} from '../utils/chatEntryContext';
import {
  clearOfflinePendingMessage,
  getOfflinePendingMessage,
  setOfflinePendingMessage,
} from '../services/chatOfflinePending';
import { useToast } from '../context/ToastContext';
import { isValidSessionIntentionId } from '../constants/sessionIntention';

export function useChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
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
  /** Pulgar en mensajes del asistente (solo usuarios con cuenta) */
  const [chatFeedbackEnabled, setChatFeedbackEnabled] = useState(false);
  /** Evita doble envío y permite deshabilitar botones mientras viaja la petición */
  const [feedbackSubmittingId, setFeedbackSubmittingId] = useState(null);
  const feedbackRequestLockRef = useRef(false);
  const handleSendRef = useRef(null);
  /** Evita doble POST / doble respuesta del asistente si el usuario envía dos veces muy rápido. */
  const sendRequestInFlightRef = useRef(false);
  const flushingOfflineRef = useRef(false);
  const prevIsOfflineRef = useRef(null);
  /** Evita bucles de reintento silencioso ante STREAM_INCOMPLETE. */
  const streamIncompleteRetryStateRef = useRef({
    key: null,
    count: 0,
    windowStart: 0,
  });

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  /** Si el usuario está cerca del final; solo auto-scroll cuando es true (evita saltar si leyó arriba). */
  const stickToBottomRef = useRef(true);
  /** Ref estable para callbacks (socket / init) que no deben depender del cierre sobre `scrollToBottom`. */
  const scrollToBottomStableRef = useRef(null);
  const contentSizeScrollTimerRef = useRef(null);

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

  const initializeConversation = useCallback(async () => {
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
      const filtered = uniqueMessages.filter((m) => m.type !== 'quickReplies');
      setMessages(filtered);
      if (isRegistered) {
        const userCount = filtered.filter((m) => m.role === MESSAGE_ROLES.USER).length;
        setShowSessionIntentionPrompt(userCount === 0 && !sessionIntentionMeta);
      } else {
        setShowSessionIntentionPrompt(false);
      }
      return true;
    };

    try {
      setIsLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      setChatFeedbackEnabled(!!userToken);

      if (userToken) {
        setGuestQuota(null);
        await chatService.initializeSocket();
        let conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        if (conversationId) {
          const pack = await chatService.getMessages(conversationId);
          if (dedupeAndSetMessages(pack.messages, pack.sessionIntention, { isRegistered: true }))
            return;
        }
        const idAfterFetch = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
        if (!idAfterFetch) {
          await chatService.initializeSocket();
          conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
          if (conversationId) {
            const retryPack = await chatService.getMessages(conversationId);
            if (dedupeAndSetMessages(retryPack.messages, retryPack.sessionIntention, { isRegistered: true }))
              return;
          }
        }
        const welcomeMessage = {
          id: `${MESSAGE_ID_PREFIXES.WELCOME}-${Date.now()}`,
          content: TEXTS.WELCOME,
          role: MESSAGE_ROLES.ASSISTANT,
          type: MESSAGE_TYPES.TEXT,
          metadata: { timestamp: new Date().toISOString(), type: MESSAGE_TYPES.WELCOME },
        };
        setMessages([welcomeMessage]);
        setShowSessionIntentionPrompt(true);
        await chatService.saveMessages([welcomeMessage]);
        return;
      }

      const startGuest = route.params?.startGuest === true;
      let hasGuestToken = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
      if (!hasGuestToken && startGuest) {
        try {
          const data = await chatService.startGuestChatSession();
          setGuestQuota({
            max: data.maxUserMessages ?? GUEST_MAX_USER_MESSAGES,
            remaining: Math.max(
              0,
              (data.maxUserMessages ?? GUEST_MAX_USER_MESSAGES) - (data.userMessagesUsed ?? 0)
            ),
          });
        } catch (e) {
          if (e.code === 'RATE_LIMIT') {
            Alert.alert(TEXTS.GUEST_RATE_LIMIT_TITLE, e.message || '', [
              {
                text: 'OK',
                onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
              },
            ]);
            setGuestQuota(null);
            setMessages([]);
            setShowSessionIntentionPrompt(false);
            return;
          }
          throw e;
        }
        hasGuestToken = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
        navigation.setParams({ startGuest: undefined });
      }

      if (await chatService.isGuestChatMode()) {
        const convId = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_CONVERSATION_ID);
        if (convId) {
          const serverMessages = await chatService.getGuestMessages(convId);
          const used = serverMessages.filter((m) => m.role === 'user').length;
          setGuestQuota({
            max: GUEST_MAX_USER_MESSAGES,
            remaining: Math.max(0, GUEST_MAX_USER_MESSAGES - used),
          });
          if (dedupeAndSetMessages(serverMessages, null, { isRegistered: false })) return;
        }
        setGuestQuota({ max: GUEST_MAX_USER_MESSAGES, remaining: GUEST_MAX_USER_MESSAGES });
        const welcomeMessage = {
          id: `${MESSAGE_ID_PREFIXES.WELCOME}-${Date.now()}`,
          content: TEXTS.WELCOME,
          role: MESSAGE_ROLES.ASSISTANT,
          type: MESSAGE_TYPES.TEXT,
          metadata: { timestamp: new Date().toISOString(), type: MESSAGE_TYPES.WELCOME },
        };
        setMessages([welcomeMessage]);
        setShowSessionIntentionPrompt(false);
        return;
      }

      setGuestQuota(null);
      setMessages([]);
      setShowSessionIntentionPrompt(false);
    } catch (err) {
      if (err.guestAuthFailed) {
        setError(null);
        setGuestQuota(null);
        Alert.alert(TEXTS.GUEST_SESSION_EXPIRED_TITLE, TEXTS.GUEST_SESSION_EXPIRED_MESSAGE, [
          {
            text: 'OK',
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
        setMessages([]);
        setShowSessionIntentionPrompt(false);
        return;
      }
      if (err.code === 'RATE_LIMIT') {
        setError(null);
        Alert.alert(TEXTS.GUEST_RATE_LIMIT_TITLE, err.message || '', [
          {
            text: 'OK',
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
        setMessages([]);
        setShowSessionIntentionPrompt(false);
        return;
      }
      console.error('[ChatScreen] Error al inicializar chat:', err.message);
      setError(TEXTS.ERROR_LOAD);
    } finally {
      setIsLoading(false);
      stickToBottomRef.current = true;
      InteractionManager.runAfterInteractions(() => {
        scrollToBottomStableRef.current?.(false, { force: true });
      });
    }
  }, [navigation, route.params?.startGuest]);

  const skipSessionIntention = useCallback(() => {
    setShowSessionIntentionPrompt(false);
  }, []);

  const selectSessionIntention = useCallback(
    async (intentionId) => {
      if (!isValidSessionIntentionId(intentionId)) return;
      if (sessionIntentionSubmitting) return;
      if (await chatService.isGuestChatMode()) return;
      if (isOffline) {
        showToast({ message: TEXTS.NETWORK_ERROR, type: 'warning' });
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
          setMessages(uniqueMessages.filter((m) => m.type !== 'quickReplies'));
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
          message: TEXTS.CONVERSATION_ERROR,
          type: 'error',
        });
      } finally {
        setSessionIntentionSubmitting(false);
      }
    },
    [isOffline, sessionIntentionSubmitting, showToast]
  );

  const handleMessageFeedback = useCallback(
    async (messageId, helpful) => {
      const id = String(messageId ?? '').trim();
      if (!/^[\da-f]{24}$/i.test(id)) return;
      if (isOffline) {
        showToast({
          message: TEXTS.FEEDBACK_OFFLINE,
          type: 'warning',
        });
        return;
      }
      if (feedbackRequestLockRef.current) return;
      feedbackRequestLockRef.current = true;
      setFeedbackSubmittingId(id);
      try {
        await chatService.submitMessageFeedback(id, helpful);
        setMessages((prev) =>
          prev.map((m) => {
            const mid = m._id || m.id;
            if (String(mid) !== id) return m;
            const nextMeta = { ...(m.metadata || {}) };
            if (helpful === null) {
              delete nextMeta.userFeedback;
            } else {
              nextMeta.userFeedback = { helpful };
            }
            return { ...m, metadata: nextMeta };
          })
        );
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        console.warn('[useChatScreen] Error enviando feedback:', e?.message || e);
        showToast({
          message: TEXTS.FEEDBACK_ERROR,
          type: 'error',
        });
      } finally {
        feedbackRequestLockRef.current = false;
        setFeedbackSubmittingId(null);
      }
    },
    [isOffline, showToast]
  );

  const handleSend = useCallback(async (presetText) => {
    const messageText =
      typeof presetText === 'string' && presetText.trim() !== ''
        ? presetText.trim()
        : inputText.trim();
    if (messageText === '') return;
    setShowSessionIntentionPrompt(false);

    if (isOffline) {
      try {
        await setOfflinePendingMessage(messageText);
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
          Alert.alert(TEXTS.GUEST_LIMIT_TITLE, TEXTS.GUEST_LIMIT_MESSAGE, [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Crear cuenta',
              onPress: async () => {
                try {
                  await chatService.clearGuestChat();
                } catch (_) {}
                navigation.navigate(ROUTES.REGISTER);
              },
            },
            {
              text: 'Iniciar sesión',
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

      await chatService.sendMessageStream(messageText, {
        onChunk(content) {
          pendingChunk += content;
          if (!flushTimer) {
            flushTimer = setTimeout(flushPendingChunk, 60); // ~16fps
          }
        },
        onDone(payload) {
          // Asegurar que no se pierdan chunks pendientes.
          if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
          }
          flushPendingChunk();

          if (payload.guest) {
            setGuestQuota({
              max: payload.guest.maxUserMessages,
              remaining: payload.guest.remainingAfterThis,
            });
          }

          setMessages((prev) => {
            const filtered = prev
              .filter((msg) => msg.id !== tempAssistantId)
              .filter((msg) => msg.type !== 'quickReplies');
            const finalAssistant = {
              id: payload.messageId || tempAssistantId,
              _id: payload.messageId || tempAssistantId,
              content: payload.content ?? '',
              role: MESSAGE_ROLES.ASSISTANT,
              type: MESSAGE_TYPES.TEXT,
              metadata: { timestamp: new Date().toISOString() },
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
                metadata: { timestamp: new Date().toISOString() },
              });
            }
            return next;
          });
          scrollToBottom(true, { force: false });
        },
      });
    } catch (err) {
      console.error('Error al enviar mensaje:', err);

      // Limpiar flush pendiente si hubo error.
      // (pendingChunk no afecta el state porque el message temporal se remueve abajo)
      if (flushTimer) {
        clearTimeout(flushTimer);
      }

      // Quitar mensajes temporales en error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id && msg.id !== tempAssistantId));

      const isNetworkError =
        err.message?.includes('Network request failed') ||
        err.message?.includes('network') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('timeout') ||
        !isConnected ||
        isOffline;

      if (isNetworkError) {
        try {
          await setOfflinePendingMessage(messageText);
          setOfflinePendingMessage(messageText);
        } catch (_) {}
        setIsTyping(false);
        return;
      }

      if (err.response?.status === 429 && err.response?.data?.code === 'MESSAGE_IN_FLIGHT') {
        showToast({
          message: err.response?.data?.message || 'Este mensaje ya se está enviando.',
          type: 'warning',
        });
        setInputText(messageText);
        setIsTyping(false);
        return;
      }

      if (err.code === 'STREAM_INCOMPLETE') {
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
                setMessages(uniqueMessages.filter((m) => m.type !== 'quickReplies'));
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
                setMessages(uniqueMessages.filter((m) => m.type !== 'quickReplies'));
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

      if (err.code === 'ETIMEDOUT') {
        showToast({
          message: err.message || 'La respuesta tardó demasiado. Intenta de nuevo.',
          type: 'warning',
        });
        setIsTyping(false);
        return;
      }

      if (err.guestAuthFailed) {
        setGuestQuota(null);
        Alert.alert(TEXTS.GUEST_SESSION_EXPIRED_TITLE, TEXTS.GUEST_SESSION_EXPIRED_MESSAGE, [
          {
            text: 'OK',
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
        setIsTyping(false);
        return;
      }

      if (err.code === 'RATE_LIMIT') {
        showToast({
          message: err.message || TEXTS.GUEST_RATE_LIMIT_TITLE,
          type: 'warning',
        });
        setIsTyping(false);
        return;
      }

      if (err.response?.status === 400 && err.response?.data?.code === 'GUEST_CONTENT_TOO_LONG') {
        showToast({
          message: err.message || TEXTS.ERROR_SEND,
          type: 'warning',
        });
        setIsTyping(false);
        return;
      }

      if (err.code === 'GUEST_LIMIT_REACHED' || err.requiresAccount) {
        Alert.alert(TEXTS.GUEST_LIMIT_TITLE, TEXTS.GUEST_LIMIT_MESSAGE, [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Crear cuenta',
            onPress: async () => {
              try {
                await chatService.clearGuestChat();
              } catch (_) {}
              navigation.navigate(ROUTES.REGISTER);
            },
          },
          {
            text: 'Iniciar sesión',
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
        err.message?.includes('suscripción') ||
        err.message?.includes('subscription') ||
        err.message?.includes('trial') ||
        err.message?.includes('Se requiere suscripción activa') ||
        (err.response?.status === 403 && err.response?.data?.requiresSubscription);

      if (isSubscriptionError) {
        const errorMessage =
          err.response?.data?.message ||
          getApiErrorMessage(err, { isOffline }) ||
          'Necesitas una suscripción activa para usar el chat. Tu período de prueba ha expirado.';
        Alert.alert('Suscripción requerida', errorMessage, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver planes', onPress: () => navigation.navigate('Subscription') },
        ]);
        setIsTyping(false);
        return;
      }

      if (
        err.message?.includes('No se pudo crear') ||
        (err.message?.includes('conversación') && !isSubscriptionError)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
            content: TEXTS.CONVERSATION_ERROR,
            role: MESSAGE_ROLES.ASSISTANT,
            type: MESSAGE_TYPES.ERROR,
            metadata: { timestamp: new Date().toISOString(), error: true },
          },
        ]);
        scrollToBottom(true, { force: true });
        setIsTyping(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
          content: TEXTS.ERROR_SEND,
          role: MESSAGE_ROLES.ASSISTANT,
          type: MESSAGE_TYPES.ERROR,
          metadata: { timestamp: new Date().toISOString(), error: true },
        },
      ]);
      scrollToBottom(true, { force: true });
    } finally {
      setIsTyping(false);
    }
    } finally {
      sendRequestInFlightRef.current = false;
    }
  }, [inputText, scrollToBottom, isConnected, isOffline, navigation, guestQuota]);

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
    try {
      await clearOfflinePendingMessage();
      setOfflinePendingMessage(null);
      await chatService.clearMessages();
      await initializeConversation();
      setShowClearModal(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}
    } catch (err) {
      console.error('Error al borrar la conversación:', err);
      setError(TEXTS.ERROR_CLEAR);
    }
  }, [initializeConversation]);

  const refreshMessages = useCallback(async () => {
    try {
      setRefreshing(true);
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
            setMessages(uniqueMessages);
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
          setMessages(uniqueMessages);
          const uc = uniqueMessages.filter((m) => m.role === 'user').length;
          setShowSessionIntentionPrompt(uc === 0 && !pack.sessionIntention);
        }
      }
    } catch (err) {
      console.error('[ChatScreen] Error al recargar mensajes:', err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const dispatchRootReset = useCallback(
    (state) => {
      let nav = navigation;
      while (nav?.getParent?.()) {
        nav = nav.getParent();
      }
      nav?.dispatch(CommonActions.reset(state));
    },
    [navigation]
  );

  const handleBack = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const target = await resolveChatBackTarget(route.params);
      await clearChatEntryBackTarget();

      if (!token) {
        dispatchRootReset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }
      if (target === 'home') {
        dispatchRootReset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }
      dispatchRootReset(getResetToMainTabsWithInicioState());
    } catch (err) {
      console.error('[ChatScreen] Error en goBack:', err);
      try {
        await clearChatEntryBackTarget();
        dispatchRootReset({ index: 0, routes: [{ name: 'Home' }] });
      } catch (e2) {
        console.error('[ChatScreen] goBack recuperación:', e2);
      }
    }
  }, [dispatchRootReset, route.params]);

  const guestHandoffStartFresh = useCallback(async () => {
    try {
      await chatService.clearGuestHandoff();
    } catch (_) {}
    setGuestHandoffModal(null);
  }, []);

  const guestHandoffUseSummary = useCallback(async () => {
    const summaryText = guestHandoffModal?.summaryText;
    if (!summaryText) return;
    const prefill = `Continuando desde el chat sin cuenta (podés editar esto antes de enviar):\n\n${summaryText}`;
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
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        await chatService.clearGuestHandoff();
        return;
      }
      if (!data?.summaryText) {
        await chatService.clearGuestHandoff();
        return;
      }
      guestHandoffUiShownRef.current = true;
      setGuestHandoffModal({
        summaryText: data.summaryText,
        messageCount: data.messageCount ?? 0,
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
      setMessages((prev) => {
        const messageId = message._id || message.id;
        if (!messageId) return prev;
        const exists = prev.some((msg) => msg._id === messageId || msg.id === messageId);
        if (exists) return prev;
        const newMessages = [...prev, message];
        chatService.saveMessages(newMessages);
        return newMessages;
      });
      requestAnimationFrame(() => {
        scrollToBottomStableRef.current?.(true, { force: false });
      });
      setTimeout(() => {
        scrollToBottomStableRef.current?.(true, { force: false });
      }, 100);
    });
    const errorUnsubscribe = chatService.onError((err) => {
      console.error('[ChatScreen] Error en el chat:', err.message || err);
      setError(TEXTS.ERROR_COMMUNICATION);
    });
    return () => {
      messageUnsubscribe();
      errorUnsubscribe();
      chatService.closeSocket();
    };
  }, [fadeAnim]);

  // WebSocket: alertas de emergencia
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          const userId = parsed._id || parsed.id;
          if (userId) await websocketService.connect(userId);
        }
      } catch (err) {
        console.error('[ChatScreen] Error conectando WebSocket:', err);
      }
    };
    connectWebSocket();
    const unsubscribeAlert = websocketService.on('emergency:alert:sent', (data) => {
      if (data && !data.isTest) {
        Alert.alert(
          '🚨 Alerta de Emergencia Enviada',
          `Hemos notificado a ${data.successfulSends} de ${data.totalContacts} contacto(s) de emergencia.`,
          [{ text: 'OK' }]
        );
      }
    });
    const unsubscribeError = websocketService.on('error', (err) => {
      console.error('[ChatScreen] Error en WebSocket:', err);
    });
    return () => {
      unsubscribeAlert();
      unsubscribeError();
      websocketService.disconnect();
    };
  }, []);

  // Auth: invitado (param o sesión guardada) o usuario con token
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) return;
        if (route.params?.startGuest === true) return;
        if (await chatService.isGuestChatMode()) return;
        navigation.reset({ index: 0, routes: [{ name: ROUTES.SIGN_IN }] });
      } catch (err) {
        console.error('[ChatScreen] Error verificando autenticación:', err);
        navigation.reset({ index: 0, routes: [{ name: ROUTES.SIGN_IN }] });
      }
    };
    checkAuthentication();
  }, [navigation, route.params?.startGuest]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (await chatService.isGuestChatMode()) {
          setTrialInfo(null);
        } else {
          loadTrialInfo();
        }
        const p = await getOfflinePendingMessage();
        setOfflinePendingMessage(p);
      })();
      initializeConversation();
      const handoffTimer = setTimeout(() => {
        offerGuestHandoffIfPending();
      }, 650);
      return () => {
        clearTimeout(handoffTimer);
        if (contentSizeScrollTimerRef.current) {
          clearTimeout(contentSizeScrollTimerRef.current);
          contentSizeScrollTimerRef.current = null;
        }
        setMessages([]);
        setShowSessionIntentionPrompt(false);
      };
    }, [loadTrialInfo, initializeConversation, offerGuestHandoffIfPending])
  );

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
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
    chatFeedbackEnabled,
    handleMessageFeedback,
    feedbackSubmittingId,
    showSessionIntentionPrompt,
    sessionIntentionSubmitting,
    selectSessionIntention,
    skipSessionIntention,
  };
}
