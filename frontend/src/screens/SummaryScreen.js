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
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useMappedSectionTexts } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

const DEFAULT_TEXTS = {
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
    'Cuando quieras retomar, aquí tienes un par de pasos sin presión.',
  CTA_CHAT: 'Hablar con Anto',
  CTA_GRATITUDE: 'Escribir gratitud',
  CTA_TECHNIQUES: 'Ver técnicas',
  NARRATIVE_TITLE: 'Resumen',
  NARRATIVE_THEMES: 'Temas',
  NARRATIVE_MICRO_WINS: 'Micro-logros',
  WEEKLY_INSIGHT_CTA: 'Ver patrones de la semana',
  WEEKLY_INSIGHT_CTA_HINT: 'Informe observacional, no diagnóstico.',
  MONTHLY_INSIGHT_CTA: 'Ver patrones del mes',
  MONTHLY_INSIGHT_CTA_HINT: 'Informe observacional del mes, no diagnóstico.',
  EMPTY_TITLE_MONTH: 'Mes tranquilo en la app',
  PERIOD_FALLBACK: '…',
  TIMES_SINGULAR: 'vez',
  TIMES_PLURAL: 'veces',
  ERROR_CONNECTION: 'Error de conexión. Verifica internet e inténtalo de nuevo.',
  ERROR_TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento e inténtalo nuevamente.',
};

const SUMMARY_TEXT_MAP = {
  TITLE: 'SUMMARY_TITLE',
  WEEK: 'SUMMARY_WEEK',
  MONTH: 'SUMMARY_MONTH',
  LOADING: 'SUMMARY_LOADING',
  ERROR: 'SUMMARY_ERROR',
  RETRY: 'RETRY',
  PREV: 'SUMMARY_PREV',
  NEXT: 'SUMMARY_NEXT',
  FOOTER_HINT: 'SUMMARY_FOOTER_HINT',
  HOW_WE_COUNT: 'SUMMARY_HOW_WE_COUNT',
  TOOLTIP_TITLE: 'SUMMARY_TOOLTIP_TITLE',
  TOOLTIP_CLOSE: 'COMMON_OK',
  TOOLTIP_BODY: 'SUMMARY_TOOLTIP_BODY',
  TILE_CHAT: 'SUMMARY_TILE_CHAT',
  TILE_DAYS: 'SUMMARY_TILE_DAYS',
  TILE_TECHNIQUES: 'SUMMARY_TILE_TECHNIQUES',
  TILE_TASKS: 'SUMMARY_TILE_TASKS',
  TILE_HABITS: 'SUMMARY_TILE_HABITS',
  TILE_JOURNAL: 'SUMMARY_TILE_JOURNAL',
  PULSE: 'SUMMARY_PULSE',
  PULSE_EMPTY: 'SUMMARY_PULSE_EMPTY',
  EMPTY_TITLE: 'SUMMARY_EMPTY_TITLE',
  EMPTY_SUB: 'SUMMARY_EMPTY_SUB',
  CTA_CHAT: 'SUMMARY_CTA_CHAT',
  CTA_GRATITUDE: 'SUMMARY_CTA_GRATITUDE',
  CTA_TECHNIQUES: 'SUMMARY_CTA_TECHNIQUES',
  NARRATIVE_TITLE: 'SUMMARY_NARRATIVE_TITLE',
  NARRATIVE_THEMES: 'SUMMARY_NARRATIVE_THEMES',
  NARRATIVE_MICRO_WINS: 'SUMMARY_NARRATIVE_MICRO_WINS',
  WEEKLY_INSIGHT_CTA: 'SUMMARY_WEEKLY_INSIGHT_CTA',
  WEEKLY_INSIGHT_CTA_HINT: 'SUMMARY_WEEKLY_INSIGHT_CTA_HINT',
  MONTHLY_INSIGHT_CTA: 'SUMMARY_MONTHLY_INSIGHT_CTA',
  MONTHLY_INSIGHT_CTA_HINT: 'SUMMARY_MONTHLY_INSIGHT_CTA_HINT',
  EMPTY_TITLE_MONTH: 'SUMMARY_EMPTY_TITLE_MONTH',
  PERIOD_FALLBACK: 'SUMMARY_PERIOD_FALLBACK',
  TIMES_SINGULAR: 'SUMMARY_TIMES_SINGULAR',
  TIMES_PLURAL: 'SUMMARY_TIMES_PLURAL',
  ERROR_CONNECTION: 'ERROR_CONNECTION',
  ERROR_TOO_MANY_REQUESTS: 'ERROR_TOO_MANY_REQUESTS',
};

