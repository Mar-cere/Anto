/**
 * Tests unitarios para el hook useChatScreen.
 * @author AntoApp Team
 */

/* global beforeAll, beforeEach, describe, expect, it, jest */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn((_event, _handler) => ({
      remove: jest.fn(),
    })),
  },
  Animated: {
    Value: jest.fn(() => ({ setValue: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn() })),
  },
  InteractionManager: {
    runAfterInteractions: jest.fn((cb) => {
      if (typeof cb === 'function') cb();
      return { cancel: jest.fn() };
    }),
  },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));

jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('../../utils/chatEntryContext', () => ({
  resolveChatBackTarget: jest.fn(() => Promise.resolve('dash')),
  clearChatEntryBackTarget: jest.fn(() => Promise.resolve()),
}));

const mockNavigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
  goBack: jest.fn(),
  canGoBack: () => false,
  getParent: () => null,
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: { chatBackTarget: 'dash' } }),
  useFocusEffect: () => {}, // no ejecutar callback para evitar limpieza que borra mensajes
  CommonActions: { reset: (s) => ({ type: 'RESET', ...s }) },
}));

jest.mock('../../services/chatService', () => ({
  __esModule: true,
  default: {
    initializeSocket: jest.fn(() => Promise.resolve()),
    getMessages: jest.fn(() => Promise.resolve({ messages: [], sessionIntention: null })),
    createConversation: jest.fn(() => Promise.resolve('new-conv')),
    setSessionIntention: jest.fn(() => Promise.resolve({})),
    getGuestMessages: jest.fn(() => Promise.resolve([])),
    saveMessages: jest.fn(() => Promise.resolve()),
    sendMessage: jest.fn(() => Promise.resolve({ userMessage: {}, assistantMessage: {} })),
    sendMessageStream: jest.fn(() => Promise.resolve()),
    clearMessages: jest.fn(() => Promise.resolve()),
    onMessage: jest.fn(() => () => {}),
    onError: jest.fn(() => () => {}),
    closeSocket: jest.fn(),
    isGuestChatMode: jest.fn(() => Promise.resolve(false)),
    startGuestChatSession: jest.fn(() => Promise.resolve({})),
    clearGuestChat: jest.fn(() => Promise.resolve()),
    prepareGuestHandoffBeforeClear: jest.fn(() => Promise.resolve()),
    clearGuestHandoff: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../services/paymentService', () => ({
  __esModule: true,
  default: { getTrialInfo: jest.fn().mockResolvedValue({ success: true, isInTrial: false }) },
}));

jest.mock('../../services/websocketService', () => ({
  __esModule: true,
  default: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    on: jest.fn(() => () => {}),
  },
}));

jest.mock('../useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isConnected: true, isInternetReachable: true }),
}));
jest.mock('../../utils/apiErrorHandler', () => ({ getApiErrorMessage: (e) => e?.message || 'Error' }));
jest.mock('../../screens/chat/chatScreenConstants', () => ({
  FADE_ANIMATION_DURATION: 300,
  FADE_ANIMATION_TO_VALUE: 1,
  GUEST_MAX_USER_MESSAGES: 5,
  MESSAGE_ID_PREFIXES: { WELCOME: 'welcome', TEMP: 'temp', ERROR: 'error' },
  MESSAGE_ROLES: { USER: 'user', ASSISTANT: 'assistant' },
  MESSAGE_TYPES: { TEXT: 'text', ERROR: 'error', WELCOME: 'welcome' },
  SCROLL_THRESHOLD: 100,
  STORAGE_KEYS: {
    CONVERSATION_ID: 'conversationId',
    CHAT_MODE: 'chatMode',
    GUEST_TOKEN: 'guestChatToken',
    GUEST_CONVERSATION_ID: 'guestConversationId',
    GUEST_HANDOFF_PENDING: 'guestHandoffPending',
  },
  TEXTS: {
    WELCOME: 'Bienvenido',
    ERROR_LOAD: 'Error load',
    ERROR_SEND: 'Error send',
    ERROR_CLEAR: 'Error clear',
    ERROR_COMMUNICATION: 'Error communication',
    CONVERSATION_ERROR: 'Conversation error',
    NETWORK_ERROR: 'Network error',
    GUEST_LIMIT_TITLE: 'Límite',
    GUEST_LIMIT_MESSAGE: 'Mensaje límite',
    GUEST_SESSION_EXPIRED_TITLE: 'Sesión',
    GUEST_SESSION_EXPIRED_MESSAGE: 'Expiró',
    GUEST_RATE_LIMIT_TITLE: 'Rate',
    GUEST_CONTENT_TOO_LONG_TITLE: 'Largo',
    GUEST_HANDOFF_TITLE: 'Handoff',
    GUEST_HANDOFF_BODY: 'Body',
    GUEST_HANDOFF_PRIVACY: 'Privacidad',
    GUEST_HANDOFF_USE_SUMMARY: 'Usar',
    GUEST_HANDOFF_START_FRESH: 'Limpio',
    OFFLINE_PENDING_ONE: 'Pendiente',
    OFFLINE_PENDING_RETRY: 'Reintentar',
  },
  useChatTexts: () => ({
    WELCOME: 'Bienvenido',
    ERROR_LOAD: 'Error load',
    ERROR_SEND: 'Error send',
    ERROR_CLEAR: 'Error clear',
    ERROR_COMMUNICATION: 'Error communication',
    CONVERSATION_ERROR: 'Conversation error',
    NETWORK_ERROR: 'Network error',
    GUEST_LIMIT_TITLE: 'Límite',
    GUEST_LIMIT_MESSAGE: 'Mensaje límite',
    GUEST_SESSION_EXPIRED_TITLE: 'Sesión',
    GUEST_SESSION_EXPIRED_MESSAGE: 'Expiró',
    GUEST_RATE_LIMIT_TITLE: 'Rate',
    GUEST_CONTENT_TOO_LONG_TITLE: 'Largo',
    GUEST_HANDOFF_TITLE: 'Handoff',
    GUEST_HANDOFF_BODY: 'Body',
    GUEST_HANDOFF_PRIVACY: 'Privacidad',
    GUEST_HANDOFF_USE_SUMMARY: 'Usar',
    GUEST_HANDOFF_START_FRESH: 'Limpio',
    GUEST_HANDOFF_PREFILL_PREFIX: 'Continuando',
    OFFLINE_PENDING_ONE: 'Pendiente',
    OFFLINE_PENDING_RETRY: 'Reintentar',
    COMMON_OK: 'OK',
    COMMON_CANCEL: 'Cancelar',
    COMMON_CREATE_ACCOUNT: 'Crear cuenta',
    COMMON_SIGN_IN: 'Iniciar sesión',
    MESSAGE_IN_FLIGHT_DEFAULT: 'En vuelo',
    SEND_TIMEOUT_DEFAULT: 'Timeout',
    NETWORK_ERROR_INIT: 'Error init',
    SUBSCRIPTION_REQUIRED_DEFAULT: 'Suscripción requerida',
    SUBSCRIPTION_REQUIRED_TITLE: 'Suscripción requerida',
    SUBSCRIPTION_VIEW_PLANS: 'Ver planes',
    EMERGENCY_ALERT_SENT_TITLE: 'Alerta',
    EMERGENCY_ALERT_SENT_BODY: '{successful}/{total}',
  }),
}));

