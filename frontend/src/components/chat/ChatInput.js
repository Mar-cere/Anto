/**
 * Área de entrada del chat: TextInput + botón enviar.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { CHAT_COLORS, ICON_SIZES, LAYOUT, TEXTS } from '../../screens/chat/chatScreenConstants';

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.INPUT_CONTAINER_PADDING_HORIZONTAL,
    paddingVertical: LAYOUT.INPUT_CONTAINER_PADDING_VERTICAL,
    backgroundColor: CHAT_COLORS.INPUT_BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: CHAT_COLORS.INPUT_BORDER,
    marginBottom: LAYOUT.INPUT_CONTAINER_MARGIN_BOTTOM,
    // Asegura que el input reciba toques incluso si hay overlays/botones absolutos arriba.
    zIndex: 10,
    elevation: 10,
  },
  input: {
    flex: 1,
    backgroundColor: CHAT_COLORS.INPUT_FIELD_BACKGROUND,
    borderRadius: LAYOUT.INPUT_BORDER_RADIUS,
    paddingHorizontal: LAYOUT.INPUT_PADDING_HORIZONTAL,
    paddingVertical: LAYOUT.INPUT_PADDING_VERTICAL,
    color: CHAT_COLORS.WHITE,
    maxHeight: LAYOUT.INPUT_MAX_HEIGHT,
    fontSize: 16,
  },
  sendButton: {
    width: LAYOUT.SEND_BUTTON_SIZE,
    height: LAYOUT.SEND_BUTTON_SIZE,
    borderRadius: LAYOUT.SEND_BUTTON_BORDER_RADIUS,
    backgroundColor: CHAT_COLORS.SEND_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: LAYOUT.SEND_BUTTON_MARGIN_LEFT,
  },
  sendButtonDisabled: {
    backgroundColor: CHAT_COLORS.SEND_BUTTON_DISABLED_BACKGROUND,
  },
});

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  inputRef,
  placeholder = TEXTS.PLACEHOLDER,
  maxLength = LAYOUT.MAX_MESSAGE_LENGTH,
  /** p. ej. invitado sin mensajes restantes */
  sendDisabled = false,
}) {
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
        placeholder={placeholder}
        placeholderTextColor={CHAT_COLORS.ACCENT}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={maxLength}
      />
      <TouchableOpacity
        style={[styles.sendButton, cannotSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={cannotSend}
      >
        <Ionicons
          name="send"
          size={ICON_SIZES.SEND}
          color={cannotSend ? CHAT_COLORS.ACCENT : CHAT_COLORS.PRIMARY}
        />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