const resolveSummaryErrorMessage = (error, texts, fallbackKey = 'ERROR') => {
  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();
  const status = error?.response?.status;

  const isNetwork =
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('econnrefused') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('failed to fetch');

  if (isNetwork) {
    return texts.ERROR_CONNECTION || texts[fallbackKey] || texts.ERROR;
  }

  const isTooManyRequests =
    status === 429 ||
    normalizedMessage.includes('too many') ||
    normalizedMessage.includes('demasiados intentos');

  if (isTooManyRequests) {
    return texts.ERROR_TOO_MANY_REQUESTS || texts[fallbackKey] || texts.ERROR;
  }

  return texts[fallbackKey] || texts.ERROR;
};

function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthTitle(year, month1to12, locale) {
  const d = new Date(year, month1to12 - 1, 1);
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
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

/** `sx`: hoja de estilos del padre (evita el nombre `styles` como prop: conflictos con Hermes / resolución). */
function MetricTile({ icon, value, label, colors, sx }) {
  return (
    <View style={sx.tile}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} style={sx.tileIcon} />
      <Text style={sx.tileValue}>{value}</Text>
      <Text style={sx.tileLabel}>{label}</Text>
    </View>
  );
}

function NarrativeCard({ narrative, sx, texts }) {
  if (!narrative) return null;
  return (
    <View style={sx.narrativeCard}>
      <Text style={sx.narrativeTitle}>{texts.NARRATIVE_TITLE}</Text>
      <Text style={sx.narrativeLine}>
        <Text style={sx.narrativeLabel}>{texts.NARRATIVE_THEMES}: </Text>
        {narrative.themes}
      </Text>
      <Text style={sx.narrativeLine}>
        <Text style={sx.narrativeLabel}>{texts.NARRATIVE_MICRO_WINS}: </Text>
        {narrative.microWins}
      </Text>
      <Text style={sx.narrativeQuestion}>{narrative.nextQuestion}</Text>
    </View>
  );
}

function SkeletonTile({ sx }) {
  return <View style={sx.skeletonTile} />;
}

function SkeletonGrid({ sx }) {
  return (
    <View style={sx.skeletonGrid}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <SkeletonTile key={k} sx={sx} />
      ))}
    </View>
  );
}

