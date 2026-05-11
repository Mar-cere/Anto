/**
 * Estado vacío: no hay crisis registradas
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useCrisisDashboardStyles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';

export function CrisisDashboardEmpty() {
  const { colors } = useTheme();
  const styles = useCrisisDashboardStyles();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
      <Text style={styles.emptyTitle}>{TEXTS.NO_CRISIS}</Text>
      <Text style={styles.emptyMessage}>{TEXTS.NO_CRISIS_MESSAGE}</Text>
    </View>
  );
}
