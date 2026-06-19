import React from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistoryStyles';
import { useEmergencyAlertsHistoryTexts } from './emergencyAlertsHistoryConstants';
import { useTheme } from '../../context/ThemeContext';

export function EmergencyAlertsLoadingView() {
  const styles = useEmergencyAlertsHistoryStyles();
  const { colors, statusBarStyle } = useTheme();
  const TEXTS = useEmergencyAlertsHistoryTexts();
  return (
    <View style={[styles.container, styles.loadingContainer]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
