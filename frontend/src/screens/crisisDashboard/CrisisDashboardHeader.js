/**
 * Cabecera del Dashboard de Crisis (atrás + título)
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCrisisDashboardStyles } from './crisisDashboardStyles';
import { useCrisisDashboardTexts } from './crisisDashboardConstants';
import { useTheme } from '../../context/ThemeContext';

export function CrisisDashboardHeader({ onBack }) {
  const { colors } = useTheme();
  const styles = useCrisisDashboardStyles();
  const TEXTS = useCrisisDashboardTexts();
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button">
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>{TEXTS.TITLE}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}
