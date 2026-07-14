/**
 * Composer del chat: dock glass hasta el home indicator + TextInput + enviar.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ICON_SIZES,
  LAYOUT,
  useChatColors,
  useChatTexts,
} from '../../screens/chat/chatScreenConstants';

const DOCK_BLUR = Platform.OS === 'ios' ? 48 : 36;

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
  const { resolvedScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const dark = resolvedScheme === 'dark';

  const bottomPad =
    Math.max(0, Number(insets?.bottom) || 0) + LAYOUT.INPUT_DOCK_PADDING_BOTTOM_EXTRA;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        avoiding: {
          zIndex: 10,
          elevation: 10,
        },
        dock: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: chatColors.INPUT_BORDER,
          paddingHorizontal: LAYOUT.INPUT_CONTAINER_PADDING_HORIZONTAL,
          paddingTop: LAYOUT.INPUT_CONTAINER_PADDING_VERTICAL,
          paddingBottom: bottomPad,
          shadowColor: chatColors.PRIMARY,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: dark ? 0.18 : 0.1,
          shadowRadius: 16,
          elevation: 8,
          overflow: 'hidden',
        },
        dockBackground: {
          ...StyleSheet.absoluteFillObject,
        },
        dockBlur: {
          ...StyleSheet.absoluteFillObject,
        },
        dockTint: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: dark
            ? chatColors.INPUT_DOCK_TINT_DARK
            : chatColors.INPUT_DOCK_TINT_LIGHT,
        },
        topAccent: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: StyleSheet.hairlineWidth * 2,
          backgroundColor: chatColors.INPUT_DOCK_TOP_LINE,
          opacity: dark ? 0.55 : 0.85,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          zIndex: 1,
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
          marginBottom: 1,
        },
        sendButtonDisabled: {
          backgroundColor: chatColors.SEND_BUTTON_DISABLED_BACKGROUND,
          borderColor: chatColors.INPUT_FIELD_BORDER,
        },
      }),
    [bottomPad, chatColors, dark],
  );

  const isEmpty = (value || '').trim() === '';
  const cannotSend = isEmpty || sendDisabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        Platform.OS === 'ios'
          ? LAYOUT.KEYBOARD_VERTICAL_OFFSET_IOS
          : LAYOUT.KEYBOARD_VERTICAL_OFFSET_ANDROID
      }
      style={styles.avoiding}
    >
      <View style={styles.dock}>
        <View style={styles.dockBackground} pointerEvents="none">
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={DOCK_BLUR}
              tint={dark ? 'dark' : 'light'}
              style={styles.dockBlur}
            />
          ) : null}
          <View style={styles.dockTint} />
          <View style={styles.topAccent} />
        </View>
        <View style={styles.row}>
          <TextInput
            testID="chat-message-input"
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
            testID="chat-send-button"
            style={[styles.sendButton, cannotSend && styles.sendButtonDisabled]}
            onPress={onSend}
            disabled={cannotSend}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.INPUT_SEND_A11Y_LABEL}
            accessibilityState={{ disabled: Boolean(cannotSend) }}
          >
            <Ionicons
              name="send"
              size={ICON_SIZES.SEND}
              color={cannotSend ? chatColors.ACCENT : chatColors.PRIMARY}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
