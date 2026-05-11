/**
 * Recursos de apoyo inmediato (contactos en Perfil y chat)
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCrisisDashboardStyles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';
import { useTheme } from '../../context/ThemeContext';
import { crisisSafeNavigate } from './crisisDashboardNavigate';

const SUPPORT_ICON_SIZE = 24;

export function CrisisDashboardSupportSection({ navigation }) {
  const styles = useCrisisDashboardStyles();
  const { colors } = useTheme();
  const goProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crisisSafeNavigate(navigation, 'MainTabs', { screen: 'Perfil' });
  };

  const goChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crisisSafeNavigate(navigation, 'MainTabs', { screen: 'Chat' });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.supportTitle}>{TEXTS.SUPPORT_TITLE}</Text>
      <Text style={styles.supportSubtitle}>{TEXTS.SUPPORT_SUBTITLE}</Text>

      <TouchableOpacity
        style={styles.supportAction}
        onPress={goProfile}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.SUPPORT_CONTACTS_CTA}
        accessibilityHint={TEXTS.SUPPORT_CONTACTS_HINT}
      >
        <MaterialCommunityIcons
          name="account-heart"
          size={SUPPORT_ICON_SIZE}
          color={colors.primary}
          style={styles.supportActionIcon}
        />
        <View style={styles.supportActionTextBlock}>
          <Text style={styles.supportActionTitle}>{TEXTS.SUPPORT_CONTACTS_CTA}</Text>
          <Text style={styles.supportActionHint}>{TEXTS.SUPPORT_CONTACTS_HINT}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={SUPPORT_ICON_SIZE}
          color={colors.textSecondary}
          style={styles.supportChevron}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.supportAction, styles.supportActionLast]}
        onPress={goChat}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.SUPPORT_CHAT_CTA}
        accessibilityHint={TEXTS.SUPPORT_CHAT_HINT}
      >
        <MaterialCommunityIcons
          name="chat-processing"
          size={SUPPORT_ICON_SIZE}
          color={colors.primary}
          style={styles.supportActionIcon}
        />
        <View style={styles.supportActionTextBlock}>
          <Text style={styles.supportActionTitle}>{TEXTS.SUPPORT_CHAT_CTA}</Text>
          <Text style={styles.supportActionHint}>{TEXTS.SUPPORT_CHAT_HINT}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={SUPPORT_ICON_SIZE}
          color={colors.textSecondary}
          style={styles.supportChevron}
        />
      </TouchableOpacity>
    </View>
  );
}
