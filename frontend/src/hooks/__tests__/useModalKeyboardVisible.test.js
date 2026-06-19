import { renderHook } from '@testing-library/react-native';
import { subscribeModalKeyboardVisibility } from '../../utils/modalKeyboardUtils';
import { useModalKeyboardVisible } from '../useModalKeyboardVisible';

jest.mock('../../utils/modalKeyboardUtils', () => {
  const actual = jest.requireActual('../../utils/modalKeyboardUtils');
  return {
    ...actual,
    subscribeModalKeyboardVisibility: jest.fn(() => jest.fn()),
  };
});

describe('useModalKeyboardVisible', () => {
  beforeEach(() => {
    subscribeModalKeyboardVisibility.mockClear();
  });

  it('suscribe listeners al montar y limpia al desmontar', () => {
    const cleanup = jest.fn();
    subscribeModalKeyboardVisibility.mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useModalKeyboardVisible());
    expect(subscribeModalKeyboardVisibility).toHaveBeenCalledTimes(1);
    expect(typeof subscribeModalKeyboardVisibility.mock.calls[0][0]).toBe('function');

    unmount();
    expect(cleanup).toHaveBeenCalled();
  });

  it('inicia con teclado oculto', () => {
    const { result } = renderHook(() => useModalKeyboardVisible());
    expect(result.current).toBe(false);
  });
});
