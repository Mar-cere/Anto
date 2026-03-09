/**
 * Gráfico circular: Distribución de emociones
 */
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { styles } from './crisisDashboardStyles';
import { TEXTS, CHART_HEIGHT, PIE_CHART_CONFIG } from './crisisDashboardConstants';

const { width } = Dimensions.get('window');

export function CrisisDashboardEmotionPie({ emotionDistribution, formatEmotionDistribution }) {
  if (!emotionDistribution || emotionDistribution.total === 0) return null;

  const data = formatEmotionDistribution();
  if (data.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{TEXTS.EMOTION_DISTRIBUTION}</Text>
      <View style={styles.chartContainer}>
        <PieChart
          data={data}
          width={width - 40}
          height={CHART_HEIGHT}
          chartConfig={PIE_CHART_CONFIG}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
          absolute
        />
      </View>
    </View>
  );
}
