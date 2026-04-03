/**
 * Tests unitarios para el hook useChatScreen.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Animated: {
    Value: jest.fn(() => ({ setValue: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn() })),
  },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));

const mockNavigation = { navigate: jest.fn(), reset: jest.fn(), goBack: jest.fn(), canGoBack: () => false, getParent: () => null };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
  useFocusEffect: () => {}, // no ejecutar callback para evitar limpieza que borra mensajes
}));

jest.mock('../../services/chatService', () => ({
  __esModule: true,
  default: {
    initializeSocket: jest.fn(() => Promise.resolve()),
    getMessages: jest.fn(() => Promise.resolve([])),
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
  MESSAGE_TYPES: { TEXT: 'text', ERROR: 'error', WELCOME: 'welcome', QUICK_REPLIES: 'quickReplies' },
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
    QUICK_REPLIES_TITLE: 'Rápidas',
    QUICK_REPLIES_TITLE_COMPACT: 'Compact',
    QUICK_REPLIES_DISMISS: 'Ocultar',
    QUICK_REPLIES_HINT: 'Hint',
    GUEST_HANDOFF_TITLE: 'Handoff',
    GUEST_HANDOFF_BODY: 'Body',
    GUEST_HANDOFF_PRIVACY: 'Privacidad',
    GUEST_HANDOFF_USE_SUMMARY: 'Usar',
    GUEST_HANDOFF_START_FRESH: 'Limpio',
    OFFLINE_PENDING_ONE: 'Pendiente',
    OFFLINE_PENDING_RETRY: 'Reintentar',
  },
}));

jest.mock('../../services/chatOfflinePending', () => ({
  getOfflinePendingMessage: jest.fn(() => Promise.resolve(null)),
  setOfflinePendingMessage: jest.fn(() => Promise.resolve()),
  clearOfflinePendingMessage: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../screens/chat/quickReplyChipsHelper', () => {
  const actual = jest.requireActual('../../screens/chat/quickReplyChipsHelper');
  return {
    ...actual,
    getQuickReplies: jest.fn(() => []),
  };
});

const mockAsyncStorage = {
  getItem: jest.fn((key) => {
    if (key === 'userToken') return Promise.resolve('token');
    if (key === 'userData') return Promise.resolve(JSON.stringify({ _id: 'user1' }));
    if (key === 'conversationId') return Promise.resolve(null);
    return Promise.resolve(null);
  }),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: mockAsyncStorage }));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 1 },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useChatScreen } from '../useChatScreen';

describe('useChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'userToken') return Promise.resolve('token');
      if (key === 'userData') return Promise.resolve(JSON.stringify({ _id: 'user1' }));
      return Promise.resolve(null);
    });
    const chatService = require('../../services/chatService').default;
    chatService.initializeSocket.mockResolvedValue(undefined);
    chatService.getMessages.mockResolvedValue([]);
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useChatScreen());
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

  it('setInputText debe actualizar inputText', () => {
    const { result } = renderHook(() => useChatScreen());
    expect(result.current.inputText).toBe('');
    act(() => {
      result.current.setInputText('Hola');
    });
    expect(result.current.inputText).toBe('Hola');
  });

  it('handleTrialBannerDismiss debe poner trialBannerDismissed en true', () => {
    const { result } = renderHook(() => useChatScreen());
    expect(result.current.trialBannerDismissed).toBe(false);
    act(() => {
      result.current.handleTrialBannerDismiss();
    });
    expect(result.current.trialBannerDismissed).toBe(true);
  });

  it('setShowClearModal debe actualizar showClearModal', () => {
    const { result } = renderHook(() => useChatScreen());
    expect(result.current.showClearModal).toBe(false);
    act(() => {
      result.current.setShowClearModal(true);
    });
    expect(result.current.showClearModal).toBe(true);
  });
});
