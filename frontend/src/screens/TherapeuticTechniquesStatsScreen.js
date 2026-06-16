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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import { api, ENDPOINTS } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';
import { useMappedSectionTexts } from '../hooks/useTranslations';
import AbcMacroPatternsCard from '../components/abc/AbcMacroPatternsCard';

const { width } = Dimensions.get('window');

// Constantes de textos
const DEFAULT_TEXTS = {
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
  NA: 'N/A',
  USE_SINGULAR: 'uso',
  USE_PLURAL: 'usos',
  DEV_GRAPH_LINK: 'Grafo de sugerencias del chat (interno)',
  GRAPH_ENTRY_LINK: 'Tu mapa de temas e intervenciones',
};

const THERAPEUTIC_STATS_TEXT_MAP = {
  TITLE: 'THERAPEUTIC_STATS_TITLE',
  LOADING: 'THERAPEUTIC_STATS_LOADING',
  ERROR: 'THERAPEUTIC_STATS_ERROR',
  RETRY: 'THERAPEUTIC_STATS_RETRY',
  GENERAL_STATS: 'THERAPEUTIC_STATS_GENERAL_STATS',
  MOST_USED: 'THERAPEUTIC_STATS_MOST_USED',
  BY_EMOTION: 'THERAPEUTIC_STATS_BY_EMOTION',
  BY_TYPE: 'THERAPEUTIC_STATS_BY_TYPE',
  USAGE_TREND: 'THERAPEUTIC_STATS_USAGE_TREND',
  TOTAL_USES: 'THERAPEUTIC_STATS_TOTAL_USES',
  COMPLETED: 'THERAPEUTIC_STATS_COMPLETED',
  COMPLETION_RATE: 'THERAPEUTIC_STATS_COMPLETION_RATE',
  AVERAGE_DURATION: 'THERAPEUTIC_STATS_AVERAGE_DURATION',
  AVERAGE_EFFECTIVENESS: 'THERAPEUTIC_STATS_AVERAGE_EFFECTIVENESS',
  UNIQUE_TECHNIQUES: 'THERAPEUTIC_STATS_UNIQUE_TECHNIQUES',
  UNIQUE_EMOTIONS: 'THERAPEUTIC_STATS_UNIQUE_EMOTIONS',
  MINUTES: 'THERAPEUTIC_STATS_MINUTES',
  SECONDS: 'THERAPEUTIC_STATS_SECONDS',
  NO_DATA: 'THERAPEUTIC_STATS_NO_DATA',
  NA: 'THERAPEUTIC_STATS_NA',
  USE_SINGULAR: 'THERAPEUTIC_STATS_USE_SINGULAR',
  USE_PLURAL: 'THERAPEUTIC_STATS_USE_PLURAL',
  DEV_GRAPH_LINK: 'INTERVENTION_GRAPH_DEV_LINK',
  GRAPH_ENTRY_LINK: 'INTERVENTION_GRAPH_ENTRY_LINK',
};

const TherapeuticTechniquesStatsScreen = () => {
  const navigation = useNavigation();
  const TEXTS = useMappedSectionTexts('TECHNIQUES', DEFAULT_TEXTS, THERAPEUTIC_STATS_TEXT_MAP);
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const abcDateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          padding: SPACING.SCREEN_EDGE_INSET,
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
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
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
          padding: SPACING.SCREEN_EDGE_INSET,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
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
          padding: SPACING.SCREEN_EDGE_INSET,
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
        emptyScrollContent: {
          flexGrow: 1,
          justifyContent: 'space-between',
        },
        devLink: {
          marginTop: 24,
          padding: 14,
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        devLinkText: {
          fontSize: 14,
          color: colors.primary,
          fontWeight: '600',
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
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors],
  );

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
  }, [TEXTS.ERROR]);

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
    if (!seconds) return TEXTS.NA;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} ${TEXTS.MINUTES} ${secs} ${TEXTS.SECONDS}`;
    }
    return `${secs} ${TEXTS.SECONDS}`;
  };

  // Formatear porcentaje
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return TEXTS.NA;
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
                {general.averageEffectiveness?.toFixed(1) || TEXTS.NA}
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
                  {item.techniqueType} • {item.count}{' '}
                  {item.count === 1 ? TEXTS.USE_SINGULAR : TEXTS.USE_PLURAL}
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
            labelColor: (opacity = 1) =>
              resolvedScheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(36, 35, 79, ${opacity})`,
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
        color: (opacity = 1) => `rgba(30, 131, 211, ${opacity})`,
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
            color: (opacity = 1) => `rgba(30, 131, 211, ${opacity})`,
            labelColor: (opacity = 1) =>
              resolvedScheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(36, 35, 79, ${opacity})`,
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

  const renderGraphEntryLink = () => (
    <TouchableOpacity
      style={styles.devLink}
      onPress={() => navigation.navigate('InterventionGraph')}
      accessibilityRole="button"
      testID="intervention-graph-entry"
    >
      <MaterialCommunityIcons
        name="graph-outline"
        size={20}
        color={colors.primary}
        style={{ marginRight: 8 }}
      />
      <Text style={styles.devLinkText}>{TEXTS.GRAPH_ENTRY_LINK}</Text>
    </TouchableOpacity>
  );

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            styles.emptyScrollContent,
            { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="chart-line" size={48} color={colors.accent} />
            <Text style={styles.emptyText}>{TEXTS.NO_DATA}</Text>
          </View>
          <AbcMacroPatternsCard
            startDate={abcDateRange.startDate}
            endDate={abcDateRange.endDate}
          />
          {renderGraphEntryLink()}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA },
        ]}
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
        <AbcMacroPatternsCard
          startDate={abcDateRange.startDate}
          endDate={abcDateRange.endDate}
        />
        {renderGraphEntryLink()}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton />
      {renderContent()}
      <FloatingNavBar />
    </SafeAreaView>
  );
};

export default TherapeuticTechniquesStatsScreen;

