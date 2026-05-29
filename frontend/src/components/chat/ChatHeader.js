/**
 * Cabecera del chat: botón atrás, título, menú (opciones).
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  ICON_SIZES,
  LAYOUT,
  useChatColors,
  useChatTexts,
} from '../../screens/chat/chatScreenConstants';

export default function ChatHeader({ onBack, onOpenMenu }) {
  const TEXTS = useChatTexts();
  const { colors } = useTheme();
  const chatColors = useChatColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop:
            Platform.OS === 'ios' ? LAYOUT.HEADER_PADDING_TOP_IOS : LAYOUT.HEADER_PADDING_TOP_ANDROID,
          paddingBottom: LAYOUT.HEADER_PADDING_BOTTOM,
          paddingHorizontal: LAYOUT.HEADER_PADDING_HORIZONTAL,
          backgroundColor: chatColors.HEADER_BACKGROUND,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: chatColors.HEADER_BORDER,
        },
        backButton: {
          padding: 8,
          borderRadius: 12,
          backgroundColor: colors.chromeHeaderBack,
        },
        headerTitleContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          color: chatColors.BOT_TEXT,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        menuButton: {
          padding: 10,
          borderRadius: 12,
          backgroundColor: colors.chromeHeaderProfile,
        },
      }),
    [chatColors, colors.chromeHeaderBack, colors.chromeHeaderProfile],
  );

  return (
    <View style={styles.header}>
      <TouchableOpacity
        testID="chat-header-back"
        accessibilityRole="button"
        accessibilityLabel={TEXTS.HEADER_BACK_LABEL}
        accessibilityHint={TEXTS.HEADER_BACK_HINT}
        style={styles.backButton}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={ICON_SIZES.BACK} color={chatColors.PRIMARY} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
      </View>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.CHAT_MENU_A11Y_LABEL}
        accessibilityHint={TEXTS.CHAT_MENU_A11Y_HINT}
      >
        <Ionicons name="ellipsis-vertical" size={ICON_SIZES.MENU} color={chatColors.ACCENT} />
      </TouchableOpacity>
    </View>
  );
}
