/**
 * Gráfico de barras: Crisis por mes
 */
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useCrisisDashboardStyles } from './crisisDashboardStyles';
import {
  CHART_HEIGHT,
  createChartConfig,
  useCrisisDashboardTexts,
} from './crisisDashboardConstants';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export function CrisisDashboardMonthlyChart({ crisisByMonth, formatMonthlyData }) {
  const styles = useCrisisDashboardStyles();
  const { colors } = useTheme();
  const TEXTS = useCrisisDashboardTexts();
  const chartConfig = createChartConfig(colors);
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
            chartConfig={chartConfig}
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
