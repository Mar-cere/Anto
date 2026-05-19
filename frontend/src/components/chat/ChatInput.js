/**
 * Área de entrada del chat: TextInput + botón enviar.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  ICON_SIZES,
  LAYOUT,
  useChatColors,
  useChatTexts,
} from '../../screens/chat/chatScreenConstants';

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  inputRef,
  placeholder,
  maxLength = LAYOUT.MAX_MESSAGE_LENGTH,
  /** p. ej. invitado sin mensajes restantes */
  sendDisabled = false,
}) {
  const TEXTS = useChatTexts();
  const chatColors = useChatColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: LAYOUT.INPUT_CONTAINER_PADDING_HORIZONTAL,
          paddingVertical: LAYOUT.INPUT_CONTAINER_PADDING_VERTICAL,
          backgroundColor: chatColors.INPUT_BACKGROUND,
          borderTopWidth: 1,
          borderTopColor: chatColors.INPUT_BORDER,
          marginBottom: LAYOUT.INPUT_CONTAINER_MARGIN_BOTTOM,
          zIndex: 10,
          elevation: 10,
        },
        input: {
          flex: 1,
          backgroundColor: chatColors.INPUT_FIELD_BACKGROUND,
          borderRadius: LAYOUT.INPUT_BORDER_RADIUS,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: chatColors.INPUT_FIELD_BORDER,
          paddingHorizontal: LAYOUT.INPUT_PADDING_HORIZONTAL,
          paddingVertical: LAYOUT.INPUT_PADDING_VERTICAL,
          color: chatColors.BOT_TEXT,
          maxHeight: LAYOUT.INPUT_MAX_HEIGHT,
          fontSize: 16,
          lineHeight: 22,
        },
        sendButton: {
          width: LAYOUT.SEND_BUTTON_SIZE,
          height: LAYOUT.SEND_BUTTON_SIZE,
          borderRadius: LAYOUT.SEND_BUTTON_BORDER_RADIUS,
          backgroundColor: chatColors.SEND_BUTTON_BACKGROUND,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: chatColors.SEND_BUTTON_BORDER,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: LAYOUT.SEND_BUTTON_MARGIN_LEFT,
        },
        sendButtonDisabled: {
          backgroundColor: chatColors.SEND_BUTTON_DISABLED_BACKGROUND,
          borderColor: chatColors.INPUT_FIELD_BORDER,
        },
      }),
    [chatColors],
  );

  const isEmpty = (value || '').trim() === '';
  const cannotSend = isEmpty || sendDisabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? LAYOUT.KEYBOARD_VERTICAL_OFFSET_IOS : LAYOUT.KEYBOARD_VERTICAL_OFFSET_ANDROID
      }
      style={styles.inputContainer}
    >
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder || TEXTS.PLACEHOLDER}
        placeholderTextColor={chatColors.INPUT_PLACEHOLDER}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={maxLength}
        accessibilityLabel={TEXTS.INPUT_A11Y_LABEL}
        accessibilityHint={TEXTS.INPUT_A11Y_HINT}
      />
      <TouchableOpacity
        style={[styles.sendButton, cannotSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={cannotSend}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.INPUT_SEND_A11Y_LABEL}
        accessibilityState={{ disabled: cannotSend }}
      >
        <Ionicons
          name="send"
          size={ICON_SIZES.SEND}
          color={cannotSend ? chatColors.ACCENT : chatColors.PRIMARY}
        />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
