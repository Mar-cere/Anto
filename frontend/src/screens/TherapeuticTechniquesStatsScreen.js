/**
 * Pantalla de Estadísticas de Técnicas Terapéuticas
 * 
 * Muestra estadísticas detalladas del uso de técnicas terapéuticas
 * por el usuario, incluyendo técnicas más usadas, efectividad,
 * y uso por emoción y tipo.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import { api, ENDPOINTS } from '../config/api';
import { colors } from '../styles/globalStyles';

const { width } = Dimensions.get('window');

// Constantes de textos
const TEXTS = {
  TITLE: 'Estadísticas de Técnicas',
  LOADING: 'Cargando estadísticas...',
  ERROR: 'Error al cargar estadísticas',
  RETRY: 'Reintentar',
  GENERAL_STATS: 'Estadísticas Generales',
  MOST_USED: 'Técnicas Más Usadas',
  BY_EMOTION: 'Uso por Emoción',
  BY_TYPE: 'Uso por Tipo',
  USAGE_TREND: 'Tendencia de Uso (Últimos 30 días)',
  TOTAL_USES: 'Total de usos',
  COMPLETED: 'Completados',
  COMPLETION_RATE: 'Tasa de finalización',
  AVERAGE_DURATION: 'Duración promedio',
  AVERAGE_EFFECTIVENESS: 'Efectividad promedio',
  UNIQUE_TECHNIQUES: 'Técnicas únicas',
  UNIQUE_EMOTIONS: 'Emociones tratadas',
  MINUTES: 'min',
  SECONDS: 'seg',
  NO_DATA: 'No hay datos disponibles',
};

const TherapeuticTechniquesStatsScreen = () => {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(ENDPOINTS.THERAPEUTIC_TECHNIQUES_STATS);
      setStats(response.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Cargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  // Manejar refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  // Formatear duración
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} ${TEXTS.MINUTES} ${secs} ${TEXTS.SECONDS}`;
    }
    return `${secs} ${TEXTS.SECONDS}`;
  };

  // Formatear porcentaje
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Renderizar estadísticas generales
  const renderGeneralStats = () => {
    if (!stats?.general) return null;

    const { general } = stats;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.GENERAL_STATS}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="counter" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{general.totalUses || 0}</Text>
            <Text style={styles.statLabel}>{TEXTS.TOTAL_USES}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="check-circle" size={32} color={colors.success} />
            <Text style={styles.statValue}>{general.completedUses || 0}</Text>
            <Text style={styles.statLabel}>{TEXTS.COMPLETED}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="percent" size={32} color={colors.warning} />
            <Text style={styles.statValue}>
              {formatPercentage(general.completionRate)}
            </Text>
            <Text style={styles.statLabel}>{TEXTS.COMPLETION_RATE}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={32} color={colors.accent} />
            <Text style={styles.statValue}>
              {formatDuration(general.averageDuration)}
            </Text>
            <Text style={styles.statLabel}>{TEXTS.AVERAGE_DURATION}</Text>
          </View>
          {general.averageEffectiveness !== null && (
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="star" size={32} color={colors.warning} />
              <Text style={styles.statValue}>
                {general.averageEffectiveness?.toFixed(1) || 'N/A'}
              </Text>
              <Text style={styles.statLabel}>{TEXTS.AVERAGE_EFFECTIVENESS}</Text>
            </View>
          )}
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="book-open-variant" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{general.uniqueTechniques || 0}</Text>
            <Text style={styles.statLabel}>{TEXTS.UNIQUE_TECHNIQUES}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Renderizar técnicas más usadas
  const renderMostUsed = () => {
    if (!stats?.mostUsed || stats.mostUsed.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.MOST_USED}</Text>
        <View style={styles.listContainer}>
          {stats.mostUsed.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.techniqueName}</Text>
                <Text style={styles.listItemSubtitle}>
                  {item.techniqueType} • {item.count} {item.count === 1 ? 'uso' : 'usos'}
                </Text>
              </View>
              {item.averageEffectiveness !== null && (
                <View style={styles.effectivenessBadge}>
                  <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
                  <Text style={styles.effectivenessText}>
                    {item.averageEffectiveness.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Renderizar gráfico por emoción
  const renderByEmotion = () => {
    if (!stats?.byEmotion || stats.byEmotion.length === 0) return null;

    const chartData = {
      labels: stats.byEmotion.map(item => item.emotion.substring(0, 6)),
      datasets: [{
        data: stats.byEmotion.map(item => item.count),
      }],
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.BY_EMOTION}</Text>
        <BarChart
          data={chartData}
          width={width - 60}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: colors.cardBackground,
            backgroundGradientFrom: colors.cardBackground,
            backgroundGradientTo: colors.cardBackground,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(29, 27, 112, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>
    );
  };

  // Renderizar gráfico por tipo
  const renderByType = () => {
    if (!stats?.byType || stats.byType.length === 0) return null;

    const colorsArray = [colors.primary, colors.success, colors.warning, colors.accent];
    const pieData = stats.byType.map((item, index) => ({
      name: item.type,
      count: item.count,
      color: colorsArray[index % colorsArray.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.BY_TYPE}</Text>
        <PieChart
          data={pieData}
          width={width - 60}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>
    );
  };

  // Renderizar tendencia de uso
  const renderUsageTrend = () => {
    if (!stats?.usageByDay || stats.usageByDay.length === 0) return null;

    const chartData = {
      labels: stats.usageByDay.map((item, index) => {
        if (index % 5 === 0 || index === stats.usageByDay.length - 1) {
          const date = new Date(item.date);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }
        return '';
      }),
      datasets: [{
        data: stats.usageByDay.map(item => item.count),
        color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
        strokeWidth: 3,
      }],
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.USAGE_TREND}</Text>
        <LineChart
          data={chartData}
          width={width - 60}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: colors.cardBackground,
            backgroundGradientFrom: colors.cardBackground,
            backgroundGradientTo: colors.cardBackground,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
          bezier
        />
      </View>
    );
  };

  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!stats || (!stats.general || stats.general.totalUses === 0)) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="chart-line" size={48} color={colors.accent} />
          <Text style={styles.emptyText}>{TEXTS.NO_DATA}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderGeneralStats()}
        {renderMostUsed()}
        {renderByEmotion()}
        {renderByType()}
        {renderUsageTrend()}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton />
      {renderContent()}
      <FloatingNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    width: (width - 60) / 2 - 7.5,
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  effectivenessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.warning}20`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  effectivenessText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TherapeuticTechniquesStatsScreen;

