/**
 * Hook con la lógica de estado y efectos de la pantalla de chat.
 * Centraliza: mensajes, carga, envío, limpieza, scroll, trial, websocket y auth.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';
import chatService from '../services/chatService';
import paymentService from '../services/paymentService';
import websocketService from '../services/websocketService';
import { useNetworkStatus } from './useNetworkStatus';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import {
  FADE_ANIMATION_DURATION,
  FADE_ANIMATION_TO_VALUE,
  MESSAGE_ID_PREFIXES,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  SCROLL_THRESHOLD,
  STORAGE_KEYS,
  TEXTS,
} from '../screens/chat/chatScreenConstants';

export function useChatScreen() {
  const navigation = useNavigation();
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

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    try {
      setIsLoading(true);
      await chatService.initializeSocket();
      const conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);

      if (conversationId) {
        const serverMessages = await chatService.getMessages(conversationId);
        if (serverMessages && serverMessages.length > 0) {
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
          setMessages(uniqueMessages);
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
      await chatService.saveMessages([welcomeMessage]);
    } catch (err) {
      console.error('[ChatScreen] Error al inicializar chat:', err.message);
      setError(TEXTS.ERROR_LOAD);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scrollToBottom = useCallback((animated = true) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated });
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (inputText.trim() === '') return;

    const messageText = inputText.trim();
    setInputText('');
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

    try {
      setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
      scrollToBottom(true);

      await chatService.sendMessageStream(messageText, {
        onChunk(content) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantId
                ? { ...msg, content: (msg.content || '') + content }
                : msg
            )
          );
          scrollToBottom(true);
        },
        onDone(payload) {
          setMessages((prev) => {
            const filtered = prev.filter((msg) => msg.id !== tempAssistantId);
            const finalAssistant = {
              id: payload.messageId || tempAssistantId,
              _id: payload.messageId || tempAssistantId,
              content: payload.content ?? '',
              role: MESSAGE_ROLES.ASSISTANT,
              type: MESSAGE_TYPES.TEXT,
              metadata: { timestamp: new Date().toISOString() },
            };
            const next = [...filtered, finalAssistant];
            if (payload.suggestions && payload.suggestions.length > 0) {
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
          scrollToBottom(true);
        },
      });
    } catch (err) {
      console.error('Error al enviar mensaje:', err);

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
        setMessages((prev) => [
          ...prev,
          {
            id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
            content: TEXTS.NETWORK_ERROR,
            role: MESSAGE_ROLES.ASSISTANT,
            type: MESSAGE_TYPES.ERROR,
            metadata: { timestamp: new Date().toISOString(), error: true, networkError: true },
          },
        ]);
        scrollToBottom(true);
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
        scrollToBottom(true);
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
      scrollToBottom(true);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, scrollToBottom, isConnected, isOffline, navigation]);

  const clearConversation = useCallback(async () => {
    try {
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
      const conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (conversationId) {
        const serverMessages = await chatService.getMessages(conversationId);
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
    } catch (err) {
      console.error('[ChatScreen] Error al recargar mensajes:', err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleBack = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }
      if (navigation.canGoBack()) {
        const parent = navigation.getParent();
        if (parent) {
          const parentState = parent.getState();
          const parentRoutes = parentState?.routes || [];
          if (parentRoutes.length > 1) {
            const previousRoute = parentRoutes[parentRoutes.length - 2];
            if (previousRoute?.name === 'Home') {
              parent.navigate('Home');
              return;
            }
          }
        }
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      console.error('[ChatScreen] Error en goBack:', err);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [navigation]);

  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowScrollButton(
      contentSize.height - contentOffset.y - layoutMeasurement.height > SCROLL_THRESHOLD
    );
  }, []);

  // Efecto inicial: init, animación, listeners de chat
  useEffect(() => {
    initializeConversation();
    loadTrialInfo();
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
  }, [initializeConversation, loadTrialInfo, fadeAnim]);

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

  // Auth check al montar
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
          return;
        }
      } catch (err) {
        console.error('[ChatScreen] Error verificando autenticación:', err);
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
      }
    };
    checkAuthentication();
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadTrialInfo();
      return () => setMessages([]);
    }, [loadTrialInfo])
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
    handleScroll,
    handleBack,
    isOffline,
    navigation,
  };
}
