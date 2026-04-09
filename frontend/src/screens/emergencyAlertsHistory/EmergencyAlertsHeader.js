import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';
import { colors } from '../../styles/globalStyles';

export function EmergencyAlertsHeader({ onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver">
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
      <View style={styles.headerRight} />
    </View>
  );
}
