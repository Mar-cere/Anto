/**
 * Gráfico de barras: Crisis por mes
 */
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { styles } from './crisisDashboardStyles';
import { TEXTS, CHART_HEIGHT, CHART_CONFIG } from './crisisDashboardConstants';

const { width } = Dimensions.get('window');

export function CrisisDashboardMonthlyChart({ crisisByMonth, formatMonthlyData }) {
  const hasBars =
    Array.isArray(crisisByMonth) &&
    crisisByMonth.length > 0 &&
    crisisByMonth.some((item) => (item?.crises ?? 0) > 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{TEXTS.CRISIS_BY_MONTH}</Text>
      <Text style={styles.sectionSubtitle}>{TEXTS.CRISIS_BY_MONTH_PERIOD}</Text>
      <View style={styles.chartContainer}>
        {hasBars ? (
          <BarChart
            data={formatMonthlyData()}
            width={width - 40}
            height={CHART_HEIGHT}
            chartConfig={CHART_CONFIG}
            style={styles.chart}
            withInnerLines={false}
            showValuesOnTopOfBars
            fromZero
          />
        ) : (
          <Text style={styles.sectionEmptyText}>{TEXTS.EMPTY_MONTHLY_CHART}</Text>
        )}
      </View>
    </View>
  );
}
