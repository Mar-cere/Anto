import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistoryStyles';
import { useEmergencyAlertsHistoryTexts } from './emergencyAlertsHistoryConstants';
import { useTheme } from '../../context/ThemeContext';
import { useProfileTexts } from '../profileScreen/profileScreenConstants';

export function EmergencyAlertsHeader({ onBack }) {
  const { colors } = useTheme();
  const TEXTS = useEmergencyAlertsHistoryTexts();
  const PROFILE = useProfileTexts();
  const styles = useEmergencyAlertsHistoryStyles();
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel={PROFILE.BACK}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
      <View style={styles.headerRight} />
    </View>
  );
}
