import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'react-native';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';
import { colors } from '../../styles/globalStyles';

export function EmergencyAlertsLoadingView() {
  return (
    <View style={[styles.container, styles.loadingContainer]}>
      <StatusBar barStyle="light-content" />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
