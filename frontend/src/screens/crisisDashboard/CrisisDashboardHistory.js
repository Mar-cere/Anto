/**
 * Historial reciente de crisis (lista de ítems)
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';

export function CrisisDashboardHistory({ history, formatDate, getRiskLevelColor, getRiskLevelText, onViewAll }) {
  if (!history || history.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{TEXTS.HISTORY}</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>{TEXTS.VIEW_ALL}</Text>
        </TouchableOpacity>
      </View>
      {history.map((crisis, index) => (
        <View key={crisis._id || index} style={styles.historyItem}>
          <View style={styles.historyHeader}>
            <View
              style={[styles.riskIndicator, { backgroundColor: getRiskLevelColor(crisis.riskLevel) }]}
            />
            <View style={styles.historyInfo}>
              <Text style={styles.historyDate}>{formatDate(crisis.detectedAt)}</Text>
              <Text style={styles.historyRisk}>{getRiskLevelText(crisis.riskLevel)}</Text>
            </View>
            {crisis.alerts?.sent && (
              <MaterialCommunityIcons name="bell" size={20} color="#1ADDDB" />
            )}
          </View>
          {crisis.triggerMessage?.contentPreview && (
            <Text style={styles.historyPreview} numberOfLines={2}>
              {crisis.triggerMessage.contentPreview}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
