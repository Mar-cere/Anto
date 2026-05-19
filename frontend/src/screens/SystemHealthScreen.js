/**
 * Pantalla de Salud del Sistema
 * 
 * Muestra métricas y estadísticas del sistema para administradores
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

const DEFAULT_TEXTS = {
  LOADING: 'Cargando métricas...',
  LOAD_ERROR: 'Error al cargar métricas del sistema',
  RETRY: 'Reintentar',
  TITLE_STATUS: 'Estado de Salud del Sistema',
  STATUS_HEALTHY: 'Saludable',
  STATUS_DEGRADED: 'Degradado',
  STATUS_UNHEALTHY: 'No Saludable',
  METRIC_ERROR_RATE: 'Tasa de Error:',
  METRIC_AVG_RESPONSE_TIME: 'Tiempo Promedio de Respuesta:',
  METRIC_TOTAL_REQUESTS: 'Total de Peticiones:',
  METRIC_ACTIVE_SESSIONS: 'Sesiones Activas:',
  TITLE_EMOTIONAL_ANALYSIS: 'Análisis Emocional',
  METRIC_TOTAL_ANALYSIS: 'Total de Análisis:',
  METRIC_AVG_INTENSITY: 'Intensidad Promedio:',
  METRIC_AVG_CONFIDENCE: 'Confianza Promedio:',
  NOT_AVAILABLE: 'N/A',
  SUBTITLE_TOP_EMOTIONS: 'Emociones Más Frecuentes:',
  TITLE_PROTOCOLS: 'Protocolos Terapéuticos',
  METRIC_PROTOCOLS_STARTED: 'Protocolos Iniciados:',
  METRIC_PROTOCOLS_COMPLETED: 'Protocolos Completados:',
  METRIC_COMPLETION_RATE: 'Tasa de Completación:',
  TITLE_ACTION_SUGGESTIONS: 'Sugerencias de Acciones',
  METRIC_SUGGESTIONS_GENERATED: 'Sugerencias Generadas:',
  METRIC_SUGGESTIONS_CLICKED: 'Sugerencias Clickeadas:',
  METRIC_CLICK_RATE: 'Tasa de Click:',
};

const SystemHealthScreen = () => {
  const { colors } = useTheme();
  const translated = useSectionTranslations('SETTINGS');
  const TEXTS = useMemo(
    () => ({
      LOADING: translated?.SYSTEM_HEALTH_LOADING || DEFAULT_TEXTS.LOADING,
      LOAD_ERROR:
        translated?.SYSTEM_HEALTH_LOAD_ERROR ||
        DEFAULT_TEXTS.LOAD_ERROR,
      RETRY: translated?.SYSTEM_HEALTH_RETRY || DEFAULT_TEXTS.RETRY,
      TITLE_STATUS:
        translated?.SYSTEM_HEALTH_TITLE_STATUS || DEFAULT_TEXTS.TITLE_STATUS,
      STATUS_HEALTHY:
        translated?.SYSTEM_HEALTH_STATUS_HEALTHY || DEFAULT_TEXTS.STATUS_HEALTHY,
      STATUS_DEGRADED:
        translated?.SYSTEM_HEALTH_STATUS_DEGRADED || DEFAULT_TEXTS.STATUS_DEGRADED,
      STATUS_UNHEALTHY:
        translated?.SYSTEM_HEALTH_STATUS_UNHEALTHY || DEFAULT_TEXTS.STATUS_UNHEALTHY,
      METRIC_ERROR_RATE:
        translated?.SYSTEM_HEALTH_METRIC_ERROR_RATE || DEFAULT_TEXTS.METRIC_ERROR_RATE,
      METRIC_AVG_RESPONSE_TIME:
        translated?.SYSTEM_HEALTH_METRIC_AVG_RESPONSE_TIME ||
        DEFAULT_TEXTS.METRIC_AVG_RESPONSE_TIME,
      METRIC_TOTAL_REQUESTS:
        translated?.SYSTEM_HEALTH_METRIC_TOTAL_REQUESTS || DEFAULT_TEXTS.METRIC_TOTAL_REQUESTS,
      METRIC_ACTIVE_SESSIONS:
        translated?.SYSTEM_HEALTH_METRIC_ACTIVE_SESSIONS || DEFAULT_TEXTS.METRIC_ACTIVE_SESSIONS,
      TITLE_EMOTIONAL_ANALYSIS:
        translated?.SYSTEM_HEALTH_TITLE_EMOTIONAL_ANALYSIS || DEFAULT_TEXTS.TITLE_EMOTIONAL_ANALYSIS,
      METRIC_TOTAL_ANALYSIS:
        translated?.SYSTEM_HEALTH_METRIC_TOTAL_ANALYSIS || DEFAULT_TEXTS.METRIC_TOTAL_ANALYSIS,
      METRIC_AVG_INTENSITY:
        translated?.SYSTEM_HEALTH_METRIC_AVG_INTENSITY || DEFAULT_TEXTS.METRIC_AVG_INTENSITY,
      METRIC_AVG_CONFIDENCE:
        translated?.SYSTEM_HEALTH_METRIC_AVG_CONFIDENCE || DEFAULT_TEXTS.METRIC_AVG_CONFIDENCE,
      NOT_AVAILABLE:
        translated?.SYSTEM_HEALTH_NOT_AVAILABLE || DEFAULT_TEXTS.NOT_AVAILABLE,
      SUBTITLE_TOP_EMOTIONS:
        translated?.SYSTEM_HEALTH_SUBTITLE_TOP_EMOTIONS ||
        DEFAULT_TEXTS.SUBTITLE_TOP_EMOTIONS,
      TITLE_PROTOCOLS:
        translated?.SYSTEM_HEALTH_TITLE_PROTOCOLS || DEFAULT_TEXTS.TITLE_PROTOCOLS,
      METRIC_PROTOCOLS_STARTED:
        translated?.SYSTEM_HEALTH_METRIC_PROTOCOLS_STARTED || DEFAULT_TEXTS.METRIC_PROTOCOLS_STARTED,
      METRIC_PROTOCOLS_COMPLETED:
        translated?.SYSTEM_HEALTH_METRIC_PROTOCOLS_COMPLETED ||
        DEFAULT_TEXTS.METRIC_PROTOCOLS_COMPLETED,
      METRIC_COMPLETION_RATE:
        translated?.SYSTEM_HEALTH_METRIC_COMPLETION_RATE || DEFAULT_TEXTS.METRIC_COMPLETION_RATE,
      TITLE_ACTION_SUGGESTIONS:
        translated?.SYSTEM_HEALTH_TITLE_ACTION_SUGGESTIONS ||
        DEFAULT_TEXTS.TITLE_ACTION_SUGGESTIONS,
      METRIC_SUGGESTIONS_GENERATED:
        translated?.SYSTEM_HEALTH_METRIC_SUGGESTIONS_GENERATED ||
        DEFAULT_TEXTS.METRIC_SUGGESTIONS_GENERATED,
      METRIC_SUGGESTIONS_CLICKED:
        translated?.SYSTEM_HEALTH_METRIC_SUGGESTIONS_CLICKED ||
        DEFAULT_TEXTS.METRIC_SUGGESTIONS_CLICKED,
      METRIC_CLICK_RATE:
        translated?.SYSTEM_HEALTH_METRIC_CLICK_RATE || DEFAULT_TEXTS.METRIC_CLICK_RATE,
    }),
    [translated],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthStats, setHealthStats] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [error, setError] = useState(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          marginTop: 16,
          color: colors.text,
          fontSize: 16,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        },
        errorText: {
          marginTop: 16,
          color: colors.error,
          fontSize: 16,
          textAlign: 'center',
        },
        retryButton: {
          marginTop: 24,
          paddingHorizontal: 24,
          paddingVertical: 12,
          backgroundColor: colors.primary,
          borderRadius: 8,
        },
        retryButtonText: {
          color: colors.white,
          fontSize: 16,
          fontWeight: '600',
        },
        section: {
          marginBottom: 24,
        },
        sectionTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 12,
        },
        card: {
          backgroundColor: colors.cardBackground || colors.background,
          borderRadius: 12,
          padding: SPACING.SCREEN_EDGE_INSET,
          borderWidth: 1,
          borderColor: colors.border || `${colors.accent}30`,
        },
        statusCard: {
          backgroundColor: colors.cardBackground || colors.background,
          borderRadius: 12,
          padding: SPACING.SCREEN_EDGE_INSET,
          borderLeftWidth: 4,
        },
        statusHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        },
        statusText: {
          fontSize: 24,
          fontWeight: 'bold',
          marginLeft: 12,
        },
        metricRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border || `${colors.accent}20`,
        },
        metricLabel: {
          fontSize: 16,
          color: colors.text,
          flex: 1,
        },
        metricValue: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.primary,
        },
        subsection: {
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border || `${colors.accent}20`,
        },
        subsectionTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.accent,
          marginBottom: 8,
        },
      }),
    [colors],
  );

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [healthResponse, metricsResponse] = await Promise.all([
        api.get('/api/metrics/health'),
        api.get('/api/metrics/system')
      ]);

      if (healthResponse.success) {
        setHealthStats(healthResponse.data);
      }
      if (metricsResponse.success) {
        setSystemMetrics(metricsResponse.data);
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
      setError(TEXTS.LOAD_ERROR);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [TEXTS.LOAD_ERROR]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return colors.success;
      case 'degraded':
        return colors.warning;
      case 'unhealthy':
        return colors.error;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return 'checkmark-circle';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Estado de Salud */}
        {healthStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.TITLE_STATUS}</Text>
            <View style={[styles.statusCard, { borderLeftColor: getStatusColor(healthStats.status) }]}>
              <View style={styles.statusHeader}>
                <Ionicons
                  name={getStatusIcon(healthStats.status)}
                  size={32}
                  color={getStatusColor(healthStats.status)}
                />
                <Text style={[styles.statusText, { color: getStatusColor(healthStats.status) }]}>
                  {healthStats.status === 'healthy'
                    ? TEXTS.STATUS_HEALTHY
                    : healthStats.status === 'degraded'
                      ? TEXTS.STATUS_DEGRADED
                      : TEXTS.STATUS_UNHEALTHY}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_ERROR_RATE}</Text>
                <Text style={styles.metricValue}>{healthStats.errorRate}%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_AVG_RESPONSE_TIME}</Text>
                <Text style={styles.metricValue}>{healthStats.averageResponseTime}ms</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_TOTAL_REQUESTS}</Text>
                <Text style={styles.metricValue}>{healthStats.totalRequests}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_ACTIVE_SESSIONS}</Text>
                <Text style={styles.metricValue}>{healthStats.activeSessions}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Métricas de Análisis Emocional */}
        {systemMetrics?.emotionalAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.TITLE_EMOTIONAL_ANALYSIS}</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_TOTAL_ANALYSIS}</Text>
                <Text style={styles.metricValue}>{systemMetrics.emotionalAnalysis.total}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_AVG_INTENSITY}</Text>
                <Text style={styles.metricValue}>
                  {Number.isFinite(systemMetrics.emotionalAnalysis.averageIntensity)
                    ? systemMetrics.emotionalAnalysis.averageIntensity.toFixed(2)
                    : TEXTS.NOT_AVAILABLE}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_AVG_CONFIDENCE}</Text>
                <Text style={styles.metricValue}>
                  {Number.isFinite(systemMetrics.emotionalAnalysis.averageConfidence)
                    ? `${(systemMetrics.emotionalAnalysis.averageConfidence * 100).toFixed(1)}%`
                    : TEXTS.NOT_AVAILABLE}
                </Text>
              </View>
              
              {/* Emociones más frecuentes */}
              {systemMetrics.emotionalAnalysis.byEmotion && Object.keys(systemMetrics.emotionalAnalysis.byEmotion).length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>{TEXTS.SUBTITLE_TOP_EMOTIONS}</Text>
                  {Object.entries(systemMetrics.emotionalAnalysis.byEmotion)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([emotion, count]) => (
                      <View key={emotion} style={styles.metricRow}>
                        <Text style={styles.metricLabel}>{emotion}:</Text>
                        <Text style={styles.metricValue}>{count}</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Métricas de Protocolos */}
        {systemMetrics?.protocols && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.TITLE_PROTOCOLS}</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_PROTOCOLS_STARTED}</Text>
                <Text style={styles.metricValue}>{systemMetrics.protocols.started}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_PROTOCOLS_COMPLETED}</Text>
                <Text style={styles.metricValue}>{systemMetrics.protocols.completed}</Text>
              </View>
              {systemMetrics.protocols.completed > 0 && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>{TEXTS.METRIC_COMPLETION_RATE}</Text>
                  <Text style={styles.metricValue}>
                    {((systemMetrics.protocols.completed / systemMetrics.protocols.started) * 100).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Métricas de Sugerencias */}
        {systemMetrics?.actionSuggestions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.TITLE_ACTION_SUGGESTIONS}</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_SUGGESTIONS_GENERATED}</Text>
                <Text style={styles.metricValue}>{systemMetrics.actionSuggestions.generated}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{TEXTS.METRIC_SUGGESTIONS_CLICKED}</Text>
                <Text style={styles.metricValue}>{systemMetrics.actionSuggestions.clicked}</Text>
              </View>
              {systemMetrics.actionSuggestions.generated > 0 && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>{TEXTS.METRIC_CLICK_RATE}</Text>
                  <Text style={styles.metricValue}>
                    {((systemMetrics.actionSuggestions.clicked / systemMetrics.actionSuggestions.generated) * 100).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default SystemHealthScreen;

