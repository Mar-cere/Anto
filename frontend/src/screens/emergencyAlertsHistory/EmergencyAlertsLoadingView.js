import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'react-native';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';
import { useTheme } from '../../context/ThemeContext';

export function EmergencyAlertsLoadingView() {
  const styles = useEmergencyAlertsHistoryStyles();
  const { colors, statusBarStyle } = useTheme();
  return (
    <View style={[styles.container, styles.loadingContainer]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
