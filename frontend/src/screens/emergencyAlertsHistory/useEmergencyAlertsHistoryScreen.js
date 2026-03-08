/**
 * Hook para EmergencyAlertsHistoryScreen: estado, carga de datos y formateo para gráficos.
 */
import { useCallback, useEffect, useState } from 'react';
import { api, ENDPOINTS } from '../../config/api';
import { TEXTS, TABS } from './emergencyAlertsHistoryConstants';

export function useEmergencyAlertsHistoryScreen() {
  const [activeTab, setActiveTab] = useState(TABS.HISTORY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [patterns, setPatterns] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS, { limit: 100, skip: 0 });
      if (response.success) setHistory(response.data || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError(err.message);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS_STATS, { days: 30 });
      if (response.success) setStats(response.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  const loadPatterns = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS_PATTERNS, { days: 90 });
      if (response.success) setPatterns(response.data);
    } catch (err) {
      console.error('Error cargando patrones:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadHistory(), loadStats(), loadPatterns()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadHistory, loadStats, loadPatterns]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatRiskLevelData = useCallback(() => {
    if (!stats?.byRiskLevel) return null;
    return {
      labels: ['MEDIO', 'ALTO'],
      datasets: [{
        data: [stats.byRiskLevel.MEDIUM || 0, stats.byRiskLevel.HIGH || 0],
      }],
    };
  }, [stats]);

  const formatStatusData = useCallback(() => {
    if (!stats?.byStatus) return null;
    const data = [
      { name: TEXTS.SENT, population: stats.byStatus.sent || 0, color: '#4ECDC4', legendFontColor: '#FFFFFF' },
      { name: TEXTS.PARTIAL, population: stats.byStatus.partial || 0, color: '#FFA500', legendFontColor: '#FFFFFF' },
      { name: TEXTS.FAILED, population: stats.byStatus.failed || 0, color: '#FF6B6B', legendFontColor: '#FFFFFF' },
    ].filter((item) => item.population > 0);
    return data;
  }, [stats]);

  const formatChannelData = useCallback(() => {
    if (!stats?.byChannel) return null;
    return {
      labels: [TEXTS.EMAIL, TEXTS.WHATSAPP],
      datasets: [
        {
          data: [
            stats.byChannel.email?.sent || 0,
            stats.byChannel.whatsapp?.sent || 0,
          ],
          color: (opacity = 1) => `rgba(26, 221, 219, ${opacity})`,
        },
        {
          data: [
            stats.byChannel.email?.failed || 0,
            stats.byChannel.whatsapp?.failed || 0,
          ],
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        },
      ],
    };
  }, [stats]);

  const formatDayData = useCallback(() => {
    if (!stats?.byDay) return null;
    const entries = Object.entries(stats.byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);
    return {
      labels: entries.map(([date]) => {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      }),
      datasets: [{ data: entries.map(([, count]) => count) }],
    };
  }, [stats]);

  return {
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    error,
    history,
    stats,
    patterns,
    loadData,
    onRefresh,
    formatDate,
    formatRiskLevelData,
    formatStatusData,
    formatChannelData,
    formatDayData,
  };
}
