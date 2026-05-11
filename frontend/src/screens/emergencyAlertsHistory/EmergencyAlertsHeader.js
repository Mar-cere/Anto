import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';
import { useTheme } from '../../context/ThemeContext';

export function EmergencyAlertsHeader({ onBack }) {
  const { colors } = useTheme();
  const styles = useEmergencyAlertsHistoryStyles();
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver">
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
      <View style={styles.headerRight} />
    </View>
  );
}
