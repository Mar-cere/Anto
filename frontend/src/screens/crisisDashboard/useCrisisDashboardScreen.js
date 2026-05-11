/**
 * Hook para CrisisDashboardScreen: carga de métricas, tendencias, historial y formateo para gráficos.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ENDPOINTS } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import {
  TEXTS,
  createEmotionColors,
  createRiskLevelColors,
  RISK_LEVEL_TEXTS,
  TREND_PERIODS,
} from './crisisDashboardConstants';

function normalizeSummary(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rate = Number(raw.resolutionRate);
  return {
    ...raw,
    totalCrises: Number(raw.totalCrises) || 0,
    crisesThisMonth: Number(raw.crisesThisMonth) || 0,
    recentCrises: Number(raw.recentCrises) || 0,
    resolutionRate: Number.isFinite(rate) ? Math.max(0, Math.min(1, rate)) : 0,
    averageRiskLevel: raw.averageRiskLevel || 'LOW',
  };
}

function reasonToMessage(reason) {
  if (reason instanceof Error) return reason.message || TEXTS.ERROR_UNKNOWN;
  if (reason && typeof reason === 'object' && reason.message != null) {
    return String(reason.message);
  }
  return TEXTS.ERROR_UNKNOWN;
}

function pickSummaryFailureMessage(settledSummary) {
  if (settledSummary.status === 'rejected') {
    return reasonToMessage(settledSummary.reason);
  }
  const v = settledSummary.value;
  if (v && typeof v === 'object') {
    if (typeof v.message === 'string' && v.message.length > 0) return v.message;
    if (typeof v.error === 'string' && v.error.length > 0) return v.error;
  }
  return TEXTS.ERROR;
}

export function useCrisisDashboardScreen() {
  const { colors } = useTheme();
  const emotionColorMap = useMemo(() => createEmotionColors(colors), [colors]);
  const riskLevelColorMap = useMemo(() => createRiskLevelColors(colors), [colors]);

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
      const settled = await Promise.allSettled([
        api.get(ENDPOINTS.CRISIS_SUMMARY, { days: '30' }),
        api.get(ENDPOINTS.CRISIS_TRENDS, { period: trendPeriod }),
        api.get(ENDPOINTS.CRISIS_BY_MONTH, { months: '6' }),
        api.get(ENDPOINTS.CRISIS_EMOTION_DISTRIBUTION, { days: '30' }),
        api.get(ENDPOINTS.CRISIS_HISTORY, { limit: '5' }),
      ]);

      let summaryOk = false;

      const s0 = settled[0];
      if (
        s0.status === 'fulfilled' &&
        s0.value?.success &&
        s0.value.data != null &&
        typeof s0.value.data === 'object' &&
        !Array.isArray(s0.value.data)
      ) {
        const normalized = normalizeSummary(s0.value.data);
        if (normalized) {
          setSummary(normalized);
          summaryOk = true;
        } else {
          setSummary(null);
        }
      } else {
        setSummary(null);
      }

      const s1 = settled[1];
      if (
        s1.status === 'fulfilled' &&
        s1.value?.success &&
        s1.value.data != null &&
        typeof s1.value.data === 'object'
      ) {
        const v = s1.value.data;
        const pts = Array.isArray(v.dataPoints) ? v.dataPoints : [];
        setTrends({ ...v, dataPoints: pts });
      } else {
        setTrends(null);
      }

      const s2 = settled[2];
      if (s2.status === 'fulfilled' && s2.value?.success && Array.isArray(s2.value.data)) {
        setCrisisByMonth(s2.value.data);
      } else {
        setCrisisByMonth([]);
      }

      const s3 = settled[3];
      if (
        s3.status === 'fulfilled' &&
        s3.value?.success &&
        s3.value.data != null &&
        typeof s3.value.data === 'object'
      ) {
        const d = s3.value.data;
        const dist =
          d.distribution != null && typeof d.distribution === 'object' && !Array.isArray(d.distribution)
            ? d.distribution
            : {};
        setEmotionDistribution({
          ...d,
          distribution: dist,
          total: Number(d.total) || 0,
        });
      } else {
        setEmotionDistribution(null);
      }

      const s4 = settled[4];
      if (
        s4.status === 'fulfilled' &&
        s4.value?.success &&
        s4.value.data != null &&
        typeof s4.value.data === 'object'
      ) {
        const c = s4.value.data.crises;
        setHistory(Array.isArray(c) ? c : []);
      } else {
        setHistory([]);
      }

      if (!summaryOk) {
        setError(pickSummaryFailureMessage(s0));
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
      setError(err?.message != null ? String(err.message) : TEXTS.ERROR_UNKNOWN);
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
    if (!TREND_PERIODS.includes(period)) {
      return;
    }
    setTrendPeriod(period);
    setRefreshing(true);
  }, []);

  const formatTrendData = useCallback(() => {
    if (!trends?.dataPoints || trends.dataPoints.length === 0) {
      return { labels: ['Sin datos'], datasets: [{ data: [0] }] };
    }
    const labels = trends.dataPoints.map((point) => {
      const date = new Date(point?.date);
      if (Number.isNaN(date.getTime())) return TEXTS.DATE_UNAVAILABLE;
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = trends.dataPoints.map((point) => {
      const n = Number(point?.intensity);
      return Number.isFinite(n) ? n : 0;
    });
    return {
      labels: labels.length > 10 ? labels.filter((_, i) => i % 2 === 0) : labels,
      datasets: [{ data }],
    };
  }, [trends]);

  const formatMonthlyData = useCallback(() => {
    if (!crisisByMonth || crisisByMonth.length === 0) {
      return { labels: ['Sin datos'], datasets: [{ data: [0] }] };
    }
    const labels = crisisByMonth.map((item) =>
      item != null && item.month != null ? String(item.month) : TEXTS.DATE_UNAVAILABLE
    );
    const data = crisisByMonth.map((item) => {
      const n = Number(item?.crises);
      return Number.isFinite(n) ? n : 0;
    });
    return { labels, datasets: [{ data }] };
  }, [crisisByMonth]);

  const formatEmotionDistribution = useCallback(() => {
    if (!emotionDistribution?.distribution) return [];
    return Object.entries(emotionDistribution.distribution)
      .filter(([, value]) => Number(value) > 0)
      .map(([emotion, value]) => ({
        name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        value: Math.round(Number(value) * 100),
        color: emotionColorMap[emotion] || colors.primary,
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      }));
  }, [emotionDistribution, emotionColorMap, colors.primary, colors.textSecondary]);

  const getRiskLevelColor = useCallback(
    (level) => riskLevelColorMap[level] || riskLevelColorMap.LOW,
    [riskLevelColorMap],
  );

  const getRiskLevelText = useCallback((level) => {
    if (level != null && RISK_LEVEL_TEXTS[level]) return RISK_LEVEL_TEXTS[level];
    return level != null && level !== '' ? String(level) : '—';
  }, []);

  const formatDate = useCallback((dateString) => {
    if (dateString == null || dateString === '') return TEXTS.DATE_UNAVAILABLE;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return TEXTS.DATE_UNAVAILABLE;
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

  const getTrendInlineColor = useCallback(() => {
    if (!trends?.trend) return null;
    if (trends.trend === 'improving') return colors.success;
    if (trends.trend === 'declining') return colors.error;
    return null;
  }, [trends, colors.success, colors.error]);

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
    getTrendIconColor: getTrendInlineColor,
  };
}
