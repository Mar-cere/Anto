/**
 * Hook para EmergencyAlertsHistoryScreen: carga resiliente, errores por pestaña y formateo.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  TABS,
  useEmergencyAlertsHistoryTexts,
} from './emergencyAlertsHistoryConstants';
import { safeNonNegativeInt } from './emergencyAlertsHistoryUtils';

function rgbaFromHex(hex, alpha = 1) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function reasonToMessage(reason, texts) {
  if (reason instanceof Error) return texts.ERROR_UNKNOWN;
  if (reason && typeof reason === 'object' && reason.message != null) return texts.ERROR_UNKNOWN;
  return texts.ERROR_UNKNOWN;
}

function parseHistoryResponse(res, texts) {
  if (!res || typeof res !== 'object' || res.notModified) {
    return { ok: false, error: texts.ERROR };
  }
  if (res.success === false) {
    return { ok: false, error: texts.ERROR };
  }
  if (!res.success || !Array.isArray(res.data)) {
    return { ok: false, error: texts.ERROR };
  }
  return { ok: true, data: res.data };
}

function parseObjectDataResponse(res, texts) {
  if (!res || typeof res !== 'object' || res.notModified) {
    return { ok: false, error: texts.ERROR };
  }
  if (res.success === false) {
    return { ok: false, error: texts.ERROR };
  }
  if (!res.success || res.data == null || typeof res.data !== 'object' || Array.isArray(res.data)) {
    return { ok: false, error: texts.ERROR };
  }
  return { ok: true, data: res.data };
}

export function useEmergencyAlertsHistoryScreen() {
  const TEXTS = useEmergencyAlertsHistoryTexts();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [activeTab, setActiveTabState] = useState(TABS.HISTORY);
  const setActiveTab = useCallback((tab) => {
    if (tab === TABS.HISTORY || tab === TABS.STATS || tab === TABS.PATTERNS) {
      setActiveTabState(tab);
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [patternsError, setPatternsError] = useState(null);

  const loadData = useCallback(async ({ isRefresh = false } = {}) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);
    setStatsError(null);
    setPatternsError(null);

    try {
      const settled = await Promise.allSettled([
        api.get(ENDPOINTS.EMERGENCY_ALERTS, { limit: '100', skip: '0' }),
        api.get(ENDPOINTS.EMERGENCY_ALERTS_STATS, { days: '30' }),
        api.get(ENDPOINTS.EMERGENCY_ALERTS_PATTERNS, { days: '90' }),
      ]);

      if (!isMountedRef.current) return;

      const h0 = settled[0];
      const historyParsed =
        h0.status === 'fulfilled'
          ? parseHistoryResponse(h0.value, TEXTS)
          : { ok: false, error: reasonToMessage(h0.reason, TEXTS) };

      if (!historyParsed.ok) {
        setHistory([]);
        setStats(null);
        setPatterns(null);
        setError(historyParsed.error);
        return;
      }

      const historyRows = historyParsed.data;
      setHistory(Array.isArray(historyRows) ? historyRows : []);
      setError(null);

      const s1 = settled[1];
      const statsParsed =
        s1.status === 'fulfilled'
          ? parseObjectDataResponse(s1.value, TEXTS)
          : { ok: false, error: reasonToMessage(s1.reason, TEXTS) };
      if (statsParsed.ok) {
        setStats(statsParsed.data);
        setStatsError(null);
      } else {
        setStats(null);
        setStatsError(
          statsParsed.error && statsParsed.error !== TEXTS.ERROR
            ? statsParsed.error
            : TEXTS.TAB_STATS_FAILED
        );
      }

      const p2 = settled[2];
      const patternsParsed =
        p2.status === 'fulfilled'
          ? parseObjectDataResponse(p2.value, TEXTS)
          : { ok: false, error: reasonToMessage(p2.reason, TEXTS) };
      if (patternsParsed.ok) {
        setPatterns(patternsParsed.data);
        setPatternsError(null);
      } else {
        setPatterns(null);
        setPatternsError(
          patternsParsed.error && patternsParsed.error !== TEXTS.ERROR
            ? patternsParsed.error
            : TEXTS.TAB_PATTERNS_FAILED
        );
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setHistory([]);
      setStats(null);
      setPatterns(null);
      setError(err?.message != null ? String(err.message) : TEXTS.ERROR_UNKNOWN);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [TEXTS]);

  const retryStats = useCallback(async () => {
    setStatsError(null);
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS_STATS, { days: '30' });
      if (!isMountedRef.current) return;
      const parsed = parseObjectDataResponse(response, TEXTS);
      if (parsed.ok) {
        setStats(parsed.data);
      } else {
        setStatsError(
          parsed.error && parsed.error !== TEXTS.ERROR ? parsed.error : TEXTS.TAB_STATS_FAILED
        );
      }
    } catch {
      if (!isMountedRef.current) return;
      setStatsError(TEXTS.TAB_STATS_FAILED);
    }
  }, [TEXTS]);

  const retryPatterns = useCallback(async () => {
    setPatternsError(null);
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY_ALERTS_PATTERNS, { days: '90' });
      if (!isMountedRef.current) return;
      const parsed = parseObjectDataResponse(response, TEXTS);
      if (parsed.ok) {
        setPatterns(parsed.data);
      } else {
        setPatternsError(
          parsed.error && parsed.error !== TEXTS.ERROR ? parsed.error : TEXTS.TAB_PATTERNS_FAILED
        );
      }
    } catch {
      if (!isMountedRef.current) return;
      setPatternsError(TEXTS.TAB_PATTERNS_FAILED);
    }
  }, [TEXTS]);

  useEffect(() => {
    loadData({ isRefresh: false });
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData({ isRefresh: true });
  }, [loadData]);

  const formatDate = useCallback((dateString) => {
    if (dateString == null || dateString === '') return TEXTS.DATE_UNAVAILABLE;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return TEXTS.DATE_UNAVAILABLE;
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [language, TEXTS.DATE_UNAVAILABLE]);

  const formatRiskLevelData = useCallback(() => {
    if (!stats?.byRiskLevel || typeof stats.byRiskLevel !== 'object') return null;
    return {
      labels: [TEXTS.MEDIUM.toUpperCase(), TEXTS.HIGH.toUpperCase()],
      datasets: [{
        data: [
          safeNonNegativeInt(stats.byRiskLevel.MEDIUM, 0),
          safeNonNegativeInt(stats.byRiskLevel.HIGH, 0),
        ],
      }],
    };
  }, [stats, TEXTS.MEDIUM, TEXTS.HIGH]);

  const formatStatusData = useCallback(() => {
    if (!stats?.byStatus || typeof stats.byStatus !== 'object') return null;
    return [
      {
        name: TEXTS.SENT,
        population: safeNonNegativeInt(stats.byStatus.sent, 0),
        color: colors.success,
        legendFontColor: colors.textOnPrimary,
      },
      {
        name: TEXTS.PARTIAL,
        population: safeNonNegativeInt(stats.byStatus.partial, 0),
        color: colors.warning,
        legendFontColor: colors.textOnPrimary,
      },
      {
        name: TEXTS.FAILED,
        population: safeNonNegativeInt(stats.byStatus.failed, 0),
        color: colors.error,
        legendFontColor: colors.textOnPrimary,
      },
    ].filter((item) => item.population > 0);
  }, [stats, colors, TEXTS.SENT, TEXTS.PARTIAL, TEXTS.FAILED]);

  const formatChannelData = useCallback(() => {
    if (!stats?.byChannel || typeof stats.byChannel !== 'object') return null;
    const email = stats.byChannel.email;
    const wa = stats.byChannel.whatsapp;
    return {
      labels: [TEXTS.EMAIL, TEXTS.WHATSAPP],
      datasets: [
        {
          data: [
            safeNonNegativeInt(email?.sent, 0),
            safeNonNegativeInt(wa?.sent, 0),
          ],
          color: (opacity = 1) => rgbaFromHex(colors.primary, opacity),
        },
        {
          data: [
            safeNonNegativeInt(email?.failed, 0),
            safeNonNegativeInt(wa?.failed, 0),
          ],
          color: (opacity = 1) => rgbaFromHex(colors.error, opacity),
        },
      ],
    };
  }, [stats, colors, TEXTS.EMAIL, TEXTS.WHATSAPP]);

  const formatDayData = useCallback(() => {
    if (!stats?.byDay || typeof stats.byDay !== 'object' || Array.isArray(stats.byDay)) return null;
    const entries = Object.entries(stats.byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);
    return {
      labels: entries.map(([dateStr]) => {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return TEXTS.DATE_UNAVAILABLE;
        return d.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
          day: '2-digit',
          month: '2-digit',
        });
      }),
      datasets: [{ data: entries.map(([, count]) => safeNonNegativeInt(count, 0)) }],
    };
  }, [stats, TEXTS.DATE_UNAVAILABLE, language]);

  return {
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    error,
    history,
    stats,
    patterns,
    statsError,
    patternsError,
    loadData,
    retryStats,
    retryPatterns,
    onRefresh,
    formatDate,
    formatRiskLevelData,
    formatStatusData,
    formatChannelData,
    formatDayData,
  };
}
