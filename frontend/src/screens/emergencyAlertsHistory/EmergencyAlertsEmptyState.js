import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';

export function EmergencyAlertsEmptyState({ onConfigureContacts }) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off" size={64} color="#A3B8E8" />
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
