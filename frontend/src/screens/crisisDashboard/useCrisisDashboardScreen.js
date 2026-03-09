/**
 * Hook para CrisisDashboardScreen: carga de métricas, tendencias, historial y formateo para gráficos.
 */
import { useCallback, useEffect, useState } from 'react';
import { api, ENDPOINTS } from '../../config/api';
import {
  TEXTS,
  EMOTION_COLORS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_TEXTS,
} from './crisisDashboardConstants';

export function useCrisisDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [crisisByMonth, setCrisisByMonth] = useState([]);
  const [emotionDistribution, setEmotionDistribution] = useState(null);
  const [history, setHistory] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState('30d');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, trendsRes, monthlyRes, distributionRes, historyRes] = await Promise.all([
        api.get(ENDPOINTS.CRISIS_SUMMARY, { days: '30' }),
        api.get(ENDPOINTS.CRISIS_TRENDS, { period: trendPeriod }),
        api.get(ENDPOINTS.CRISIS_BY_MONTH, { months: '6' }),
        api.get(ENDPOINTS.CRISIS_EMOTION_DISTRIBUTION, { days: '30' }),
        api.get(ENDPOINTS.CRISIS_HISTORY, { limit: '5' }),
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (monthlyRes.success) setCrisisByMonth(monthlyRes.data);
      if (distributionRes.success) setEmotionDistribution(distributionRes.data);
      if (historyRes.success) setHistory(historyRes.data?.crises || []);
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

  const setTrendPeriodAndReload = useCallback((period) => {
    setTrendPeriod(period);
    setRefreshing(true);
  }, []);

  const formatTrendData = useCallback(() => {
    if (!trends?.dataPoints || trends.dataPoints.length === 0) {
      return { labels: ['Sin datos'], datasets: [{ data: [0] }] };
    }
    const labels = trends.dataPoints.map((point) => {
      const date = new Date(point.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = trends.dataPoints.map((point) => point.intensity);
    return {
      labels: labels.length > 10 ? labels.filter((_, i) => i % 2 === 0) : labels,
      datasets: [{ data }],
    };
  }, [trends]);

  const formatMonthlyData = useCallback(() => {
    if (!crisisByMonth || crisisByMonth.length === 0) {
      return { labels: ['Sin datos'], datasets: [{ data: [0] }] };
    }
    const labels = crisisByMonth.map((item) => item.month);
    const data = crisisByMonth.map((item) => item.crises);
    return { labels, datasets: [{ data }] };
  }, [crisisByMonth]);

  const formatEmotionDistribution = useCallback(() => {
    if (!emotionDistribution?.distribution) return [];
    return Object.entries(emotionDistribution.distribution)
      .filter(([, value]) => value > 0)
      .map(([emotion, value]) => ({
        name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        value: Math.round(value * 100),
        color: EMOTION_COLORS[emotion] || '#1ADDDB',
        legendFontColor: '#ffffff',
        legendFontSize: 12,
      }));
  }, [emotionDistribution]);

  const getRiskLevelColor = useCallback((level) => {
    return RISK_LEVEL_COLORS[level] || RISK_LEVEL_COLORS.LOW;
  }, []);

  const getRiskLevelText = useCallback((level) => {
    return RISK_LEVEL_TEXTS[level] || level;
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getTrendLabel = useCallback(() => {
    if (!trends?.trend) return null;
    const trendLabels = {
      improving: TEXTS.TREND_IMPROVING,
      declining: TEXTS.TREND_DECLINING,
    };
    return TEXTS.TREND_LABEL + (trendLabels[trends.trend] || TEXTS.TREND_STABLE);
  }, [trends]);

  const getTrendIcon = useCallback(() => {
    if (!trends?.trend) return null;
    if (trends.trend === 'improving') return 'trending-down';
    if (trends.trend === 'declining') return 'trending-up';
    return 'trending-neutral';
  }, [trends]);

  const getTrendIconColor = useCallback(() => {
    if (!trends?.trend) return null;
    if (trends.trend === 'improving') return '#4ECDC4';
    if (trends.trend === 'declining') return '#FF6B6B';
    return null;
  }, [trends]);

  return {
    loading,
    refreshing,
    error,
    summary,
    trends,
    crisisByMonth,
    emotionDistribution,
    history,
    trendPeriod,
    loadData,
    onRefresh,
    setTrendPeriod: setTrendPeriodAndReload,
    formatTrendData,
    formatMonthlyData,
    formatEmotionDistribution,
    getRiskLevelColor,
    getRiskLevelText,
    formatDate,
    getTrendLabel,
    getTrendIcon,
    getTrendIconColor,
  };
}
