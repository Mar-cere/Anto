import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS, EMERGENCY_ERROR_DETAIL_MAX_LEN } from './emergencyAlertsHistoryConstants';

function sanitizeDetail(raw) {
  if (raw == null) return '';
  const s = typeof raw === 'string' ? raw : String(raw);
  if (s.length <= EMERGENCY_ERROR_DETAIL_MAX_LEN) return s;
  return `${s.slice(0, EMERGENCY_ERROR_DETAIL_MAX_LEN)}…`;
}

export function EmergencyAlertsErrorView({ onRetry, detail }) {
  const detailLine = sanitizeDetail(detail);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#FF6B6B" accessible={false} />
        <Text style={styles.errorText}>{TEXTS.ERROR}</Text>
        {detailLine.length > 0 ? (
          <Text style={styles.errorDetailText} accessibilityLabel={detailLine}>
            {detailLine}
          </Text>
        ) : null}
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} accessibilityRole="button" accessibilityLabel={TEXTS.RETRY}>
          <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
