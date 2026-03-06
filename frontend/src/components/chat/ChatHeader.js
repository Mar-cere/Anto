/**
 * Cabecera del chat: botón atrás, avatar, título, menú (opciones).
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CHAT_COLORS, ICON_SIZES, LAYOUT, TEXTS } from '../../screens/chat/chatScreenConstants';

const ANTO_AVATAR = require('../../images/Anto.png');

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? LAYOUT.HEADER_PADDING_TOP_IOS : LAYOUT.HEADER_PADDING_TOP_ANDROID,
    paddingBottom: LAYOUT.HEADER_PADDING_BOTTOM,
    paddingHorizontal: LAYOUT.HEADER_PADDING_HORIZONTAL,
    backgroundColor: CHAT_COLORS.HEADER_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: CHAT_COLORS.HEADER_BORDER,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: CHAT_COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerAvatar: {
    width: LAYOUT.HEADER_AVATAR_SIZE,
    height: LAYOUT.HEADER_AVATAR_SIZE,
    borderRadius: 15,
    marginRight: 8,
  },
  menuButton: {
    padding: 10,
  },
});

export default function ChatHeader({ onBack, onOpenMenu }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={ICON_SIZES.BACK} color={CHAT_COLORS.PRIMARY} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Image source={ANTO_AVATAR} style={styles.headerAvatar} />
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
      </View>
      <TouchableOpacity style={styles.menuButton} onPress={onOpenMenu}>
        <Ionicons name="ellipsis-vertical" size={ICON_SIZES.MENU} color={CHAT_COLORS.WHITE} />
      </TouchableOpacity>
    </View>
  );
}
