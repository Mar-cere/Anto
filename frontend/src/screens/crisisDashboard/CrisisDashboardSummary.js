/**
 * Resumen general: tarjetas de totales + nivel de riesgo promedio
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';
import { colors } from '../../styles/globalStyles';

export function CrisisDashboardSummary({ summary, getRiskLevelColor, getRiskLevelText }) {
  if (!summary) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{TEXTS.SUMMARY}</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="alert-circle" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{summary.totalCrises}</Text>
          <Text style={styles.summaryLabel}>{TEXTS.TOTAL_CRISES}</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="calendar-month" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{summary.crisesThisMonth}</Text>
          <Text style={styles.summaryLabel}>{TEXTS.THIS_MONTH}</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="clock-outline" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{summary.recentCrises}</Text>
          <Text style={styles.summaryLabel}>{TEXTS.RECENT}</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="check-circle" size={32} color="#4ECDC4" />
          <Text style={styles.summaryValue}>{Math.round(summary.resolutionRate * 100)}%</Text>
          <Text style={styles.summaryLabel}>{TEXTS.RESOLUTION_RATE}</Text>
        </View>
      </View>
      <View style={styles.riskCard}>
        <Text style={styles.riskLabel}>{TEXTS.AVERAGE_RISK}</Text>
        <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(summary.averageRiskLevel) }]}>
          <Text style={styles.riskText}>{getRiskLevelText(summary.averageRiskLevel)}</Text>
        </View>
      </View>
    </View>
  );
}
