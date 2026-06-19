import { findNodeHandle, Keyboard, Platform } from 'react-native';

/** Espacio extra sobre el teclado al enfocar un campo en bottom sheets. */
export const MODAL_KEYBOARD_EXTRA_SCROLL = Platform.OS === 'ios' ? 28 : 44;

/** Compensa header del sheet al auto-scroll. */
export const MODAL_KEYBOARD_EXTRA_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

export const MODAL_SHEET_MAX_HEIGHT = '92%';

/**
 * Props estándar para scroll con teclado en modales tipo sheet.
 * @param {Record<string, unknown>} [overrides]
 */
export function getModalKeyboardScrollProps(overrides = {}) {
  return {
    enableOnAndroid: true,
    enableAutomaticScroll: true,
    enableResetScrollToCoords: false,
    keyboardShouldPersistTaps: 'handled',
    showsVerticalScrollIndicator: false,
    extraScrollHeight: MODAL_KEYBOARD_EXTRA_SCROLL,
    extraHeight: MODAL_KEYBOARD_EXTRA_HEIGHT,
    keyboardOpeningTime: Platform.OS === 'ios' ? 0 : 250,
    bounces: Platform.OS === 'ios',
    overScrollMode: Platform.OS === 'android' ? 'auto' : 'never',
    ...overrides,
  };
}

/**
 * @param {(visible: boolean) => void} onChange
 * @returns {() => void} cleanup
 */
export function subscribeModalKeyboardVisibility(onChange) {
  const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
  const subShow = Keyboard.addListener(showEvt, () => onChange(true));
  const subHide = Keyboard.addListener(hideEvt, () => onChange(false));
  return () => {
    subShow.remove();
    subHide.remove();
  };
}

/**
 * Desplaza el campo activo por encima del teclado (KeyboardAwareScrollView).
 * @param {React.RefObject<{ scrollToFocusedInput?: Function, scrollToPosition?: Function }>} scrollRef
 * @param {import('react-native').NativeSyntheticEvent<import('react-native').TextInputFocusEventData>} event
 */
export function focusModalTextInput(scrollRef, event) {
  const scroll = scrollRef?.current;
  if (!scroll || !event) return;

  const target = event.nativeEvent?.target;
  if (target && typeof scroll.scrollToFocusedInput === 'function') {
    const node =
      typeof findNodeHandle === 'function'
        ? findNodeHandle(target) ?? target
        : target;
    if (node) {
      scroll.scrollToFocusedInput(node, MODAL_KEYBOARD_EXTRA_SCROLL + 12);
      return;
    }
  }

  if (typeof scroll.scrollToPosition === 'function') {
    requestAnimationFrame(() => {
      scroll.scrollToPosition(0, MODAL_KEYBOARD_EXTRA_HEIGHT, true);
    });
  }
}

/**
 * Hint de scroll al abrir el sheet (sin depender del tipo de ScrollView).
 */
export function runModalScrollHint(scrollRef, { peekY = 20, delayMs = 420 } = {}) {
  const scroll = scrollRef?.current;
  if (!scroll) return undefined;

  const timer = setTimeout(() => {
    if (typeof scroll.scrollToPosition === 'function') {
      scroll.scrollToPosition(0, peekY, true);
      setTimeout(() => scroll.scrollToPosition(0, 0, true), 340);
      return;
    }
    if (typeof scroll.scrollTo === 'function') {
      scroll.scrollTo({ y: peekY, animated: true });
      setTimeout(() => scroll.scrollTo({ y: 0, animated: true }), 340);
    }
  }, delayMs);

  return () => clearTimeout(timer);
}
