/**
 * Resumen semanal (lunes–domingo) y mensual de actividad en la app.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import { api, ENDPOINTS } from '../config/api';
import { colors } from '../styles/globalStyles';

const TEXTS = {
  TITLE: 'Tu resumen',
  WEEK: 'Semana',
  MONTH: 'Mes',
  LOADING: 'Cargando resumen...',
  ERROR: 'No se pudo cargar el resumen',
  RETRY: 'Reintentar',
  CHAT: 'Conversación',
  EMOTIONS: 'Emociones y temas',
  TECHNIQUES: 'Técnicas terapéuticas',
  TASKS: 'Tareas',
  HABITS: 'Hábitos',
  JOURNAL: 'Diario de gratitud',
  USER_MSGS: 'Mensajes tuyos',
  ASSISTANT_MSGS: 'Respuestas del asistente',
  ACTIVE_DAYS: 'Días con actividad',
  CONVERSATIONS: 'Conversaciones distintas',
  INSIGHT_COUNT: 'Registros emocionales (insights)',
  SESSIONS: 'Sesiones de progreso',
  TECH_USES: 'Usos de técnicas',
  TECH_COMPLETED: 'Completados',
  EFFECTIVENESS: 'Efectividad media (1–5)',
  TASKS_DONE: 'Tareas completadas',
  TASKS_NEW: 'Tareas nuevas creadas',
  HABIT_COMPLETIONS: 'Completados de hábitos (período)',
  HABITS_ACTIVE: 'Hábitos activos',
  BEST_STREAK: 'Mejor racha actual (activos)',
  JOURNAL_ENTRIES: 'Entradas de diario',
  NO_DATA: 'Sin datos en este período',
  PREV: 'Anterior',
  NEXT: 'Siguiente',
};

function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthTitleEs(year, month1to12) {
  const d = new Date(year, month1to12 - 1, 1);
  return d.toLocaleDateString('es', { month: 'long', year: 'numeric' });
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatRow({ label, value }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const [granularity, setGranularity] = useState('week');
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthYear, setMonthYear] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  });
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const queryParams = useMemo(() => {
    if (granularity === 'week') {
      return { period: 'week', date: formatYmd(weekAnchor) };
    }
    return {
      period: 'month',
      year: String(monthYear.year),
      month: String(monthYear.month),
    };
  }, [granularity, weekAnchor, monthYear]);

  const load = useCallback(
    async (fromPull = false) => {
      if (!fromPull) setLoading(true);
      setError(null);
      try {
        const res = await api.get(ENDPOINTS.SUMMARY, queryParams);
        if (res && typeof res === 'object' && 'data' in res && res.data) {
          setPayload(res.data);
        } else {
          setPayload(null);
        }
      } catch (e) {
        console.error('[SummaryScreen]', e);
        setError(TEXTS.ERROR);
        setPayload(null);
      } finally {
        if (!fromPull) setLoading(false);
        if (fromPull) setRefreshing(false);
      }
    },
    [queryParams]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const shiftWeek = (delta) => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + delta * 7);
    setWeekAnchor(d);
  };

  const shiftMonth = (delta) => {
    setMonthYear((prev) => {
      let m = prev.month + delta;
      let y = prev.year;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      return { year: y, month: m };
    });
  };

  const emotionLines = payload?.emotions?.insightsEmotionsTop?.length
    ? payload.emotions.insightsEmotionsTop
        .slice(0, 5)
        .map((x) => `${x.emotion}: ${x.count}`)
        .join(' · ')
    : TEXTS.NO_DATA;

  const topicLines = payload?.emotions?.progressTopicsTop?.length
    ? payload.emotions.progressTopicsTop
        .slice(0, 5)
        .map((x) => `${x.topic}: ${x.count}`)
        .join(' · ')
    : TEXTS.NO_DATA;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton />

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, granularity === 'week' && styles.toggleBtnActive]}
          onPress={() => setGranularity('week')}
        >
          <Text style={[styles.toggleText, granularity === 'week' && styles.toggleTextActive]}>
            {TEXTS.WEEK}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, granularity === 'month' && styles.toggleBtnActive]}
          onPress={() => setGranularity('month')}
        >
          <Text style={[styles.toggleText, granularity === 'month' && styles.toggleTextActive]}>
            {TEXTS.MONTH}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => (granularity === 'week' ? shiftWeek(-1) : shiftMonth(-1))}
          accessibilityLabel={TEXTS.PREV}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.periodLabel} numberOfLines={2}>
          {granularity === 'week'
            ? payload?.period?.label || '…'
            : monthTitleEs(monthYear.year, monthYear.month)}
        </Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => (granularity === 'week' ? shiftWeek(1) : shiftMonth(1))}
          accessibilityLabel={TEXTS.NEXT}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading && !payload ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>{TEXTS.LOADING}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {payload?.period?.label && granularity === 'month' ? (
            <Text style={styles.subPeriod}>{payload.period.label}</Text>
          ) : null}

          <SectionCard title={TEXTS.CHAT}>
            <StatRow label={TEXTS.USER_MSGS} value={String(payload?.chat?.userMessages ?? 0)} />
            <StatRow label={TEXTS.ASSISTANT_MSGS} value={String(payload?.chat?.assistantMessages ?? 0)} />
            <StatRow label={TEXTS.ACTIVE_DAYS} value={String(payload?.chat?.distinctActiveDays ?? 0)} />
            <StatRow label={TEXTS.CONVERSATIONS} value={String(payload?.chat?.conversationsTouched ?? 0)} />
          </SectionCard>

          <SectionCard title={TEXTS.EMOTIONS}>
            <StatRow
              label={TEXTS.INSIGHT_COUNT}
              value={String(payload?.emotions?.insightInteractionsCount ?? 0)}
            />
            <Text style={styles.detailMuted}>Top: {emotionLines}</Text>
            <StatRow
              label={TEXTS.SESSIONS}
              value={String(payload?.emotions?.progressSessionsCount ?? 0)}
            />
            <Text style={styles.detailMuted}>Temas: {topicLines}</Text>
          </SectionCard>

          <SectionCard title={TEXTS.TECHNIQUES}>
            <StatRow label={TEXTS.TECH_USES} value={String(payload?.techniques?.totalUses ?? 0)} />
            <StatRow label={TEXTS.TECH_COMPLETED} value={String(payload?.techniques?.completedUses ?? 0)} />
            <StatRow
              label={TEXTS.EFFECTIVENESS}
              value={
                payload?.techniques?.averageEffectiveness != null
                  ? String(payload.techniques.averageEffectiveness)
                  : '—'
              }
            />
          </SectionCard>

          <SectionCard title={TEXTS.TASKS}>
            <StatRow label={TEXTS.TASKS_DONE} value={String(payload?.tasks?.completedInPeriod ?? 0)} />
            <StatRow label={TEXTS.TASKS_NEW} value={String(payload?.tasks?.createdInPeriod ?? 0)} />
          </SectionCard>

          <SectionCard title={TEXTS.HABITS}>
            <StatRow label={TEXTS.HABIT_COMPLETIONS} value={String(payload?.habits?.completionsInPeriod ?? 0)} />
            <StatRow label={TEXTS.HABITS_ACTIVE} value={String(payload?.habits?.activeHabitsCount ?? 0)} />
            <StatRow label={TEXTS.BEST_STREAK} value={String(payload?.habits?.bestCurrentStreakAmongActive ?? 0)} />
            {(payload?.habits?.topHabitsInPeriod || []).length > 0 ? (
              <Text style={styles.detailMuted}>
                {(payload.habits.topHabitsInPeriod || [])
                  .map((h) => `${h.title} (${h.completionsRecorded})`)
                  .join(' · ')}
              </Text>
            ) : null}
          </SectionCard>

          <SectionCard title={TEXTS.JOURNAL}>
            <StatRow label={TEXTS.JOURNAL_ENTRIES} value={String(payload?.journal?.entriesCount ?? 0)} />
          </SectionCard>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(29, 43, 95, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(26, 221, 219, 0.25)',
  },
  toggleText: {
    color: '#A3ADDB',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.white,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  navBtn: {
    padding: 8,
  },
  periodLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  subPeriod: {
    color: '#A3ADDB',
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'rgba(29, 43, 95, 0.85)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.12)',
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    color: '#A3ADDB',
    flex: 1,
    paddingRight: 8,
  },
  statValue: {
    color: colors.white,
    fontWeight: '600',
  },
  detailMuted: {
    color: '#8899cc',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  muted: {
    color: '#A3ADDB',
    marginTop: 12,
  },
  errorText: {
    color: '#FF9F9F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: 'rgba(26, 221, 219, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
});
