import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS } from './emergencyAlertsHistoryConstants';
import { colors } from '../../styles/globalStyles';
import { countPatternPeriodAlerts } from './emergencyAlertsHistoryUtils';

export function PatternsTab({ patterns }) {
  if (patterns == null || typeof patterns !== 'object' || Array.isArray(patterns)) {
    return null;
  }

  const totalInPeriod = countPatternPeriodAlerts(patterns);
  const insufficient = totalInPeriod < 2;

  return (
    <>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{TEXTS.PATTERNS_TAB_SUMMARY_TITLE}</Text>
        <Text style={styles.summaryValue}>{totalInPeriod}</Text>
        <Text style={styles.summaryHint}>{TEXTS.PATTERNS_TAB_SUMMARY_HINT}</Text>
      </View>

      {insufficient ? (
        <View style={styles.statsTabEmptyWrap}>
          <Text style={styles.emptyTitle}>{TEXTS.PATTERNS_TAB_EMPTY_TITLE}</Text>
          <Text style={styles.emptyMessage}>{TEXTS.PATTERNS_TAB_EMPTY_MESSAGE}</Text>
        </View>
      ) : null}

      {!insufficient && patterns.frequency && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.FREQUENCY}</Text>
          <View style={styles.patternCard}>
            <View style={styles.patternRow}>
              <MaterialCommunityIcons
                name={
                  patterns.frequency.increasing
                    ? 'trending-up'
                    : patterns.frequency.decreasing
                      ? 'trending-down'
                      : 'trending-neutral'
                }
                size={24}
                color={
                  patterns.frequency.increasing
                    ? '#FF6B6B'
                    : patterns.frequency.decreasing
                      ? '#4ECDC4'
                      : colors.primary
                }
              />
              <Text style={styles.patternText}>
                {patterns.frequency.increasing
                  ? TEXTS.INCREASING
                  : patterns.frequency.decreasing
                    ? TEXTS.DECREASING
                    : TEXTS.STABLE}
              </Text>
            </View>
          </View>
        </View>
      )}

      {!insufficient && patterns.riskLevelTrend && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.RISK_TREND}</Text>
          <View style={styles.patternCard}>
            <View style={styles.patternRow}>
              <MaterialCommunityIcons
                name={
                  patterns.riskLevelTrend.escalating
                    ? 'arrow-up'
                    : patterns.riskLevelTrend.improving
                      ? 'arrow-down'
                      : 'minus'
                }
                size={24}
                color={
                  patterns.riskLevelTrend.escalating
                    ? '#FF6B6B'
                    : patterns.riskLevelTrend.improving
                      ? '#4ECDC4'
                      : colors.primary
                }
              />
              <Text style={styles.patternText}>
                {patterns.riskLevelTrend.escalating
                  ? TEXTS.ESCALATING
                  : patterns.riskLevelTrend.improving
                    ? TEXTS.IMPROVING
                    : TEXTS.STABLE}
              </Text>
            </View>
          </View>
        </View>
      )}

      {!insufficient && patterns.timePatterns && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.TIME_PATTERNS}</Text>
          {patterns.timePatterns.mostCommonDays?.length > 0 && (
            <View style={styles.patternCard}>
              <Text style={styles.patternSubtitle}>{TEXTS.MOST_COMMON_DAYS}</Text>
              {patterns.timePatterns.mostCommonDays.map((day, index) => (
                <View key={index} style={styles.patternItem}>
                  <Text style={styles.patternItemText}>{day.day}: {day.count} alertas</Text>
                </View>
              ))}
            </View>
          )}
          {patterns.timePatterns.mostCommonHours?.length > 0 && (
            <View style={styles.patternCard}>
              <Text style={styles.patternSubtitle}>{TEXTS.MOST_COMMON_HOURS}</Text>
              {patterns.timePatterns.mostCommonHours.map((hour, index) => (
                <View key={index} style={styles.patternItem}>
                  <Text style={styles.patternItemText}>{hour.hour}:00 - {hour.count} alertas</Text>
                </View>
              ))}
            </View>
          )}
          {patterns.timePatterns.weekendVsWeekday &&
            (patterns.timePatterns.weekendVsWeekday.weekend > 0 ||
              patterns.timePatterns.weekendVsWeekday.weekday > 0) && (
            <View style={styles.patternCard}>
              <Text style={styles.patternSubtitle}>{TEXTS.PATTERNS_WEEKEND_VS_WEEKDAY}</Text>
              <View style={styles.patternItem}>
                <Text style={styles.patternItemText}>
                  {TEXTS.WEEKEND}: {patterns.timePatterns.weekendVsWeekday.weekend} alertas
                </Text>
              </View>
              <View style={styles.patternItem}>
                <Text style={styles.patternItemText}>
                  {TEXTS.WEEKDAY}: {patterns.timePatterns.weekendVsWeekday.weekday} alertas
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {!insufficient && patterns.contactReliability && Object.keys(patterns.contactReliability).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.CONTACT_RELIABILITY}</Text>
          {Object.entries(patterns.contactReliability).map(([email, reliability]) => (
            <View key={email} style={styles.patternCard}>
              <Text style={styles.contactName}>{reliability.name}</Text>
              <View style={styles.reliabilityStats}>
                <Text style={styles.reliabilityText}>
                  {TEXTS.SUCCESS_RATE}: {reliability.total > 0 ? Math.round((reliability.successful / reliability.total) * 100) : 0}%
                </Text>
                <Text style={styles.reliabilityText}>
                  {reliability.successful} {TEXTS.SUCCESSFUL} / {reliability.total} {TEXTS.TOTAL}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {patterns.recommendations?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.RECOMMENDATIONS}</Text>
          {patterns.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationCard}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color="#FFA500" />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}
