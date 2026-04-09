/**
 * Error inline dentro de una pestaña (estadísticas / patrones)
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';

export function EmergencyAlertsTabError({ message, onRetry }) {
  return (
    <View style={styles.tabErrorContainer}>
      <Text style={styles.tabErrorText}>{message}</Text>
      <TouchableOpacity
        style={styles.tabRetryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.RETRY_SECTION}
      >
        <Text style={styles.tabRetryButtonText}>{TEXTS.RETRY}</Text>
      </TouchableOpacity>
    </View>
  );
}
