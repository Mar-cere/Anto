/**
 * @jest-environment node
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearChatEntryBackTarget,
  getChatEntryBackTarget,
  resolveChatBackTarget,
  setChatEntryBackTarget,
} from '../chatEntryContext';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn((k, v) => {
        store[k] = v;
        return Promise.resolve();
      }),
      getItem: jest.fn((k) => Promise.resolve(store[k] ?? null)),
      removeItem: jest.fn((k) => {
        delete store[k];
        return Promise.resolve();
      }),
      multiRemove: jest.fn(() => Promise.resolve()),
    },
  };
});

describe('chatEntryContext', () => {
  beforeEach(() => {
    AsyncStorage.removeItem.mockClear?.();
  });

  it('resolveChatBackTarget prioriza params sobre almacenamiento', async () => {
    await setChatEntryBackTarget('home');
    const r = await resolveChatBackTarget({ chatBackTarget: 'dash' });
    expect(r).toBe('dash');
  });

  it('resolveChatBackTarget usa storage si params vacíos', async () => {
    await setChatEntryBackTarget('home');
    const r = await resolveChatBackTarget({});
    expect(r).toBe('home');
  });

  it('resolveChatBackTarget default dash', async () => {
    await clearChatEntryBackTarget();
    const r = await resolveChatBackTarget(undefined);
    expect(r).toBe('dash');
  });
});
