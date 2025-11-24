/**
 * Pantalla de Dashboard de Crisis
 * 
 * Muestra métricas y estadísticas sobre eventos de crisis, tendencias emocionales,
 * alertas enviadas y seguimientos. Incluye gráficos visuales para mejor comprensión.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
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
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../styles/globalStyles';
import { api, ENDPOINTS } from '../config/api';

const { width } = Dimensions.get('window');

// Constantes de textos
const TEXTS = {
  TITLE: 'Dashboard de Crisis',
  LOADING: 'Cargando métricas...',
  ERROR: 'No pudimos cargar las métricas. Por favor, intenta de nuevo.',
  RETRY: 'Reintentar',
  REFRESHING: 'Actualizando...',
  SUMMARY: 'Resumen',
  TRENDS: 'Tendencias Emocionales',
  CRISIS_BY_MONTH: 'Crisis por Mes',
  EMOTION_DISTRIBUTION: 'Distribución de Emociones',
  HISTORY: 'Historial de Crisis',
  TOTAL_CRISES: 'Total de Crisis',
  THIS_MONTH: 'Este Mes',
  RECENT: 'Recientes (7 días)',
  RESOLUTION_RATE: 'Tasa de Resolución',
  ALERTS_SENT: 'Alertas Enviadas',
  FOLLOWUPS_COMPLETED: 'Seguimientos Completados',
  AVERAGE_RISK: 'Riesgo Promedio',
  PERIOD_7D: '7 días',
  PERIOD_30D: '30 días',
  PERIOD_90D: '90 días',
  VIEW_ALL: 'Ver Todo',
  NO_CRISIS: 'No hay crisis registradas',
  NO_CRISIS_MESSAGE: '¡Excelente! No se han detectado crisis en este período.',
  LOW: 'Bajo',
  WARNING: 'Advertencia',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
};

// Constantes de gráficos
const CHART_HEIGHT = 220;
const CHART_CONFIG = {
  backgroundColor: '#1D2B5F',
  backgroundGradientFrom: '#1D2B5F',
  backgroundGradientTo: '#1D2B5F',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#1ADDDB'
  }
};

const PIE_CHART_CONFIG = {
  backgroundColor: '#1D2B5F',
  backgroundGradientFrom: '#1D2B5F',
  backgroundGradientTo: '#1D2B5F',
  color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  decimalPlaces: 0,
  style: {
    borderRadius: 16
  }
};

const CrisisDashboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [crisisByMonth, setCrisisByMonth] = useState([]);
  const [emotionDistribution, setEmotionDistribution] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Filtros
  const [trendPeriod, setTrendPeriod] = useState('30d');

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      const [summaryRes, trendsRes, monthlyRes, distributionRes, historyRes] = await Promise.all([
        api.get(ENDPOINTS.CRISIS_SUMMARY, { days: 30 }),
        api.get(ENDPOINTS.CRISIS_TRENDS, { period: trendPeriod }),
        api.get(ENDPOINTS.CRISIS_BY_MONTH, { months: 6 }),
        api.get(ENDPOINTS.CRISIS_EMOTION_DISTRIBUTION, { days: 30 }),
        api.get(ENDPOINTS.CRISIS_HISTORY, { limit: 5 })
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (monthlyRes.success) setCrisisByMonth(monthlyRes.data);
      if (distributionRes.success) setEmotionDistribution(distributionRes.data);
      if (historyRes.success) setHistory(historyRes.data.crises || []);
      
    } catch (err) {
      console.error('Error cargando métricas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trendPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Formatear datos para gráficos
  const formatTrendData = () => {
    if (!trends?.dataPoints || trends.dataPoints.length === 0) {
      return {
        labels: ['Sin datos'],
        datasets: [{ data: [0] }]
      };
    }

    const labels = trends.dataPoints.map(point => {
      const date = new Date(point.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    
    const data = trends.dataPoints.map(point => point.intensity);

    return {
      labels: labels.length > 10 ? labels.filter((_, i) => i % 2 === 0) : labels,
      datasets: [{ data }]
    };
  };

  const formatMonthlyData = () => {
    if (!crisisByMonth || crisisByMonth.length === 0) {
      return {
        labels: ['Sin datos'],
        datasets: [{ data: [0] }]
      };
    }

    const labels = crisisByMonth.map(item => item.month);
    const data = crisisByMonth.map(item => item.crises);

    return {
      labels,
      datasets: [{ data }]
    };
  };

  const formatEmotionDistribution = () => {
    if (!emotionDistribution?.distribution) {
      return [];
    }

    const emotionColors = {
      tristeza: '#FF6B6B',
      ansiedad: '#FFA500',
      enojo: '#FF4444',
      miedo: '#9B59B6',
      alegria: '#4ECDC4',
      esperanza: '#95E1D3',
      neutral: '#95A5A6',
      verguenza: '#E74C3C',
      culpa: '#C0392B'
    };

    return Object.entries(emotionDistribution.distribution)
      .filter(([_, value]) => value > 0)
      .map(([emotion, value]) => ({
        name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        value: Math.round(value * 100),
        color: emotionColors[emotion] || '#1ADDDB',
        legendFontColor: colors.white,
        legendFontSize: 12
      }));
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      LOW: '#4ECDC4',
      WARNING: '#FFA500',
      MEDIUM: '#FF6B6B',
      HIGH: '#E74C3C'
    };
    return colors[level] || colors.LOW;
  };

  const getRiskLevelText = (level) => {
    const texts = {
      LOW: TEXTS.LOW,
      WARNING: TEXTS.WARNING,
      MEDIUM: TEXTS.MEDIUM,
      HIGH: TEXTS.HIGH
    };
    return texts[level] || level;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.primary} />
          <Text style={styles.errorText}>{TEXTS.ERROR}</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{TEXTS.TITLE}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Resumen General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.SUMMARY}</Text>
          
          {summary && (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="alert-circle" size={32} color={colors.primary} />
                <Text style={styles.summaryValue}>{summary.totalCrises}</Text>
                <Text style={styles.summaryLabel}>{TEXTS.TOTAL_CRISES}</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="calendar-month" size={32} color={colors.primary} />
                <Text style={styles.summaryValue}>{summary.crisesThisMonth}</Text>
                <Text style={styles.summaryLabel}>{TEXTS.THIS_MONTH}</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="clock-outline" size={32} color={colors.primary} />
                <Text style={styles.summaryValue}>{summary.recentCrises}</Text>
                <Text style={styles.summaryLabel}>{TEXTS.RECENT}</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="check-circle" size={32} color="#4ECDC4" />
                <Text style={styles.summaryValue}>{Math.round(summary.resolutionRate * 100)}%</Text>
                <Text style={styles.summaryLabel}>{TEXTS.RESOLUTION_RATE}</Text>
              </View>
            </View>
          )}

          {/* Nivel de riesgo promedio */}
          {summary && (
            <View style={styles.riskCard}>
              <Text style={styles.riskLabel}>{TEXTS.AVERAGE_RISK}</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(summary.averageRiskLevel) }]}>
                <Text style={styles.riskText}>
                  {getRiskLevelText(summary.averageRiskLevel)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tendencias Emocionales */}
        {trends && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{TEXTS.TRENDS}</Text>
              <View style={styles.periodSelector}>
                {['7d', '30d', '90d'].map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      trendPeriod === period && styles.periodButtonActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTrendPeriod(period);
                    }}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      trendPeriod === period && styles.periodButtonTextActive
                    ]}>
                      {TEXTS[`PERIOD_${period.toUpperCase()}`]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.chartContainer}>
              <LineChart
                data={formatTrendData()}
                width={width - 40}
                height={CHART_HEIGHT}
                chartConfig={CHART_CONFIG}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withDots={true}
                withShadow={false}
              />
            </View>
            
            {trends.trend && (
              <View style={styles.trendInfo}>
                <MaterialCommunityIcons
                  name={trends.trend === 'improving' ? 'trending-down' : trends.trend === 'declining' ? 'trending-up' : 'trending-neutral'}
                  size={20}
                  color={trends.trend === 'improving' ? '#4ECDC4' : trends.trend === 'declining' ? '#FF6B6B' : colors.primary}
                />
                <Text style={styles.trendText}>
                  Tendencia: {trends.trend === 'improving' ? 'Mejorando' : trends.trend === 'declining' ? 'Deteriorando' : 'Estable'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Crisis por Mes */}
        {crisisByMonth && crisisByMonth.length > 0 && (
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
                showValuesOnTopOfBars={true}
                fromZero={true}
              />
            </View>
          </View>
        )}

        {/* Distribución de Emociones */}
        {emotionDistribution && emotionDistribution.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.EMOTION_DISTRIBUTION}</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={formatEmotionDistribution()}
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
        )}

        {/* Historial Reciente */}
        {history && history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{TEXTS.HISTORY}</Text>
              <TouchableOpacity onPress={() => {/* Navegar a historial completo */}}>
                <Text style={styles.viewAllText}>{TEXTS.VIEW_ALL}</Text>
              </TouchableOpacity>
            </View>
            
            {history.map((crisis, index) => (
              <View key={crisis._id || index} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <View style={[
                    styles.riskIndicator,
                    { backgroundColor: getRiskLevelColor(crisis.riskLevel) }
                  ]} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDate}>{formatDate(crisis.detectedAt)}</Text>
                    <Text style={styles.historyRisk}>
                      {getRiskLevelText(crisis.riskLevel)}
                    </Text>
                  </View>
                  {crisis.alerts?.sent && (
                    <MaterialCommunityIcons name="bell" size={20} color={colors.primary} />
                  )}
                </View>
                {crisis.triggerMessage?.contentPreview && (
                  <Text style={styles.historyPreview} numberOfLines={2}>
                    {crisis.triggerMessage.contentPreview}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Sin crisis */}
        {summary && summary.totalCrises === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#4ECDC4" />
            <Text style={styles.emptyTitle}>{TEXTS.NO_CRISIS}</Text>
            <Text style={styles.emptyMessage}>{TEXTS.NO_CRISIS_MESSAGE}</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 24,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#1D2B5F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  riskCard: {
    backgroundColor: '#1D2B5F',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1D2B5F',
    borderRadius: 20,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.7,
  },
  periodButtonTextActive: {
    opacity: 1,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#1D2B5F',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  trendText: {
    color: colors.white,
    fontSize: 14,
    marginLeft: 8,
  },
  historyItem: {
    backgroundColor: '#1D2B5F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  historyRisk: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  historyPreview: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default CrisisDashboardScreen;

