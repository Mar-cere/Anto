/**
 * Historial reciente de crisis (lista de ítems)
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import { useCrisisDashboardStyles } from './crisisDashboardStyles';
import { useCrisisDashboardTexts } from './crisisDashboardConstants';

export function CrisisDashboardHistory({ history, formatDate, getRiskLevelColor, getRiskLevelText, onViewAll }) {
  const { colors } = useTheme();
  const styles = useCrisisDashboardStyles();
  const TEXTS = useCrisisDashboardTexts();
  const items = Array.isArray(history) ? history : [];
  const hasItems = items.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.historyHeaderTextColumn}>
          <Text style={styles.sectionTitle}>{TEXTS.HISTORY}</Text>
          <Text style={styles.sectionSubtitle}>{TEXTS.HISTORY_RECENT_NOTE}</Text>
        </View>
        <TouchableOpacity onPress={onViewAll} accessibilityRole="button">
          <Text style={styles.viewAllText}>{TEXTS.VIEW_ALL}</Text>
        </TouchableOpacity>
      </View>
      {!hasItems && (
        <Text style={[styles.sectionEmptyText, { paddingVertical: SPACING.HERO_INSET_COMPACT }]}>{TEXTS.EMPTY_HISTORY_RECENT}</Text>
      )}
      {hasItems && items.map((crisis, index) => (
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
              <MaterialCommunityIcons name="bell" size={20} color={colors.primary} />
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
