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
  const data = formatEmotionDistribution();
  const hasPie =
    emotionDistribution &&
    emotionDistribution.total > 0 &&
    Array.isArray(data) &&
    data.length > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{TEXTS.EMOTION_DISTRIBUTION}</Text>
      <Text style={styles.sectionSubtitle}>{TEXTS.EMOTION_DISTRIBUTION_PERIOD}</Text>
      <View style={styles.chartContainer}>
        {hasPie ? (
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
        ) : (
          <Text style={styles.sectionEmptyText}>{TEXTS.EMPTY_EMOTION_DISTRIBUTION}</Text>
        )}
      </View>
    </View>
  );
}
