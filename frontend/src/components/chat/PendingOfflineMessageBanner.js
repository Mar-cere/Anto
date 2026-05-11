import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useChatColors } from '../../screens/chat/chatScreenConstants';
import { SPACING } from '../../constants/ui';
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
  const { colors, resolvedScheme } = useTheme();
  const chatColors = useChatColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor:
            resolvedScheme === 'dark' ? 'rgba(255, 217, 61, 0.14)' : 'rgba(255, 217, 61, 0.12)',
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          gap: 10,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor:
            resolvedScheme === 'dark' ? 'rgba(255, 217, 61, 0.4)' : 'rgba(255, 217, 61, 0.35)',
        },
        text: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: 19,
        },
        button: {
          paddingVertical: 10,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 14,
          backgroundColor: chatColors.SEND_BUTTON_BACKGROUND,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: chatColors.SEND_BUTTON_BORDER,
        },
        buttonText: {
          color: chatColors.PRIMARY,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [chatColors, colors.text, resolvedScheme],
  );

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

export default PendingOfflineMessageBanner;
