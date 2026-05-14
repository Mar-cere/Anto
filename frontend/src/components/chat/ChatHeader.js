/**
 * Cabecera del chat: botón atrás, avatar, título, menú (opciones).
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ICON_SIZES, LAYOUT, TEXTS, useChatColors } from '../../screens/chat/chatScreenConstants';

const ANTO_AVATAR = require('../../images/Anto.png');

export default function ChatHeader({ onBack, onOpenMenu }) {
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
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerTitle: {
          color: chatColors.BOT_TEXT,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerAvatar: {
          width: LAYOUT.HEADER_AVATAR_SIZE,
          height: LAYOUT.HEADER_AVATAR_SIZE,
          borderRadius: 12,
          marginRight: 8,
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
        accessibilityLabel="Volver"
        accessibilityHint="Doble toque para salir del chat"
        style={styles.backButton}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={ICON_SIZES.BACK} color={chatColors.PRIMARY} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Image source={ANTO_AVATAR} style={styles.headerAvatar} />
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
