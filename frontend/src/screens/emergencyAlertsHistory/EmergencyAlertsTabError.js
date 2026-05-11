/**
 * Error inline dentro de una pestaña (estadísticas / patrones)
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';

export function EmergencyAlertsTabError({ message, onRetry }) {
  const styles = useEmergencyAlertsHistoryStyles();
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
