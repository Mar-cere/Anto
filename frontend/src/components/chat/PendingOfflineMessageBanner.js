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
    backgroundColor: 'rgba(255, 193, 7, 0.92)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    gap: 8,
  },
  text: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: CHAT_COLORS.INPUT_FIELD_BACKGROUND,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PendingOfflineMessageBanner;
