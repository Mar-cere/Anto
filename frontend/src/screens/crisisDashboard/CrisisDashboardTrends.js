/**
 * Sección Tendencias Emocionales: selector de período + LineChart + texto de tendencia
 */
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './crisisDashboardStyles';
import { TEXTS, CHART_HEIGHT, CHART_CONFIG, TREND_PERIODS } from './crisisDashboardConstants';
import { colors } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');

export function CrisisDashboardTrends({
  trendPeriod,
  setTrendPeriod,
  formatTrendData,
  trends,
  getTrendLabel,
  getTrendIcon,
  getTrendIconColor,
}) {
  const trendLabel = getTrendLabel();
  const trendIcon = getTrendIcon();
  const trendIconColor = getTrendIconColor() || colors.primary;

  const hasTrendPoints = trends?.dataPoints?.length > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{TEXTS.TRENDS}</Text>
      <Text style={styles.sectionSubtitle}>{TEXTS.TRENDS_PERIOD_HINT}</Text>
      <View style={styles.periodSelectorContainer}>
        <View style={styles.periodSelector}>
          {TREND_PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, trendPeriod === period && styles.periodButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTrendPeriod(period);
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  trendPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {TEXTS[`PERIOD_${period.toUpperCase()}`]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.chartContainer}>
        {hasTrendPoints ? (
          <LineChart
            data={formatTrendData()}
            width={width - 40}
            height={CHART_HEIGHT}
            chartConfig={CHART_CONFIG}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines
            withVerticalLabels
            withHorizontalLabels
            withDots
            withShadow={false}
          />
        ) : (
          <Text style={styles.sectionEmptyText}>{TEXTS.EMPTY_TRENDS}</Text>
        )}
      </View>
      {hasTrendPoints && trendLabel && trendIcon && (
        <View style={styles.trendInfo}>
          <MaterialCommunityIcons name={trendIcon} size={20} color={trendIconColor} />
          <Text style={styles.trendText}>{trendLabel}</Text>
        </View>
      )}
    </View>
  );
}
