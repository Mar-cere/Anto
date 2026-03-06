/**
 * Tests unitarios para el hook useNetworkStatus
 *
 * @author AntoApp Team
 */

import { renderHook, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../useNetworkStatus';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

describe('useNetworkStatus', () => {
  let fetchResolve;
  let listenerFn;

  beforeEach(() => {
    jest.clearAllMocks();
    NetInfo.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          fetchResolve = resolve;
        })
    );
    NetInfo.addEventListener.mockImplementation((fn) => {
      listenerFn = fn;
      return jest.fn();
    });
  });

  it('debe retornar un objeto con isConnected, isInternetReachable, type, details', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toMatchObject({
      isConnected: true,
      isInternetReachable: true,
      type: 'unknown',
      details: null,
    });
  });

  it('debe actualizar estado cuando NetInfo.fetch resuelve', async () => {
    const { result } = renderHook(() => useNetworkStatus());
    await act(async () => {
      fetchResolve({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: null,
      });
    });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isInternetReachable).toBe(false);
    expect(result.current.type).toBe('none');
  });

  it('debe suscribirse a NetInfo.addEventListener', () => {
    renderHook(() => useNetworkStatus());
    expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('debe actualizar estado cuando el listener recibe un cambio', async () => {
    const { result } = renderHook(() => useNetworkStatus());
    await act(async () => {
      fetchResolve({ isConnected: true, isInternetReachable: true, type: 'wifi', details: null });
    });
    expect(result.current.isConnected).toBe(true);
    await act(() => {
      listenerFn({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: null,
      });
    });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.type).toBe('none');
  });
});
