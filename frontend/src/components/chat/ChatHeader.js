/**
 * Cabecera del chat: glass overlay + atrás / menú planos (sin pastillas).
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ICON_SIZES,
  LAYOUT,
  useChatColors,
  useChatTexts,
} from '../../screens/chat/chatScreenConstants';

const HEADER_BLUR = Platform.OS === 'ios' ? 48 : 28;

export default function ChatHeader({ onBack, onOpenMenu }) {
  const TEXTS = useChatTexts();
  const { resolvedScheme } = useTheme();
  const chatColors = useChatColors();
  const insets = useSafeAreaInsets();
  const dark = resolvedScheme === 'dark';
  const topPad = Math.max(0, Number(insets?.top) || 0) + LAYOUT.HEADER_PADDING_BELOW_SAFE;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: chatColors.HEADER_BORDER,
          overflow: 'hidden',
        },
        headerBackground: {
          ...StyleSheet.absoluteFillObject,
        },
        headerBlur: {
          ...StyleSheet.absoluteFillObject,
        },
        headerTint: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor:
            Platform.OS === 'ios'
              ? dark
                ? chatColors.HEADER_TINT_DARK
                : chatColors.HEADER_TINT_LIGHT
              : dark
                ? chatColors.HEADER_TINT_DARK_FALLBACK
                : chatColors.HEADER_TINT_LIGHT_FALLBACK,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: topPad,
          paddingBottom: LAYOUT.HEADER_PADDING_BOTTOM,
          paddingHorizontal: LAYOUT.HEADER_PADDING_HORIZONTAL,
          zIndex: 1,
        },
        iconHit: {
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
        },
        iconPressed: {
          backgroundColor: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(30, 131, 211, 0.08)',
        },
      }),
    [chatColors, dark, topPad],
  );

  return (
    <View style={styles.header} accessibilityRole="header">
      <View style={styles.headerBackground} pointerEvents="none">
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={HEADER_BLUR}
            tint={dark ? 'dark' : 'light'}
            style={styles.headerBlur}
          />
        ) : null}
        <View style={styles.headerTint} />
      </View>
      <View style={styles.row}>
        <Pressable
          testID="chat-header-back"
          accessibilityRole="button"
          accessibilityLabel={TEXTS.HEADER_BACK_LABEL}
          accessibilityHint={TEXTS.HEADER_BACK_HINT}
          onPress={onBack}
          style={({ pressed }) => [styles.iconHit, pressed && styles.iconPressed]}
          hitSlop={4}
        >
          <Ionicons name="chevron-back" size={ICON_SIZES.BACK + 2} color={chatColors.PRIMARY} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.iconHit, pressed && styles.iconPressed]}
          onPress={onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.CHAT_MENU_A11Y_LABEL}
          accessibilityHint={TEXTS.CHAT_MENU_A11Y_HINT}
          hitSlop={4}
        >
          <Ionicons name="ellipsis-horizontal" size={ICON_SIZES.MENU} color={chatColors.ACCENT} />
        </Pressable>
      </View>
    </View>
  );
}
