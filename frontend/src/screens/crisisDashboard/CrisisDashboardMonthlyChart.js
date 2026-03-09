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
  if (!crisisByMonth || crisisByMonth.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{TEXTS.CRISIS_BY_MONTH}</Text>
      <View style={styles.chartContainer}>
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
      </View>
    </View>
  );
}
