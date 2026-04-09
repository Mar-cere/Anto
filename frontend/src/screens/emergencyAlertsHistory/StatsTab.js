import React from 'react';
import { View, Text } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { styles } from './emergencyAlertsHistoryStyles';
import {
  TEXTS,
  CHART_HEIGHT,
  CHART_WIDTH,
  CHART_CONFIG,
  PIE_CHART_CONFIG,
} from './emergencyAlertsHistoryConstants';
import { safeNonNegativeInt } from './emergencyAlertsHistoryUtils';

export function StatsTab({
  stats,
  formatRiskLevelData,
  formatStatusData,
  formatChannelData,
  formatDayData,
}) {
  if (stats == null || typeof stats !== 'object' || Array.isArray(stats)) return null;

  const total = safeNonNegativeInt(stats.total, 0);
  const isEmpty = total === 0;

  const riskData = formatRiskLevelData();
  const statusData = formatStatusData();
  const channelData = formatChannelData();
  const dayData = formatDayData();

  return (
    <>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{TEXTS.TOTAL_ALERTS}</Text>
        <Text style={styles.summaryValue}>{total}</Text>
        <Text style={styles.summaryHint}>{TEXTS.STATS_TAB_SUMMARY_HINT}</Text>
      </View>

      {isEmpty ? (
        <View style={styles.statsTabEmptyWrap}>
          <Text style={styles.emptyTitle}>{TEXTS.STATS_TAB_EMPTY_TITLE}</Text>
          <Text style={styles.emptyMessage}>{TEXTS.STATS_TAB_EMPTY_MESSAGE}</Text>
        </View>
      ) : null}

      {!isEmpty && riskData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.BY_RISK_LEVEL}</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={riskData}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              chartConfig={CHART_CONFIG}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        </View>
      )}

      {!isEmpty && statusData && statusData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.BY_STATUS}</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={statusData}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              chartConfig={PIE_CHART_CONFIG}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        </View>
      )}

      {!isEmpty && channelData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.BY_CHANNEL}</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={channelData}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              chartConfig={CHART_CONFIG}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        </View>
      )}

      {!isEmpty && dayData && dayData.labels?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.BY_DAY}</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={dayData}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              chartConfig={CHART_CONFIG}
              bezier
              style={styles.chart}
            />
          </View>
        </View>
      )}

      {!isEmpty &&
        stats.byContact &&
        typeof stats.byContact === 'object' &&
        !Array.isArray(stats.byContact) &&
        Object.keys(stats.byContact).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.BY_CONTACT}</Text>
          {Object.entries(stats.byContact).map(([email, contactStats]) => {
            if (contactStats == null || typeof contactStats !== 'object') return null;
            const name =
              contactStats.name != null && String(contactStats.name).trim() !== ''
                ? String(contactStats.name)
                : email;
            return (
            <View key={email} style={styles.contactCard}>
              <Text style={styles.contactName}>{name}</Text>
              <View style={styles.contactStats}>
                <View style={styles.contactStat}>
                  <Text style={styles.contactStatLabel}>{TEXTS.TOTAL}:</Text>
                  <Text style={styles.contactStatValue}>
                    {safeNonNegativeInt(contactStats.total, 0)}
                  </Text>
                </View>
                <View style={styles.contactStat}>
                  <Text style={styles.contactStatLabel}>{TEXTS.EMAIL}:</Text>
                  <Text style={styles.contactStatValue}>
                    {safeNonNegativeInt(contactStats.email?.sent, 0)} {TEXTS.SUCCESSFUL}
                  </Text>
                </View>
                <View style={styles.contactStat}>
                  <Text style={styles.contactStatLabel}>{TEXTS.WHATSAPP}:</Text>
                  <Text style={styles.contactStatValue}>
                    {safeNonNegativeInt(contactStats.whatsapp?.sent, 0)} {TEXTS.SUCCESSFUL}
                  </Text>
                </View>
              </View>
            </View>
            );
          })}
        </View>
      )}
    </>
  );
}
