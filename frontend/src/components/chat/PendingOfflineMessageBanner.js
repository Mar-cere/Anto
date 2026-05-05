import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CHAT_COLORS } from '../../screens/chat/chatScreenConstants';
/**
 * Aviso de un único mensaje guardado para envío (sin red o fallo de red).
 */
const PendingOfflineMessageBanner = ({
  visible,
  isOffline,
  onRetry,
  hintText,
  retryLabel,
}) => {
  if (!visible) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={hintText}
    >
      <Text style={styles.text}>{hintText}</Text>
      {!isOffline && (
        <Pressable
          onPress={onRetry}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 217, 61, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 217, 61, 0.35)',
  },
  text: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: CHAT_COLORS.SEND_BUTTON_BACKGROUND,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CHAT_COLORS.SEND_BUTTON_BORDER,
  },
  buttonText: {
    color: CHAT_COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PendingOfflineMessageBanner;