jest.mock('../../services/chatOfflinePending', () => ({
  getOfflinePendingMessage: jest.fn(() => Promise.resolve(null)),
  setOfflinePendingMessage: jest.fn(() => Promise.resolve()),
  clearOfflinePendingMessage: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = {
    getItem: jest.fn(),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  };
  return { __esModule: true, default: mock };
});

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 1 },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { useChatScreen } from '../useChatScreen';

describe('useChatScreen', () => {
  const flushInitialEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeAll(() => {
    global.requestAnimationFrame = jest.fn((cb) => {
      if (typeof cb === 'function') cb();
      return 0;
    });
    global.cancelAnimationFrame = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'userToken') return Promise.resolve('token');
      if (key === 'userData') return Promise.resolve(JSON.stringify({ _id: 'user1' }));
      return Promise.resolve(null);
    });
    const chatService = require('../../services/chatService').default;
    chatService.initializeSocket.mockResolvedValue(undefined);
    chatService.getMessages.mockResolvedValue({ messages: [], sessionIntention: null });
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useChatScreen());
    await flushInitialEffects();
    await act(async () => {
      await result.current.initializeConversation();
    });
    expect(result.current).toMatchObject({
      messages: expect.any(Array),
      inputText: '',
      isLoading: false,
      isTyping: false,
      showScrollButton: false,
      showClearModal: false,
      trialBannerDismissed: false,
      isOffline: false,
      guestHandoffModal: null,
    });
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('trialInfo');
    expect(typeof result.current.setInputText).toBe('function');
    expect(typeof result.current.handleSend).toBe('function');
    expect(typeof result.current.handleTrialBannerDismiss).toBe('function');
    expect(typeof result.current.scrollToBottom).toBe('function');
    expect(typeof result.current.refreshMessages).toBe('function');
    expect(typeof result.current.initializeConversation).toBe('function');
    expect(typeof result.current.guestHandoffStartFresh).toBe('function');
    expect(typeof result.current.guestHandoffUseSummary).toBe('function');
  });

  it('setInputText debe actualizar inputText', async () => {
    const { result } = renderHook(() => useChatScreen());
    await flushInitialEffects();
    expect(result.current.inputText).toBe('');
    act(() => {
      result.current.setInputText('Hola');
    });
    expect(result.current.inputText).toBe('Hola');
  });

  it('handleTrialBannerDismiss debe poner trialBannerDismissed en true', async () => {
    const { result } = renderHook(() => useChatScreen());
    await flushInitialEffects();
    expect(result.current.trialBannerDismissed).toBe(false);
    act(() => {
      result.current.handleTrialBannerDismiss();
    });
    expect(result.current.trialBannerDismissed).toBe(true);
  });

  it('setShowClearModal debe actualizar showClearModal', async () => {
    const { result } = renderHook(() => useChatScreen());
    await flushInitialEffects();
    expect(result.current.showClearModal).toBe(false);
    act(() => {
      result.current.setShowClearModal(true);
    });
    expect(result.current.showClearModal).toBe(true);
  });
});
