/**
 * Resumen semanal / mensual — minimalista con skeleton al recargar, vacío con CTA e info.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
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
  LOADING: 'Cargando…',
  ERROR: 'No se pudo cargar',
  RETRY: 'Reintentar',
  PREV: 'Anterior',
  NEXT: 'Siguiente',
  FOOTER_HINT: 'Los números corresponden solo a este período.',
  HOW_WE_COUNT: 'Cómo leemos estos números',
  TOOLTIP_TITLE: 'Cómo contamos',
  TOOLTIP_CLOSE: 'Entendido',
  TOOLTIP_BODY: `• Semana: de lunes a domingo (hora de tu dispositivo).\n• Mes: del día 1 al último día del mes calendario.\n• Mensajes y días activos: solo tu actividad en el chat en ese tramo.\n• Hábitos (vista semana): sumamos días según los bloques de 7 días del calendario de hábitos que se solapan con esa semana. En mes usamos el resumen mensual de cada hábito.\n• Tono emocional: a partir de registros guardados en tus interacciones, no es un diagnóstico.`,
  TILE_CHAT: 'Mensajes',
  TILE_DAYS: 'Días activos',
  TILE_TECHNIQUES: 'Técnicas',
  TILE_TASKS: 'Tareas hechas',
  TILE_HABITS: 'Hábitos',
  TILE_JOURNAL: 'Gratitud',
  PULSE: 'Tono emocional',
  PULSE_EMPTY: 'Sin registros emocionales este período.',
  EMPTY_TITLE: 'Semana tranquila en la app',
  EMPTY_SUB:
    'No pasa nada. Cuando quieras retomar, aquí tienes un par de pasos sin presión.',
  CTA_CHAT: 'Hablar con Anto',
  CTA_GRATITUDE: 'Escribir gratitud',
  CTA_TECHNIQUES: 'Ver técnicas',
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

function isSummaryEmpty(p) {
  if (!p) return false;
  const sum =
    (p.chat?.userMessages ?? 0) +
    (p.chat?.distinctActiveDays ?? 0) +
    (p.techniques?.totalUses ?? 0) +
    (p.tasks?.completedInPeriod ?? 0) +
    (p.habits?.completionsInPeriod ?? 0) +
    (p.journal?.entriesCount ?? 0);
  return sum === 0;
}

function MetricTile({ icon, value, label }) {
  return (
    <View style={styles.tile}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} style={styles.tileIcon} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function NarrativeCard({ narrative }) {
  if (!narrative) return null;
  return (
    <View style={styles.narrativeCard}>
      <Text style={styles.narrativeTitle}>Resumen</Text>
      <Text style={styles.narrativeLine}>
        <Text style={styles.narrativeLabel}>Temas: </Text>
        {narrative.themes}
      </Text>
      <Text style={styles.narrativeLine}>
        <Text style={styles.narrativeLabel}>Micro-logros: </Text>
        {narrative.microWins}
      </Text>
      <Text style={styles.narrativeQuestion}>{narrative.nextQuestion}</Text>
    </View>
  );
}

function SkeletonTile() {
  return <View style={styles.skeletonTile} />;
}

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <SkeletonTile key={k} />
      ))}
    </View>
  );
}

function EmptyState({ navigation }) {
  return (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons name="sleep" size={40} color={colors.textSecondary} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{TEXTS.EMPTY_TITLE}</Text>
      <Text style={styles.emptySub}>{TEXTS.EMPTY_SUB}</Text>
      <TouchableOpacity
        style={styles.ctaPrimary}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="chat-outline" size={20} color={colors.background} style={styles.ctaIcon} />
        <Text style={styles.ctaPrimaryText}>{TEXTS.CTA_CHAT}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ctaSecondary}
        onPress={() => navigation.navigate('GratitudeJournal')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="notebook-outline" size={20} color={colors.primary} style={styles.ctaIcon} />
        <Text style={styles.ctaSecondaryText}>{TEXTS.CTA_GRATITUDE}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ctaSecondary}
        onPress={() => navigation.navigate('TherapeuticTechniques')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="head-heart-outline" size={20} color={colors.primary} style={styles.ctaIcon} />
        <Text style={styles.ctaSecondaryText}>{TEXTS.CTA_TECHNIQUES}</Text>
      </TouchableOpacity>
    </View>
  );
}

function HowWeCountModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} accessibilityRole="button">
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{TEXTS.TOOLTIP_TITLE}</Text>
          <Text style={styles.modalBody}>{TEXTS.TOOLTIP_BODY}</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.modalBtnText}>{TEXTS.TOOLTIP_CLOSE}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
  const [dataStale, setDataStale] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const hasShownPayloadRef = useRef(false);
  const summaryAbortRef = useRef(null);
  const summaryReqSeqRef = useRef(0);

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
      summaryAbortRef.current?.abort();
      const ac = new AbortController();
      summaryAbortRef.current = ac;
      const seq = ++summaryReqSeqRef.current;

      if (!fromPull) {
        setRefreshing(false);
      }
      if (hasShownPayloadRef.current) {
        setDataStale(true);
      }
      if (!fromPull && !hasShownPayloadRef.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await api.get(ENDPOINTS.SUMMARY, queryParams, { signal: ac.signal });
        if (seq !== summaryReqSeqRef.current) return;
        if (res && typeof res === 'object' && 'data' in res && res.data) {
          setPayload(res.data);
          hasShownPayloadRef.current = true;
        } else {
          setPayload(null);
          hasShownPayloadRef.current = false;
        }
      } catch (e) {
        if (e?.name === 'AbortError') return;
        if (seq !== summaryReqSeqRef.current) return;
        console.error('[SummaryScreen]', e);
        setError(TEXTS.ERROR);
        setPayload(null);
        hasShownPayloadRef.current = false;
      } finally {
        if (seq !== summaryReqSeqRef.current) return;
        setDataStale(false);
        if (!fromPull) setLoading(false);
        if (fromPull) setRefreshing(false);
      }
    },
    [queryParams]
  );

  useEffect(() => {
    return () => summaryAbortRef.current?.abort();
  }, []);

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

  const pulseLine = useMemo(() => {
    const top = payload?.emotions?.insightsEmotionsTop?.[0];
    if (!top?.emotion) return null;
    const n = top.count;
    const name = top.emotion;
    return `${name} · ${n} ${n === 1 ? 'vez' : 'veces'}`;
  }, [payload]);

  const periodEmpty = useMemo(() => isSummaryEmpty(payload), [payload]);

  const periodTitle =
    granularity === 'week'
      ? payload?.period?.label || '…'
      : monthTitleEs(monthYear.year, monthYear.month);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton />
      <HowWeCountModal visible={infoOpen} onClose={() => setInfoOpen(false)} />

      <View style={styles.topBar}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, granularity === 'week' && styles.segmentItemOn]}
            onPress={() => setGranularity('week')}
            accessibilityState={{ selected: granularity === 'week' }}
          >
            <Text style={[styles.segmentText, granularity === 'week' && styles.segmentTextOn]}>{TEXTS.WEEK}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, granularity === 'month' && styles.segmentItemOn]}
            onPress={() => setGranularity('month')}
            accessibilityState={{ selected: granularity === 'month' }}
          >
            <Text style={[styles.segmentText, granularity === 'month' && styles.segmentTextOn]}>{TEXTS.MONTH}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.periodNav}>
          <TouchableOpacity
            style={styles.chevronHit}
            onPress={() => (granularity === 'week' ? shiftWeek(-1) : shiftMonth(-1))}
            accessibilityLabel={TEXTS.PREV}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.periodTitle} numberOfLines={2}>
            {periodTitle}
          </Text>
          <TouchableOpacity
            style={styles.chevronHit}
            onPress={() => (granularity === 'week' ? shiftWeek(1) : shiftMonth(1))}
            accessibilityLabel={TEXTS.NEXT}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !payload ? (
        <View style={styles.centered}>
          <SkeletonGrid />
          <Text style={styles.loadingHint}>{TEXTS.LOADING}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(false)} activeOpacity={0.85}>
            <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <View style={styles.sheetWrap}>
            <View style={[styles.sheet, dataStale && styles.sheetDimmed]}>
              {periodEmpty ? (
                <EmptyState navigation={navigation} />
              ) : (
                <View>
                  <NarrativeCard narrative={payload?.narrative} />
                  <View style={styles.grid}>
                    <MetricTile
                      icon="message-text-outline"
                      value={String(payload?.chat?.userMessages ?? 0)}
                      label={TEXTS.TILE_CHAT}
                    />
                    <MetricTile
                      icon="calendar-blank-outline"
                      value={String(payload?.chat?.distinctActiveDays ?? 0)}
                      label={TEXTS.TILE_DAYS}
                    />
                    <MetricTile
                      icon="head-heart-outline"
                      value={String(payload?.techniques?.totalUses ?? 0)}
                      label={TEXTS.TILE_TECHNIQUES}
                    />
                    <MetricTile
                      icon="checkbox-marked-circle-outline"
                      value={String(payload?.tasks?.completedInPeriod ?? 0)}
                      label={TEXTS.TILE_TASKS}
                    />
                    <MetricTile
                      icon="repeat"
                      value={String(payload?.habits?.completionsInPeriod ?? 0)}
                      label={TEXTS.TILE_HABITS}
                    />
                    <MetricTile
                      icon="notebook-outline"
                      value={String(payload?.journal?.entriesCount ?? 0)}
                      label={TEXTS.TILE_JOURNAL}
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.pulseBlock}>
                <Text style={styles.pulseTitle}>{TEXTS.PULSE}</Text>
                <Text style={styles.pulseBody}>{pulseLine || TEXTS.PULSE_EMPTY}</Text>
              </View>
            </View>

            {dataStale ? (
              <View style={styles.staleOverlay} pointerEvents="none">
                <SkeletonGrid />
                <ActivityIndicator style={styles.staleSpinner} color={colors.primary} />
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setInfoOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.HOW_WE_COUNT}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoRowText}>{TEXTS.HOW_WE_COUNT}</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>{TEXTS.FOOTER_HINT}</Text>
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
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  segment: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    padding: 3,
    marginBottom: 18,
  },
  segmentItem: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  segmentItemOn: {
    backgroundColor: 'rgba(26, 221, 219, 0.22)',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextOn: {
    color: colors.white,
  },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevronHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sheetWrap: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
  },
  sheet: {
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  sheetDimmed: {
    opacity: 0.48,
  },
  staleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 10, 36, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  staleSpinner: {
    marginTop: 12,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    maxWidth: 400,
    alignSelf: 'center',
  },
  skeletonTile: {
    width: '48%',
    height: 88,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 4,
  },
  narrativeCard: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(26, 221, 219, 0.08)',
  },
  narrativeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  narrativeLine: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  narrativeLabel: {
    color: colors.white,
    fontWeight: '600',
  },
  narrativeQuestion: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    fontWeight: '500',
  },
  tile: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 4,
  },
  tileIcon: {
    marginBottom: 8,
    opacity: 0.9,
  },
  tileValue: {
    fontSize: 30,
    fontWeight: '300',
    color: colors.white,
    letterSpacing: -0.5,
  },
  tileLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  pulseBlock: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    paddingBottom: 18,
  },
  pulseTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pulseBody: {
    fontSize: 15,
    color: colors.white,
    lineHeight: 22,
    opacity: 0.92,
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.85,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    width: '100%',
    maxWidth: 320,
    marginBottom: 10,
  },
  ctaPrimaryText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    width: '100%',
    maxWidth: 320,
    marginBottom: 10,
    backgroundColor: 'rgba(26, 221, 219, 0.06)',
  },
  ctaSecondaryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  infoRowText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    marginLeft: 6,
  },
  footer: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.75,
    paddingHorizontal: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingHint: {
    marginTop: 18,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 15,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 221, 219, 0.08)',
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: 'rgba(29, 43, 95, 0.98)',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 14,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(26, 221, 219, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
