/**
 * Resumen general: tarjetas de totales + nivel de riesgo promedio
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCrisisDashboardStyles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';
import { useTheme } from '../../context/ThemeContext';

export function CrisisDashboardSummary({ summary, getRiskLevelColor, getRiskLevelText }) {
  const styles = useCrisisDashboardStyles();
  const { colors } = useTheme();
  if (!summary) return null;

  const totalCrises = Number(summary.totalCrises) || 0;
  const crisesThisMonth = Number(summary.crisesThisMonth) || 0;
  const recentCrises = Number(summary.recentCrises) || 0;
  const rate = Number(summary.resolutionRate);
  const resolutionPct = Number.isFinite(rate)
    ? Math.round(Math.max(0, Math.min(1, rate)) * 100)
    : 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{TEXTS.SUMMARY}</Text>
      <Text style={styles.sectionSubtitle}>{TEXTS.SUMMARY_PERIOD_NOTE}</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="alert-circle" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{totalCrises}</Text>
          <Text style={styles.summaryLabel}>{TEXTS.TOTAL_CRISES}</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="calendar-month" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{crisesThisMonth}</Text>
          <Text style={styles.summaryLabel}>{TEXTS.THIS_MONTH}</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="clock-outline" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{recentCrises}</Text>
          <Text style={styles.summaryLabel}>{TEXTS.RECENT}</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="check-circle" size={32} color={colors.success} />
          <Text style={styles.summaryValue}>{resolutionPct}%</Text>
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
