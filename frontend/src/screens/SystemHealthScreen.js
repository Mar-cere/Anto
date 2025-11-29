/**
 * Pantalla de Salud del Sistema
 * 
 * Muestra métricas y estadísticas del sistema para administradores
 */
import React, { useState, useEffect, useCallback } from 'react';
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
import { api, ENDPOINTS } from '../config/api';
import { colors } from '../styles/globalStyles';

const SystemHealthScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthStats, setHealthStats] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [error, setError] = useState(null);

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
      setError('Error al cargar métricas del sistema');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        return colors.success || '#4CAF50';
      case 'degraded':
        return colors.warning || '#FF9800';
      case 'unhealthy':
        return colors.error || '#F44336';
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
          <Text style={styles.loadingText}>Cargando métricas...</Text>
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
            <Text style={styles.retryButtonText}>Reintentar</Text>
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
            <Text style={styles.sectionTitle}>Estado de Salud del Sistema</Text>
            <View style={[styles.statusCard, { borderLeftColor: getStatusColor(healthStats.status) }]}>
              <View style={styles.statusHeader}>
                <Ionicons
                  name={getStatusIcon(healthStats.status)}
                  size={32}
                  color={getStatusColor(healthStats.status)}
                />
                <Text style={[styles.statusText, { color: getStatusColor(healthStats.status) }]}>
                  {healthStats.status === 'healthy' ? 'Saludable' :
                   healthStats.status === 'degraded' ? 'Degradado' : 'No Saludable'}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Tasa de Error:</Text>
                <Text style={styles.metricValue}>{healthStats.errorRate}%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Tiempo Promedio de Respuesta:</Text>
                <Text style={styles.metricValue}>{healthStats.averageResponseTime}ms</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Total de Peticiones:</Text>
                <Text style={styles.metricValue}>{healthStats.totalRequests}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Sesiones Activas:</Text>
                <Text style={styles.metricValue}>{healthStats.activeSessions}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Métricas de Análisis Emocional */}
        {systemMetrics?.emotionalAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Análisis Emocional</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Total de Análisis:</Text>
                <Text style={styles.metricValue}>{systemMetrics.emotionalAnalysis.total}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Intensidad Promedio:</Text>
                <Text style={styles.metricValue}>
                  {systemMetrics.emotionalAnalysis.averageIntensity?.toFixed(2) || 'N/A'}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Confianza Promedio:</Text>
                <Text style={styles.metricValue}>
                  {(systemMetrics.emotionalAnalysis.averageConfidence * 100)?.toFixed(1) || 'N/A'}%
                </Text>
              </View>
              
              {/* Emociones más frecuentes */}
              {systemMetrics.emotionalAnalysis.byEmotion && Object.keys(systemMetrics.emotionalAnalysis.byEmotion).length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Emociones Más Frecuentes:</Text>
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
            <Text style={styles.sectionTitle}>Protocolos Terapéuticos</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Protocolos Iniciados:</Text>
                <Text style={styles.metricValue}>{systemMetrics.protocols.started}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Protocolos Completados:</Text>
                <Text style={styles.metricValue}>{systemMetrics.protocols.completed}</Text>
              </View>
              {systemMetrics.protocols.completed > 0 && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Tasa de Completación:</Text>
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
            <Text style={styles.sectionTitle}>Sugerencias de Acciones</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Sugerencias Generadas:</Text>
                <Text style={styles.metricValue}>{systemMetrics.actionSuggestions.generated}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Sugerencias Clickeadas:</Text>
                <Text style={styles.metricValue}>{systemMetrics.actionSuggestions.clicked}</Text>
              </View>
              {systemMetrics.actionSuggestions.generated > 0 && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Tasa de Click:</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
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
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border || colors.accent + '30',
  },
  statusCard: {
    backgroundColor: colors.cardBackground || colors.background,
    borderRadius: 12,
    padding: 16,
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
    borderBottomColor: colors.border || colors.accent + '20',
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
    borderTopColor: colors.border || colors.accent + '20',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
  },
});

export default SystemHealthScreen;

