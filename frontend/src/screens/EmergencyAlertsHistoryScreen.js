/**
 * Pantalla de Historial de Alertas de Emergencia
 * 
 * Muestra el historial completo de alertas enviadas, estadísticas detalladas
 * y patrones detectados para transparencia y análisis.
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
  FlatList,
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
  TITLE: 'Historial de Alertas',
  LOADING: 'Cargando historial...',
  ERROR: 'No pudimos cargar el historial. Por favor, intenta de nuevo.',
  RETRY: 'Reintentar',
  REFRESHING: 'Actualizando...',
  NO_ALERTS: 'No hay alertas registradas',
  NO_ALERTS_MESSAGE: 'Aún no se han enviado alertas a tus contactos de emergencia.',
  STATISTICS: 'Estadísticas',
  PATTERNS: 'Patrones Detectados',
  HISTORY: 'Historial',
  TAB_HISTORY: 'Historial',
  TAB_STATS: 'Estadísticas',
  TAB_PATTERNS: 'Patrones',
  TOTAL_ALERTS: 'Total de Alertas',
  BY_RISK_LEVEL: 'Por Nivel de Riesgo',
  BY_STATUS: 'Por Estado',
  BY_CHANNEL: 'Por Canal',
  BY_CONTACT: 'Por Contacto',
  BY_DAY: 'Por Día',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  SENT: 'Enviada',
  PARTIAL: 'Parcial',
  FAILED: 'Fallida',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  DATE: 'Fecha',
  CONTACT: 'Contacto',
  RISK_LEVEL: 'Nivel de Riesgo',
  STATUS: 'Estado',
  CHANNELS: 'Canales',
  TEST_ALERT: 'Alerta de Prueba',
  REAL_ALERT: 'Alerta Real',
  FREQUENCY: 'Frecuencia',
  RISK_TREND: 'Tendencia de Riesgo',
  TIME_PATTERNS: 'Patrones Temporales',
  CONTACT_RELIABILITY: 'Confiabilidad de Contactos',
  RECOMMENDATIONS: 'Recomendaciones',
  INCREASING: 'Aumentando',
  DECREASING: 'Disminuyendo',
  STABLE: 'Estable',
  ESCALATING: 'Escalando',
  IMPROVING: 'Mejorando',
  MOST_COMMON_DAYS: 'Días Más Comunes',
  MOST_COMMON_HOURS: 'Horas Más Comunes',
  WEEKEND: 'Fin de Semana',
  WEEKDAY: 'Día de Semana',
  SUCCESS_RATE: 'Tasa de Éxito',
  TOTAL: 'Total',
  SUCCESSFUL: 'Exitosas',
  FAILED: 'Fallidas',
};

// Constantes de gráficos
const CHART_HEIGHT = 220;
const CHART_CONFIG = {
  backgroundColor: '#1D2B5F',
  backgroundGradientFrom: '#1D2B5F',
  backgroundGradientTo: '#1D2B5F',
  decimalPlaces: 0,
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

const TABS = {
  HISTORY: 'history',
  STATS: 'stats',
  PATTERNS: 'patterns'
};

const EmergencyAlertsHistoryScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(TABS.HISTORY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [patterns, setPatterns] = useState(null);

  // Cargar historial
  const loadHistory = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS, {
        limit: 100,
        skip: 0
      });
      
      if (response.success) {
        setHistory(response.data || []);
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError(err.message);
    }
  }, []);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS_STATS, {
        days: 30
      });
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  // Cargar patrones
  const loadPatterns = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS_PATTERNS, {
        days: 90
      });
      
      if (response.success) {
        setPatterns(response.data);
      }
    } catch (err) {
      console.error('Error cargando patrones:', err);
    }
  }, []);

  // Cargar todos los datos
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadHistory(),
        loadStats(),
        loadPatterns()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadHistory, loadStats, loadPatterns]);

  // Refrescar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear datos para gráfico de barras (por nivel de riesgo)
  const formatRiskLevelData = () => {
    if (!stats?.byRiskLevel) return null;
    
    return {
      labels: ['MEDIO', 'ALTO'],
      datasets: [{
        data: [
          stats.byRiskLevel.MEDIUM || 0,
          stats.byRiskLevel.HIGH || 0
        ]
      }]
    };
  };

  // Formatear datos para gráfico de pastel (por estado)
  const formatStatusData = () => {
    if (!stats?.byStatus) return null;
    
    const data = [
      {
        name: TEXTS.SENT,
        population: stats.byStatus.sent || 0,
        color: '#4ECDC4',
        legendFontColor: '#FFFFFF'
      },
      {
        name: TEXTS.PARTIAL,
        population: stats.byStatus.partial || 0,
        color: '#FFA500',
        legendFontColor: '#FFFFFF'
      },
      {
        name: TEXTS.FAILED,
        population: stats.byStatus.failed || 0,
        color: '#FF6B6B',
        legendFontColor: '#FFFFFF'
      }
    ].filter(item => item.population > 0);
    
    return data;
  };

  // Formatear datos para gráfico de barras (por canal)
  const formatChannelData = () => {
    if (!stats?.byChannel) return null;
    
    return {
      labels: [TEXTS.EMAIL, TEXTS.WHATSAPP],
      datasets: [
        {
          data: [
            stats.byChannel.email?.sent || 0,
            stats.byChannel.whatsapp?.sent || 0
          ],
          color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`
        },
        {
          data: [
            stats.byChannel.email?.failed || 0,
            stats.byChannel.whatsapp?.failed || 0
          ],
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`
        }
      ]
    };
  };

  // Formatear datos para gráfico de línea (por día)
  const formatDayData = () => {
    if (!stats?.byDay) return null;
    
    const entries = Object.entries(stats.byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7); // Últimos 7 días
    
    return {
      labels: entries.map(([date]) => {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      }),
      datasets: [{
        data: entries.map(([, count]) => count)
      }]
    };
  };

  // Renderizar item del historial
  const renderHistoryItem = ({ item }) => {
    const statusColors = {
      sent: '#4ECDC4',
      partial: '#FFA500',
      failed: '#FF6B6B'
    };

    const riskColors = {
      MEDIUM: '#FFA500',
      HIGH: '#FF6B6B'
    };

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyItemHeader}>
          <View style={styles.historyItemLeft}>
            <MaterialCommunityIcons
              name={item.isTest ? 'test-tube' : 'alert-circle'}
              size={20}
              color={item.isTest ? '#1ADDDB' : riskColors[item.riskLevel]}
            />
            <View style={styles.historyItemInfo}>
              <Text style={styles.historyItemContact}>{item.contact.name}</Text>
              <Text style={styles.historyItemDate}>{formatDate(item.sentAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusBadgeText}>
              {TEXTS[item.status.toUpperCase()] || item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.historyItemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{TEXTS.RISK_LEVEL}:</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskColors[item.riskLevel] }]}>
              <Text style={styles.riskBadgeText}>
                {TEXTS[item.riskLevel]}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{TEXTS.CHANNELS}:</Text>
            <View style={styles.channelsRow}>
              {item.channels.email.sent && (
                <View style={styles.channelBadge}>
                  <MaterialCommunityIcons name="email" size={14} color="#4ECDC4" />
                  <Text style={styles.channelText}>{TEXTS.EMAIL}</Text>
                </View>
              )}
              {item.channels.whatsapp.sent && (
                <View style={styles.channelBadge}>
                  <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                  <Text style={styles.channelText}>{TEXTS.WHATSAPP}</Text>
                </View>
              )}
              {!item.channels.email.sent && !item.channels.whatsapp.sent && (
                <Text style={styles.noChannelsText}>Ningún canal exitoso</Text>
              )}
            </View>
          </View>
          
          {item.isTest && (
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>{TEXTS.TEST_ALERT}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Renderizar pantalla de carga
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    );
  }

  // Renderizar error
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{TEXTS.ERROR}</Text>
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.HISTORY && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab(TABS.HISTORY);
          }}
        >
          <Text style={[styles.tabText, activeTab === TABS.HISTORY && styles.tabTextActive]}>
            {TEXTS.TAB_HISTORY}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.STATS && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab(TABS.STATS);
          }}
        >
          <Text style={[styles.tabText, activeTab === TABS.STATS && styles.tabTextActive]}>
            {TEXTS.TAB_STATS}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.PATTERNS && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab(TABS.PATTERNS);
          }}
        >
          <Text style={[styles.tabText, activeTab === TABS.PATTERNS && styles.tabTextActive]}>
            {TEXTS.TAB_PATTERNS}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Tab: Historial */}
        {activeTab === TABS.HISTORY && (
          <View style={styles.tabContent}>
            {history.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell-off" size={64} color="#666" />
                <Text style={styles.emptyTitle}>{TEXTS.NO_ALERTS}</Text>
                <Text style={styles.emptyMessage}>{TEXTS.NO_ALERTS_MESSAGE}</Text>
              </View>
            ) : (
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => item._id || index.toString()}
                scrollEnabled={false}
                ListHeaderComponent={
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>{TEXTS.TOTAL_ALERTS}</Text>
                    <Text style={styles.summaryValue}>{stats?.total || history.length}</Text>
                  </View>
                }
              />
            )}
          </View>
        )}

        {/* Tab: Estadísticas */}
        {activeTab === TABS.STATS && stats && (
          <View style={styles.tabContent}>
            {/* Resumen */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{TEXTS.TOTAL_ALERTS}</Text>
              <Text style={styles.summaryValue}>{stats.total}</Text>
            </View>

            {/* Por Nivel de Riesgo */}
            {formatRiskLevelData() && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.BY_RISK_LEVEL}</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={formatRiskLevelData()}
                    width={width - 40}
                    height={CHART_HEIGHT}
                    chartConfig={CHART_CONFIG}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                    fromZero={true}
                  />
                </View>
              </View>
            )}

            {/* Por Estado */}
            {formatStatusData() && formatStatusData().length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.BY_STATUS}</Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={formatStatusData()}
                    width={width - 40}
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

            {/* Por Canal */}
            {formatChannelData() && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.BY_CHANNEL}</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={formatChannelData()}
                    width={width - 40}
                    height={CHART_HEIGHT}
                    chartConfig={CHART_CONFIG}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                    fromZero={true}
                  />
                </View>
              </View>
            )}

            {/* Por Día */}
            {formatDayData() && formatDayData().labels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.BY_DAY}</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={formatDayData()}
                    width={width - 40}
                    height={CHART_HEIGHT}
                    chartConfig={CHART_CONFIG}
                    bezier
                    style={styles.chart}
                  />
                </View>
              </View>
            )}

            {/* Por Contacto */}
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
                          {contactStats.email.sent} {TEXTS.SUCCESSFUL}
                        </Text>
                      </View>
                      <View style={styles.contactStat}>
                        <Text style={styles.contactStatLabel}>{TEXTS.WHATSAPP}:</Text>
                        <Text style={styles.contactStatValue}>
                          {contactStats.whatsapp.sent} {TEXTS.SUCCESSFUL}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: Patrones */}
        {activeTab === TABS.PATTERNS && patterns && (
          <View style={styles.tabContent}>
            {/* Frecuencia */}
            {patterns.frequency && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.FREQUENCY}</Text>
                <View style={styles.patternCard}>
                  <View style={styles.patternRow}>
                    <MaterialCommunityIcons
                      name={patterns.frequency.increasing ? 'trending-up' : patterns.frequency.decreasing ? 'trending-down' : 'trending-neutral'}
                      size={24}
                      color={patterns.frequency.increasing ? '#FF6B6B' : patterns.frequency.decreasing ? '#4ECDC4' : colors.primary}
                    />
                    <Text style={styles.patternText}>
                      {patterns.frequency.increasing ? TEXTS.INCREASING : patterns.frequency.decreasing ? TEXTS.DECREASING : TEXTS.STABLE}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Tendencia de Riesgo */}
            {patterns.riskLevelTrend && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.RISK_TREND}</Text>
                <View style={styles.patternCard}>
                  <View style={styles.patternRow}>
                    <MaterialCommunityIcons
                      name={patterns.riskLevelTrend.escalating ? 'arrow-up' : patterns.riskLevelTrend.improving ? 'arrow-down' : 'minus'}
                      size={24}
                      color={patterns.riskLevelTrend.escalating ? '#FF6B6B' : patterns.riskLevelTrend.improving ? '#4ECDC4' : colors.primary}
                    />
                    <Text style={styles.patternText}>
                      {patterns.riskLevelTrend.escalating ? TEXTS.ESCALATING : patterns.riskLevelTrend.improving ? TEXTS.IMPROVING : TEXTS.STABLE}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Patrones Temporales */}
            {patterns.timePatterns && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.TIME_PATTERNS}</Text>
                
                {patterns.timePatterns.mostCommonDays && patterns.timePatterns.mostCommonDays.length > 0 && (
                  <View style={styles.patternCard}>
                    <Text style={styles.patternSubtitle}>{TEXTS.MOST_COMMON_DAYS}</Text>
                    {patterns.timePatterns.mostCommonDays.map((day, index) => (
                      <View key={index} style={styles.patternItem}>
                        <Text style={styles.patternItemText}>{day.day}: {day.count} alertas</Text>
                      </View>
                    ))}
                  </View>
                )}

                {patterns.timePatterns.mostCommonHours && patterns.timePatterns.mostCommonHours.length > 0 && (
                  <View style={styles.patternCard}>
                    <Text style={styles.patternSubtitle}>{TEXTS.MOST_COMMON_HOURS}</Text>
                    {patterns.timePatterns.mostCommonHours.map((hour, index) => (
                      <View key={index} style={styles.patternItem}>
                        <Text style={styles.patternItemText}>{hour.hour}:00 - {hour.count} alertas</Text>
                      </View>
                    ))}
                  </View>
                )}

                {patterns.timePatterns.weekendVsWeekday && (
                  <View style={styles.patternCard}>
                    <Text style={styles.patternSubtitle}>Fin de Semana vs Día de Semana</Text>
                    <View style={styles.patternItem}>
                      <Text style={styles.patternItemText}>
                        {TEXTS.WEEKEND}: {patterns.timePatterns.weekendVsWeekday.weekend} alertas
                      </Text>
                    </View>
                    <View style={styles.patternItem}>
                      <Text style={styles.patternItemText}>
                        {TEXTS.WEEKDAY}: {patterns.timePatterns.weekendVsWeekday.weekday} alertas
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Confiabilidad de Contactos */}
            {patterns.contactReliability && Object.keys(patterns.contactReliability).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.CONTACT_RELIABILITY}</Text>
                {Object.entries(patterns.contactReliability).map(([email, reliability]) => (
                  <View key={email} style={styles.patternCard}>
                    <Text style={styles.contactName}>{reliability.name}</Text>
                    <View style={styles.reliabilityStats}>
                      <Text style={styles.reliabilityText}>
                        {TEXTS.SUCCESS_RATE}: {reliability.total > 0 ? Math.round((reliability.successful / reliability.total) * 100) : 0}%
                      </Text>
                      <Text style={styles.reliabilityText}>
                        {reliability.successful} {TEXTS.SUCCESSFUL} / {reliability.total} {TEXTS.TOTAL}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recomendaciones */}
            {patterns.recommendations && patterns.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{TEXTS.RECOMMENDATIONS}</Text>
                {patterns.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color="#FFA500" />
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1533',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2B5F',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2B5F',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  historyItem: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historyItemContact: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyItemDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
    marginRight: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1533',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  channelText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  noChannelsText: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  testBadge: {
    backgroundColor: '#1ADDDB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testBadgeText: {
    color: '#0A1533',
    fontSize: 12,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  contactStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  contactStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactStatLabel: {
    color: '#999',
    fontSize: 14,
    marginRight: 4,
  },
  contactStatValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  patternCard: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patternText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  patternSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  patternItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0A1533',
  },
  patternItemText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  reliabilityStats: {
    marginTop: 8,
  },
  reliabilityText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationCard: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default EmergencyAlertsHistoryScreen;

