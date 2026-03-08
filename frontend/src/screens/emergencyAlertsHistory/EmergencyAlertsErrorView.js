import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';

export function EmergencyAlertsErrorView({ onRetry }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{TEXTS.ERROR}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} accessibilityRole="button" accessibilityLabel={TEXTS.RETRY}>
          <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
