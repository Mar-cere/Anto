import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistoryStyles';
import { useEmergencyAlertsHistoryTexts } from './emergencyAlertsHistoryConstants';

export function EmergencyAlertsEmptyState({ onConfigureContacts }) {
  const { colors } = useTheme();
  const styles = useEmergencyAlertsHistoryStyles();
  const TEXTS = useEmergencyAlertsHistoryTexts();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>{TEXTS.NO_ALERTS}</Text>
      <Text style={styles.emptyMessage}>{TEXTS.NO_ALERTS_MESSAGE}</Text>
      <TouchableOpacity
        style={styles.emptyCtaButton}
        onPress={onConfigureContacts}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.CONFIGURE_CONTACTS}
      >
        <Text style={styles.emptyCtaButtonText}>{TEXTS.CONFIGURE_CONTACTS}</Text>
      </TouchableOpacity>
    </View>
  );
}