function EmptyState({ navigation, colors, sx, texts }) {
  return (
    <View style={sx.emptyWrap}>
      <MaterialCommunityIcons name="sleep" size={40} color={colors.textSecondary} style={sx.emptyIcon} />
      <Text style={sx.emptyTitle}>{texts.EMPTY_TITLE}</Text>
      <Text style={sx.emptySub}>{texts.EMPTY_SUB}</Text>
      <TouchableOpacity
        style={sx.ctaPrimary}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="chat-outline" size={20} color={colors.textOnPrimary} style={sx.ctaIcon} />
        <Text style={sx.ctaPrimaryText}>{texts.CTA_CHAT}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={sx.ctaSecondary}
        onPress={() => navigation.navigate('GratitudeJournal')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="notebook-outline" size={20} color={colors.primary} style={sx.ctaIcon} />
        <Text style={sx.ctaSecondaryText}>{texts.CTA_GRATITUDE}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={sx.ctaSecondary}
        onPress={() => navigation.navigate('TherapeuticTechniques')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="head-heart-outline" size={20} color={colors.primary} style={sx.ctaIcon} />
        <Text style={sx.ctaSecondaryText}>{texts.CTA_TECHNIQUES}</Text>
      </TouchableOpacity>
    </View>
  );
}

function HowWeCountModal({ visible, onClose, sx, texts }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={sx.modalBackdrop} onPress={onClose} accessibilityRole="button">
        <View style={sx.modalCard}>
          <Text style={sx.modalTitle}>{texts.TOOLTIP_TITLE}</Text>
          <Text style={sx.modalBody}>{texts.TOOLTIP_BODY}</Text>
          <TouchableOpacity style={sx.modalBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={sx.modalBtnText}>{texts.TOOLTIP_CLOSE}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function SummaryScreen() {
  const { language } = useLanguage();
  const TEXTS = useMappedSectionTexts('PROFILE', DEFAULT_TEXTS, SUMMARY_TEXT_MAP);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, statusBarStyle } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
        topBar: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 4,
          paddingBottom: 16,
        },
        segment: {
          flexDirection: 'row',
          alignSelf: 'center',
          backgroundColor: colors.glassFill ?? 'rgba(255,255,255,0.72)',
          borderRadius: 999,
          padding: 3,
          marginBottom: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        segmentItem: {
          paddingVertical: 8,
          paddingHorizontal: 22,
          borderRadius: 999,
        },
        segmentItemOn: {
          backgroundColor: colors.accentLineSoft,
        },
        segmentText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        segmentTextOn: {
          color: colors.primary,
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
          color: colors.text,
          fontSize: 17,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
        scroll: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
          backgroundColor: colors.overlay,
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
          backgroundColor: colors.chromeInput ?? 'rgba(36,35,79,0.06)',
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
          backgroundColor: colors.accentLineSoft,
        },
        narrativeTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
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
          color: colors.text,
          fontWeight: '600',
        },
        narrativeQuestion: {
          marginTop: 4,
          fontSize: 14,
          lineHeight: 21,
          color: colors.text,
          fontWeight: '500',
        },
        weeklyInsightBtn: {
          marginHorizontal: 12,
          marginBottom: 10,
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.cardBackground || colors.background,
        },
        weeklyInsightBtnTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 4,
        },
        weeklyInsightBtnHint: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
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
          color: colors.text,
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
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
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
          color: colors.text,
          lineHeight: 22,
          opacity: 0.92,
        },
        emptyWrap: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
          color: colors.text,
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
          color: colors.textOnPrimary,
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
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 999,
          width: '100%',
          maxWidth: 320,
          marginBottom: 10,
          backgroundColor: colors.accentLineSoft,
        },
        ctaSecondaryText: {
          color: colors.primary,
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
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
          backgroundColor: colors.accentLineSoft,
        },
        retryText: {
          color: colors.primary,
          fontWeight: '600',
          fontSize: 15,
        },
        modalBackdrop: {
          flex: 1,
          backgroundColor: colors.backdropStrong ?? colors.overlay,
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        modalCard: {
          backgroundColor: colors.modalSurface,
          borderRadius: 20,
          padding: 22,
          borderWidth: 1,
          borderColor: colors.border,
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
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
          backgroundColor: colors.accentLineSoft,
          paddingVertical: 10,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        modalBtnText: {
          color: colors.text,
          fontWeight: '600',
          fontSize: 15,
        },
      }),
    [colors],
  );

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
      return { period: 'week', date: formatYmd(weekAnchor), language };
    }
    return {
      period: 'month',
      year: String(monthYear.year),
      month: String(monthYear.month),
      language,
    };
  }, [granularity, weekAnchor, monthYear, language]);

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
        setError(resolveSummaryErrorMessage(e, TEXTS, 'ERROR'));
        setPayload(null);
        hasShownPayloadRef.current = false;
      } finally {
        if (seq !== summaryReqSeqRef.current) return;
        setDataStale(false);
        if (!fromPull) setLoading(false);
        if (fromPull) setRefreshing(false);
      }
    },
    [queryParams, TEXTS]
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
    return `${name} · ${n} ${n === 1 ? TEXTS.TIMES_SINGULAR : TEXTS.TIMES_PLURAL}`;
  }, [payload, TEXTS]);

  const periodEmpty = useMemo(() => isSummaryEmpty(payload), [payload]);

  const periodTitle =
    granularity === 'week'
      ? payload?.period?.label || TEXTS.PERIOD_FALLBACK
      : monthTitle(
          monthYear.year,
          monthYear.month,
          language === 'en' ? 'en-US' : 'es-ES',
        );

  const insightCta = useMemo(
    () =>
      granularity === 'month'
        ? {
            title: TEXTS.MONTHLY_INSIGHT_CTA,
            hint: TEXTS.MONTHLY_INSIGHT_CTA_HINT,
            params: {
              period: 'month',
              monthKey:
                payload?.period?.monthKey ||
                `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}`,
            },
          }
        : {
            title: TEXTS.WEEKLY_INSIGHT_CTA,
            hint: TEXTS.WEEKLY_INSIGHT_CTA_HINT,
            params: {
              period: 'week',
              ...(payload?.period?.weekKey ? { weekKey: payload.period.weekKey } : {}),
            },
          },
    [granularity, TEXTS, payload?.period, monthYear],
  );

  const emptyTexts = useMemo(
    () =>
      granularity === 'month'
        ? { ...TEXTS, EMPTY_TITLE: TEXTS.EMPTY_TITLE_MONTH || TEXTS.EMPTY_TITLE }
        : TEXTS,
    [granularity, TEXTS],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton />
      <HowWeCountModal
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        sx={styles}
        texts={TEXTS}
      />

      <View style={styles.topBar}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, granularity === 'week' && styles.segmentItemOn]}
            onPress={() => setGranularity('week')}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.WEEK}
            accessibilityState={{ selected: granularity === 'week' }}
          >
            <Text style={[styles.segmentText, granularity === 'week' && styles.segmentTextOn]}>{TEXTS.WEEK}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, granularity === 'month' && styles.segmentItemOn]}
            onPress={() => setGranularity('month')}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.MONTH}
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
          <SkeletonGrid sx={styles} />
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
                <EmptyState navigation={navigation} colors={colors} sx={styles} texts={emptyTexts} />
              ) : (
                <View>
                  <NarrativeCard narrative={payload?.narrative} sx={styles} texts={TEXTS} />
                  <TouchableOpacity
                    style={styles.weeklyInsightBtn}
                    onPress={() => navigation.navigate('WeeklyInsight', insightCta.params)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={insightCta.title}
                    accessibilityHint={insightCta.hint}
                  >
                    <Text style={styles.weeklyInsightBtnTitle}>{insightCta.title}</Text>
                    <Text style={styles.weeklyInsightBtnHint}>{insightCta.hint}</Text>
                  </TouchableOpacity>
                  <View style={styles.grid}>
                    <MetricTile
                      icon="message-text-outline"
                      value={String(payload?.chat?.userMessages ?? 0)}
                      label={TEXTS.TILE_CHAT}
                      colors={colors}
                      sx={styles}
                    />
                    <MetricTile
                      icon="calendar-blank-outline"
                      value={String(payload?.chat?.distinctActiveDays ?? 0)}
                      label={TEXTS.TILE_DAYS}
                      colors={colors}
                      sx={styles}
                    />
                    <MetricTile
                      icon="head-heart-outline"
                      value={String(payload?.techniques?.totalUses ?? 0)}
                      label={TEXTS.TILE_TECHNIQUES}
                      colors={colors}
                      sx={styles}
                    />
                    <MetricTile
                      icon="checkbox-marked-circle-outline"
                      value={String(payload?.tasks?.completedInPeriod ?? 0)}
                      label={TEXTS.TILE_TASKS}
                      colors={colors}
                      sx={styles}
                    />
                    <MetricTile
                      icon="repeat"
                      value={String(payload?.habits?.completionsInPeriod ?? 0)}
                      label={TEXTS.TILE_HABITS}
                      colors={colors}
                      sx={styles}
                    />
                    <MetricTile
                      icon="notebook-outline"
                      value={String(payload?.journal?.entriesCount ?? 0)}
                      label={TEXTS.TILE_JOURNAL}
                      colors={colors}
                      sx={styles}
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
                <SkeletonGrid sx={styles} />
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
