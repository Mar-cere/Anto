import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTccContinuity } from '../chatService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('../../utils/chatAccessGate', () => ({
  canAttemptChatAccess: jest.fn().mockResolvedValue(true),
  assertChatAccessOrThrow: jest.fn(),
}));

jest.mock('../../config/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
  ENDPOINTS: {
    CHAT_TCC_CONTINUITY: '/api/chat/tcc-continuity',
  },
  getAppLanguage: jest.fn().mockResolvedValue('es'),
}));

const api = require('../../config/api').default;

describe('fetchTccContinuity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'userToken') return Promise.resolve('token');
      if (key === 'guestChatMode') return Promise.resolve(null);
      return Promise.resolve(null);
    });
  });

  it('no llama API sin conversationId válido', async () => {
    const items = await fetchTccContinuity('');
    expect(items).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('no llama API con conversationId malformado', async () => {
    const items = await fetchTccContinuity('abc');
    expect(items).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('pasa conversationId como query param plano', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { items: [{ id: 'ba:s1', screen: 'BehavioralActivation' }] },
    });

    const items = await fetchTccContinuity('507f1f77bcf86cd799439011');

    expect(api.get).toHaveBeenCalledWith('/api/chat/tcc-continuity', {
      conversationId: '507f1f77bcf86cd799439011',
    });
    expect(items).toHaveLength(1);
  });

  it('lee items desde data.data.items (wrapper legacy)', async () => {
    api.get.mockResolvedValue({
      data: {
        data: {
          items: [{ id: 'abc:r1', screen: 'AbcRecord' }],
        },
      },
    });

    const items = await fetchTccContinuity('507f1f77bcf86cd799439011');
    expect(items[0].id).toBe('abc:r1');
  });
});
