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

export function StatsTab({
  stats,
  formatRiskLevelData,
  formatStatusData,
  formatChannelData,
  formatDayData,
}) {
  if (!stats) return null;

  const riskData = formatRiskLevelData();
  const statusData = formatStatusData();
  const channelData = formatChannelData();
  const dayData = formatDayData();

  return (
    <View style={styles.tabContent}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{TEXTS.TOTAL_ALERTS}</Text>
        <Text style={styles.summaryValue}>{stats.total}</Text>
      </View>

      {riskData && (
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

      {statusData && statusData.length > 0 && (
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

      {channelData && (
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

      {dayData && dayData.labels?.length > 0 && (
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

      {stats.byContact && Object.keys(stats.byContact).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.BY_CONTACT}</Text>
          {Object.entries(stats.byContact).map(([email, contactStats]) => (
            <View key={email} style={styles.contactCard}>
              <Text style={styles.contactName}>{contactStats.name}</Text>
              <View style={styles.contactStats}>
                <View style={styles.contactStat}>
                  <Text style={styles.contactStatLabel}>{TEXTS.TOTAL}:</Text>
                  <Text style={styles.contactStatValue}>{contactStats.total}</Text>
                </View>
                <View style={styles.contactStat}>
                  <Text style={styles.contactStatLabel}>{TEXTS.EMAIL}:</Text>
                  <Text style={styles.contactStatValue}>
                    {contactStats.email?.sent} {TEXTS.SUCCESSFUL}
                  </Text>
                </View>
                <View style={styles.contactStat}>
                  <Text style={styles.contactStatLabel}>{TEXTS.WHATSAPP}:</Text>
                  <Text style={styles.contactStatValue}>
                    {contactStats.whatsapp?.sent} {TEXTS.SUCCESSFUL}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
