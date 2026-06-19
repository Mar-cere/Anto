import React from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getModalKeyboardScrollProps } from '../../utils/modalKeyboardUtils';

/**
 * Scroll con teclado para bottom sheets de creación/edición.
 */
const ModalKeyboardScroll = React.forwardRef(
  ({ contentContainerStyle, style, children, keyboardProps, ...rest }, ref) => (
    <KeyboardAwareScrollView
      innerRef={ref}
      style={[{ flex: 1 }, style]}
      contentContainerStyle={contentContainerStyle}
      {...getModalKeyboardScrollProps(keyboardProps)}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  ),
);

ModalKeyboardScroll.displayName = 'ModalKeyboardScroll';

export default ModalKeyboardScroll;
