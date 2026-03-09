/**
 * Estado vacío: no hay crisis registradas
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';

export function CrisisDashboardEmpty() {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="check-circle" size={64} color="#4ECDC4" />
      <Text style={styles.emptyTitle}>{TEXTS.NO_CRISIS}</Text>
      <Text style={styles.emptyMessage}>{TEXTS.NO_CRISIS_MESSAGE}</Text>
    </View>
  );
}
