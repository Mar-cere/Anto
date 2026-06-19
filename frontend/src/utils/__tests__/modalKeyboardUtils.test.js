import { Keyboard } from 'react-native';
import {
  MODAL_KEYBOARD_EXTRA_HEIGHT,
  MODAL_KEYBOARD_EXTRA_SCROLL,
  MODAL_SHEET_MAX_HEIGHT,
  focusModalTextInput,
  getModalKeyboardScrollProps,
  runModalScrollHint,
  subscribeModalKeyboardVisibility,
} from '../modalKeyboardUtils';

describe('modalKeyboardUtils', () => {
  it('expone props de scroll con teclado para Android e iOS', () => {
    const props = getModalKeyboardScrollProps();
    expect(props.enableOnAndroid).toBe(true);
    expect(props.enableAutomaticScroll).toBe(true);
    expect(props.keyboardShouldPersistTaps).toBe('handled');
    expect(props.extraScrollHeight).toBe(MODAL_KEYBOARD_EXTRA_SCROLL);
    expect(props.extraHeight).toBe(MODAL_KEYBOARD_EXTRA_HEIGHT);
  });

  it('permite overrides sin perder defaults críticos', () => {
    const props = getModalKeyboardScrollProps({ extraScrollHeight: 80 });
    expect(props.extraScrollHeight).toBe(80);
    expect(props.enableAutomaticScroll).toBe(true);
  });

  it('suscribe visibilidad del teclado', () => {
    if (typeof Keyboard?.addListener !== 'function') {
      expect(typeof subscribeModalKeyboardVisibility).toBe('function');
      return;
    }
    const remove = jest.fn();
    const addListener = jest.spyOn(Keyboard, 'addListener').mockReturnValue({ remove });
    const onChange = jest.fn();
    const cleanup = subscribeModalKeyboardVisibility(onChange);
    expect(addListener).toHaveBeenCalled();
    expect(typeof cleanup).toBe('function');
    cleanup();
    addListener.mockRestore();
  });

  it('runModalScrollHint usa scrollToPosition cuando existe', () => {
    jest.useFakeTimers();
    const scrollToPosition = jest.fn();
    const scrollRef = { current: { scrollToPosition } };

    const cleanup = runModalScrollHint(scrollRef, { peekY: 18, delayMs: 100 });
    jest.advanceTimersByTime(100);
    expect(scrollToPosition).toHaveBeenCalledWith(0, 18, true);

    jest.advanceTimersByTime(340);
    expect(scrollToPosition).toHaveBeenCalledWith(0, 0, true);
    cleanup?.();
    jest.useRealTimers();
  });

  it('focusModalTextInput delega en scrollToFocusedInput', () => {
    const scrollToFocusedInput = jest.fn();
    const scrollRef = { current: { scrollToFocusedInput } };
    focusModalTextInput(scrollRef, { nativeEvent: { target: 42 } });
    expect(scrollToFocusedInput).toHaveBeenCalledWith(42, MODAL_KEYBOARD_EXTRA_SCROLL + 12);
  });

  it('sheet max height acotado para no taparse con teclado', () => {
    expect(MODAL_SHEET_MAX_HEIGHT).toBe('92%');
  });
});
