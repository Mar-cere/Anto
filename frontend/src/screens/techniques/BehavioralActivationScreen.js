/**
 * Activación conductual (#88): actividad + ánimo antes/después.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { api, ENDPOINTS } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';
import { confirmDestructiveAction } from '../../utils/confirmDestructiveAction';
import { parseBaRecordRouteParams } from '../../utils/baRecordPrefill';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';
import BehavioralActivationWeekPanel from './BehavioralActivationWeekPanel';
import { computeBaMoodTrend } from '../../utils/baMoodTrend';
import IntensityBeforeAfterMarker from '../../components/techniques/IntensityBeforeAfterMarker';
import IntensityScalePicker from '../../components/techniques/IntensityScalePicker';

const STEPS = ['1', '2', '3'];

const DEFAULT_TEXTS = {
  TITLE: 'Activación conductual',
  INTRO_KICKER: 'TCC',
  INTRO_TITLE: 'Pequeñas acciones, cambios graduales en el ánimo',
  INTRO_BODY:
    'Elige una actividad manejable (placentera o necesaria), anota cómo te sientes antes y después. No busques la actividad perfecta.',
  STEP1_TITLE: 'Actividad',
  STEP1_HINT: '¿Qué harás o hiciste? Empieza pequeño.',
  STEP1_PLACEHOLDER: 'Ejemplo: dar un paseo de 10 minutos',
  TYPE_PLEASANT: 'Placentera',
  TYPE_ROUTINE: 'Rutina / necesaria',
  STEP2_TITLE: 'Ánimo antes (1–10)',
  STEP2_HINT: '¿Cómo te sientes justo antes de la actividad?',
  STEP3_TITLE: 'Ánimo después (1–10)',
  STEP3_HINT: '¿Cómo te sientes al terminar?',
  STEP3_NOTES: 'Notas (opcional)',
  STEP3_NOTES_PLACEHOLDER: 'Qué notaste, qué fue útil…',
  NEXT: 'Siguiente',
  BACK: 'Atrás',
  SAVE: 'Guardar actividad',
  SAVING: 'Guardando…',
  TOAST_SAVED: 'Actividad registrada',
  TOAST_ERROR: 'No se pudo guardar. Intenta de nuevo.',
  TOAST_DELETED: 'Registro eliminado',
  TOAST_EXPORT_ERROR: 'No se pudo exportar',
  RECENT_TITLE: 'Registros recientes',
  MOOD_TREND_IMPROVING: 'Tendencia: tu ánimo suele subir tras las actividades (+{delta} de media).',
  MOOD_TREND_DECLINING: 'Tendencia: el ánimo baja tras algunas actividades ({delta} de media). Ajusta la dificultad o el tipo.',
  MOOD_TREND_STABLE: 'Tendencia: el ánimo se mantiene estable tras las actividades.',
  RECENT_EMPTY: 'Aún no hay registros. Completa el wizard arriba.',
  EXPORT: 'Exportar resumen',
  EXPORT_HINT: 'Texto para compartir con tu terapeuta.',
  DELETE_A11Y: 'Eliminar registro',
  DELETE_CONFIRM_TITLE: 'Eliminar actividad',
  DELETE_CONFIRM_MESSAGE:
    'Este registro de activación conductual se eliminará permanentemente. Esta acción no se puede deshacer.',
  DELETE_CANCEL: 'Cancelar',
  DELETE_CONFIRM: 'Eliminar',
  STEP_PROGRESS: 'Paso',
  OF: 'de',
  VALIDATION_ACTIVITY: 'Describe la actividad antes de continuar.',
  PREFILL_HINT:
    'Sugerencia a partir de tu mensaje en el chat. Puedes editarla antes de continuar.',
  PREFILL_MOOD_HINT: 'Ánimo inicial tomado de tu mensaje (puedes cambiarlo).',
  TAB_WEEK: 'Esta semana',
  TAB_LOG: 'Registrar',
  WEEK_TITLE: 'Plan de la semana',
  WEEK_BODY:
    'Cinco actividades pequeñas repartidas en la semana. Puedes editarlas, registrarlas o omitirlas.',
  WEEK_EMPTY: 'No hay actividades planificadas.',
  WEEK_LOADING: 'Cargando plan…',
  WEEK_LOAD_ERROR: 'No se pudo cargar el plan semanal.',
  WEEK_SAVE_ERROR: 'No se pudo actualizar el plan.',
  WEEK_STATUS_PLANNED: 'Pendiente',
  WEEK_STATUS_COMPLETED: 'Hecha',
  WEEK_STATUS_SKIPPED: 'Omitida',
  WEEK_REGISTER: 'Registrar',
  WEEK_SKIP: 'Omitir',
  WEEK_TYPE_PLEASANT: 'Placentera',
  WEEK_TYPE_ROUTINE: 'Rutina',
  LINK_PRODUCT_TITLE: '¿Añadir también a Tareas o Hábitos?',
  LINK_PRODUCT_BODY:
    'Puedes llevar esta actividad a tu espacio diario con recordatorios. El registro de ánimo sigue aquí.',
  LINK_PRODUCT_TASK: 'Como tarea',
  LINK_PRODUCT_HABIT: 'Como hábito',
  LINK_PRODUCT_SKIP: 'Solo aquí',
  LINK_PRODUCT_TOAST_TASK: 'También añadida a Tareas',
  LINK_PRODUCT_TOAST_HABIT: 'También añadida a Hábitos',
  LINK_PRODUCT_TOAST_ERROR: 'No se pudo vincular con Tareas/Hábitos',
  WEEK_LINKED_TASK: 'En Tareas',
  WEEK_LINKED_HABIT: 'En Hábitos',
};

function formatEntryDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(iso);
  }
}

const BehavioralActivationScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.BA_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.BA_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.BA_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY: translated?.BA_INTRO_BODY || DEFAULT_TEXTS.INTRO_BODY,
      STEP1_TITLE: translated?.BA_STEP1_TITLE || DEFAULT_TEXTS.STEP1_TITLE,
      STEP1_HINT: translated?.BA_STEP1_HINT || DEFAULT_TEXTS.STEP1_HINT,
      STEP1_PLACEHOLDER: translated?.BA_STEP1_PLACEHOLDER || DEFAULT_TEXTS.STEP1_PLACEHOLDER,
      TYPE_PLEASANT: translated?.BA_TYPE_PLEASANT || DEFAULT_TEXTS.TYPE_PLEASANT,
      TYPE_ROUTINE: translated?.BA_TYPE_ROUTINE || DEFAULT_TEXTS.TYPE_ROUTINE,
      STEP2_TITLE: translated?.BA_STEP2_TITLE || DEFAULT_TEXTS.STEP2_TITLE,
      STEP2_HINT: translated?.BA_STEP2_HINT || DEFAULT_TEXTS.STEP2_HINT,
      STEP3_TITLE: translated?.BA_STEP3_TITLE || DEFAULT_TEXTS.STEP3_TITLE,
      STEP3_HINT: translated?.BA_STEP3_HINT || DEFAULT_TEXTS.STEP3_HINT,
      STEP3_NOTES: translated?.BA_STEP3_NOTES || DEFAULT_TEXTS.STEP3_NOTES,
      STEP3_NOTES_PLACEHOLDER:
        translated?.BA_STEP3_NOTES_PLACEHOLDER || DEFAULT_TEXTS.STEP3_NOTES_PLACEHOLDER,
      NEXT: translated?.BA_NEXT || DEFAULT_TEXTS.NEXT,
      BACK: translated?.BA_BACK || DEFAULT_TEXTS.BACK,
      SAVE: translated?.BA_SAVE || DEFAULT_TEXTS.SAVE,
      SAVING: translated?.BA_SAVING || DEFAULT_TEXTS.SAVING,
      TOAST_SAVED: translated?.BA_TOAST_SAVED || DEFAULT_TEXTS.TOAST_SAVED,
      TOAST_ERROR: translated?.BA_TOAST_ERROR || DEFAULT_TEXTS.TOAST_ERROR,
      TOAST_DELETED: translated?.BA_TOAST_DELETED || DEFAULT_TEXTS.TOAST_DELETED,
      TOAST_EXPORT_ERROR: translated?.BA_TOAST_EXPORT_ERROR || DEFAULT_TEXTS.TOAST_EXPORT_ERROR,
      RECENT_TITLE: translated?.BA_RECENT_TITLE || DEFAULT_TEXTS.RECENT_TITLE,
      MOOD_TREND_IMPROVING: translated?.BA_MOOD_TREND_IMPROVING || DEFAULT_TEXTS.MOOD_TREND_IMPROVING,
      MOOD_TREND_DECLINING: translated?.BA_MOOD_TREND_DECLINING || DEFAULT_TEXTS.MOOD_TREND_DECLINING,
      MOOD_TREND_STABLE: translated?.BA_MOOD_TREND_STABLE || DEFAULT_TEXTS.MOOD_TREND_STABLE,
      RECENT_EMPTY: translated?.BA_RECENT_EMPTY || DEFAULT_TEXTS.RECENT_EMPTY,
      EXPORT: translated?.BA_EXPORT || DEFAULT_TEXTS.EXPORT,
      EXPORT_HINT: translated?.BA_EXPORT_HINT || DEFAULT_TEXTS.EXPORT_HINT,
      DELETE_A11Y: translated?.BA_DELETE_A11Y || DEFAULT_TEXTS.DELETE_A11Y,
      DELETE_CONFIRM_TITLE:
        translated?.BA_DELETE_CONFIRM_TITLE || DEFAULT_TEXTS.DELETE_CONFIRM_TITLE,
      DELETE_CONFIRM_MESSAGE:
        translated?.BA_DELETE_CONFIRM_MESSAGE || DEFAULT_TEXTS.DELETE_CONFIRM_MESSAGE,
      DELETE_CANCEL: translated?.TCC_DELETE_CANCEL || DEFAULT_TEXTS.DELETE_CANCEL,
      DELETE_CONFIRM: translated?.TCC_DELETE_CONFIRM || DEFAULT_TEXTS.DELETE_CONFIRM,
      STEP_PROGRESS: translated?.BA_STEP_PROGRESS || DEFAULT_TEXTS.STEP_PROGRESS,
      OF: translated?.BA_OF || DEFAULT_TEXTS.OF,
      VALIDATION_ACTIVITY:
        translated?.BA_VALIDATION_ACTIVITY || DEFAULT_TEXTS.VALIDATION_ACTIVITY,
      PREFILL_HINT: translated?.BA_PREFILL_HINT || DEFAULT_TEXTS.PREFILL_HINT,
      PREFILL_MOOD_HINT: translated?.BA_PREFILL_MOOD_HINT || DEFAULT_TEXTS.PREFILL_MOOD_HINT,
      TAB_WEEK: translated?.BA_TAB_WEEK || DEFAULT_TEXTS.TAB_WEEK,
      TAB_LOG: translated?.BA_TAB_LOG || DEFAULT_TEXTS.TAB_LOG,
      WEEK_TITLE: translated?.BA_WEEK_TITLE || DEFAULT_TEXTS.WEEK_TITLE,
      WEEK_BODY: translated?.BA_WEEK_BODY || DEFAULT_TEXTS.WEEK_BODY,
      WEEK_EMPTY: translated?.BA_WEEK_EMPTY || DEFAULT_TEXTS.WEEK_EMPTY,
      WEEK_LOADING: translated?.BA_WEEK_LOADING || DEFAULT_TEXTS.WEEK_LOADING,
      WEEK_LOAD_ERROR: translated?.BA_WEEK_LOAD_ERROR || DEFAULT_TEXTS.WEEK_LOAD_ERROR,
      WEEK_SAVE_ERROR: translated?.BA_WEEK_SAVE_ERROR || DEFAULT_TEXTS.WEEK_SAVE_ERROR,
      WEEK_STATUS_PLANNED: translated?.BA_WEEK_STATUS_PLANNED || DEFAULT_TEXTS.WEEK_STATUS_PLANNED,
      WEEK_STATUS_COMPLETED:
        translated?.BA_WEEK_STATUS_COMPLETED || DEFAULT_TEXTS.WEEK_STATUS_COMPLETED,
      WEEK_STATUS_SKIPPED: translated?.BA_WEEK_STATUS_SKIPPED || DEFAULT_TEXTS.WEEK_STATUS_SKIPPED,
      WEEK_REGISTER: translated?.BA_WEEK_REGISTER || DEFAULT_TEXTS.WEEK_REGISTER,
      WEEK_SKIP: translated?.BA_WEEK_SKIP || DEFAULT_TEXTS.WEEK_SKIP,
      WEEK_TYPE_PLEASANT: translated?.BA_WEEK_TYPE_PLEASANT || DEFAULT_TEXTS.WEEK_TYPE_PLEASANT,
      WEEK_TYPE_ROUTINE: translated?.BA_WEEK_TYPE_ROUTINE || DEFAULT_TEXTS.WEEK_TYPE_ROUTINE,
      LINK_PRODUCT_TITLE: translated?.BA_LINK_PRODUCT_TITLE || DEFAULT_TEXTS.LINK_PRODUCT_TITLE,
      LINK_PRODUCT_BODY: translated?.BA_LINK_PRODUCT_BODY || DEFAULT_TEXTS.LINK_PRODUCT_BODY,
      LINK_PRODUCT_TASK: translated?.BA_LINK_PRODUCT_TASK || DEFAULT_TEXTS.LINK_PRODUCT_TASK,
      LINK_PRODUCT_HABIT: translated?.BA_LINK_PRODUCT_HABIT || DEFAULT_TEXTS.LINK_PRODUCT_HABIT,
      LINK_PRODUCT_SKIP: translated?.BA_LINK_PRODUCT_SKIP || DEFAULT_TEXTS.LINK_PRODUCT_SKIP,
      LINK_PRODUCT_TOAST_TASK:
        translated?.BA_LINK_PRODUCT_TOAST_TASK || DEFAULT_TEXTS.LINK_PRODUCT_TOAST_TASK,
      LINK_PRODUCT_TOAST_HABIT:
        translated?.BA_LINK_PRODUCT_TOAST_HABIT || DEFAULT_TEXTS.LINK_PRODUCT_TOAST_HABIT,
      LINK_PRODUCT_TOAST_ERROR:
        translated?.BA_LINK_PRODUCT_TOAST_ERROR || DEFAULT_TEXTS.LINK_PRODUCT_TOAST_ERROR,
      WEEK_LINKED_TASK: translated?.BA_WEEK_LINKED_TASK || DEFAULT_TEXTS.WEEK_LINKED_TASK,
      WEEK_LINKED_HABIT: translated?.BA_WEEK_LINKED_HABIT || DEFAULT_TEXTS.WEEK_LINKED_HABIT,
    }),
    [translated],
  );

  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const { showToast } = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [activityDescription, setActivityDescription] = useState('');
  const [activityType, setActivityType] = useState('pleasant');
  const [moodBefore, setMoodBefore] = useState(4);
  const [moodAfter, setMoodAfter] = useState(5);
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const [records, setRecords] = useState([]);
  const moodTrend = useMemo(() => computeBaMoodTrend(records), [records]);
  const moodTrendLine = useMemo(() => {
    if (!moodTrend?.eligible) return null;
    const delta = moodTrend.avgDelta ?? 0;
    if (moodTrend.direction === 'improving') {
      return (TEXTS.MOOD_TREND_IMPROVING || '').replace('{delta}', String(delta));
    }
    if (moodTrend.direction === 'declining') {
      return (TEXTS.MOOD_TREND_DECLINING || '').replace('{delta}', String(delta));
    }
    return TEXTS.MOOD_TREND_STABLE;
  }, [moodTrend, TEXTS]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fromChatPrefill, setFromChatPrefill] = useState(false);
  const [fromChatMoodPrefill, setFromChatMoodPrefill] = useState(false);
  const handledChatPrefillKeyRef = useRef('');
  const pendingWeekSlotIdRef = useRef('');
  const pendingProductLinkRef = useRef(null);

  const [viewMode, setViewMode] = useState('week');
  const [weekPlan, setWeekPlan] = useState(null);
  const [weekStart, setWeekStart] = useState(null);
  const [dayLabels, setDayLabels] = useState([]);
  const [loadingWeekPlan, setLoadingWeekPlan] = useState(true);
  const [savingSlotId, setSavingSlotId] = useState('');
  const weekPlanRef = useRef(null);
  const handledFocusSlotKeyRef = useRef('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        keyboardView: { flex: 1 },
        scrollView: { flex: 1 },
        stepRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        },
        stepDot: {
          width: 32,
          height: 32,
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
        },
        stepDotText: { fontSize: 14, fontWeight: '700' },
        stepConnector: { flex: 1, height: 2, backgroundColor: colors.accentLineSoft },
        typeSegment: {
          flexDirection: 'row',
          alignSelf: 'stretch',
          backgroundColor: colors.glassFill,
          borderRadius: 14,
          padding: 4,
          marginBottom: SPACING.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        typeSegmentItem: {
          flex: 1,
          paddingVertical: 10,
          paddingHorizontal: 8,
          borderRadius: 10,
          alignItems: 'center',
        },
        typeSegmentItemOn: {
          backgroundColor: colors.accentLineSoft,
        },
        typeSegmentText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          textAlign: 'center',
        },
        typeSegmentTextOn: {
          color: colors.text,
        },
        validationText: { marginTop: SPACING.sm, fontSize: 14, color: colors.error || '#c0392b' },
        recordItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: SPACING.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'rgba(128,128,128,0.25)',
        },
        recordBody: { flex: 1, paddingRight: SPACING.sm },
        exportBlock: { marginTop: SPACING.lg, marginBottom: SPACING.xxl },
        viewSegment: {
          flexDirection: 'row',
          backgroundColor: colors.glassFill,
          borderRadius: 14,
          padding: 4,
          marginBottom: SPACING.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        viewSegmentItem: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: 'center',
        },
        viewSegmentItemOn: { backgroundColor: colors.accentLineSoft },
        viewSegmentText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
        viewSegmentTextOn: { color: colors.text },
        weekLoading: { alignItems: 'center', paddingVertical: SPACING.lg },
        weekRoot: { gap: 10 },
        weekIntroCard: { marginBottom: 0 },
        weekIntroBody: { marginBottom: 14, lineHeight: 21 },
        weekProgressBlock: { marginTop: 4 },
        weekProgressRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        weekProgressLabel: { fontSize: 13, fontWeight: '700' },
        weekProgressHint: { fontSize: 12, fontWeight: '500' },
        weekProgressTrack: {
          height: 6,
          borderRadius: 999,
          overflow: 'hidden',
        },
        weekProgressFill: { height: '100%', borderRadius: 999 },
        weekSlotCard: {
          borderRadius: 18,
          padding: 14,
          borderWidth: StyleSheet.hairlineWidth,
        },
        weekSlotTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
        weekDayBadge: {
          minWidth: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        weekDayBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
        weekSlotMain: { flex: 1 },
        weekChipRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 6,
        },
        weekChipLeft: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
        weekTypeChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
        },
        weekLinkedChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
        },
        weekLinkedChipText: { fontSize: 10, fontWeight: '700' },
        weekTypeChipText: { fontSize: 11, fontWeight: '600' },
        weekStatusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
        weekStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
        weekActivity: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
        weekDoneRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
        },
        weekDoneText: { fontSize: 13, fontWeight: '600' },
        weekActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
        },
        weekActionPrimary: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          borderRadius: 12,
          paddingVertical: 11,
          minHeight: 42,
        },
        weekActionSecondary: {
          borderRadius: 12,
          paddingVertical: 11,
          paddingHorizontal: 14,
          borderWidth: StyleSheet.hairlineWidth,
          minHeight: 42,
          justifyContent: 'center',
        },
        weekActionText: { fontSize: 14, fontWeight: '700' },
        weekActionTextMuted: { fontSize: 13, fontWeight: '600' },
      }),
    [colors],
  );

  const loadRecords = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoadingRecords(true);
    try {
      const response = await api.get(ENDPOINTS.BEHAVIORAL_ACTIVATION_LOGS);
      if (response?.success && Array.isArray(response.records)) {
        setRecords(response.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error cargando registros BA:', err);
      if (!silent) setRecords([]);
    } finally {
      if (!silent) setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const loadWeekPlan = useCallback(async () => {
    setLoadingWeekPlan(true);
    try {
      const response = await api.get(ENDPOINTS.BEHAVIORAL_ACTIVATION_WEEK_PLAN);
      if (response?.success && response?.plan) {
        setWeekPlan(response.plan);
        weekPlanRef.current = response.plan;
        setWeekStart(response.weekStart || null);
        setDayLabels(Array.isArray(response.dayLabels) ? response.dayLabels : []);
      } else {
        setWeekPlan(null);
      }
    } catch (err) {
      console.error('Error cargando plan semanal BA:', err);
      showToast(TEXTS.WEEK_LOAD_ERROR);
      setWeekPlan(null);
    } finally {
      setLoadingWeekPlan(false);
    }
  }, [showToast, TEXTS.WEEK_LOAD_ERROR]);

  useEffect(() => {
    loadWeekPlan();
  }, [loadWeekPlan]);

  useEffect(() => {
    const slotId = String(route.params?.openWeekSlotId || '').trim();
    if (!slotId || loadingWeekPlan || !weekPlan?.slots?.length) return;
    const focusKey = `${weekStart || 'week'}:${slotId}`;
    if (handledFocusSlotKeyRef.current === focusKey) return;
    const slot = weekPlan.slots.find((s) => String(s?.slotId) === slotId);
    if (!slot || slot.status !== 'planned') return;
    handledFocusSlotKeyRef.current = focusKey;
    setViewMode('week');
  }, [route.params?.openWeekSlotId, loadingWeekPlan, weekPlan, weekStart]);

  const persistWeekPlan = useCallback(
    async (slots) => {
      const response = await api.put(ENDPOINTS.BEHAVIORAL_ACTIVATION_WEEK_PLAN, {
        weekStart: weekStart || undefined,
        slots,
      });
      if (response?.success && response?.plan) {
        setWeekPlan(response.plan);
        weekPlanRef.current = response.plan;
        if (response.weekStart) setWeekStart(response.weekStart);
        if (Array.isArray(response.dayLabels)) setDayLabels(response.dayLabels);
        return true;
      }
      showToast(response?.error || TEXTS.WEEK_SAVE_ERROR);
      return false;
    },
    [weekStart, showToast, TEXTS.WEEK_SAVE_ERROR],
  );

  const beginWeekSlotRegistration = useCallback((slot, productKind) => {
    if (!slot?.slotId) return;
    pendingWeekSlotIdRef.current = slot.slotId;
    pendingProductLinkRef.current = productKind;
    setActivityDescription(slot.activityDescription || '');
    setActivityType(slot.activityType === 'routine' ? 'routine' : 'pleasant');
    setStepIndex(0);
    setValidationMessage('');
    setFromChatPrefill(false);
    setFromChatMoodPrefill(false);
    setViewMode('log');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleRegisterWeekSlot = useCallback(
    (slot) => {
      if (!slot?.slotId) return;
      if (slot.linkedTaskId || slot.linkedHabitId) {
        beginWeekSlotRegistration(slot, null);
        return;
      }

      const isRoutine = slot.activityType === 'routine';
      Alert.alert(TEXTS.LINK_PRODUCT_TITLE, TEXTS.LINK_PRODUCT_BODY, [
        isRoutine
          ? {
              text: TEXTS.LINK_PRODUCT_HABIT,
              onPress: () => beginWeekSlotRegistration(slot, 'habit'),
            }
          : {
              text: TEXTS.LINK_PRODUCT_TASK,
              onPress: () => beginWeekSlotRegistration(slot, 'task'),
            },
        isRoutine
          ? {
              text: TEXTS.LINK_PRODUCT_TASK,
              onPress: () => beginWeekSlotRegistration(slot, 'task'),
            }
          : {
              text: TEXTS.LINK_PRODUCT_HABIT,
              onPress: () => beginWeekSlotRegistration(slot, 'habit'),
            },
        {
          text: TEXTS.LINK_PRODUCT_SKIP,
          style: 'cancel',
          onPress: () => beginWeekSlotRegistration(slot, null),
        },
      ]);
    },
    [TEXTS, beginWeekSlotRegistration],
  );

  const handleSkipWeekSlot = useCallback(
    async (slot) => {
      const plan = weekPlanRef.current;
      if (!slot?.slotId || !plan?.slots) return;
      setSavingSlotId(slot.slotId);
      try {
        const updated = plan.slots.map((s) =>
          s.slotId === slot.slotId ? { ...s, status: 'skipped' } : s,
        );
        await persistWeekPlan(updated);
        Haptics.selectionAsync().catch(() => {});
      } finally {
        setSavingSlotId('');
      }
    },
    [persistWeekPlan],
  );

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setActivityDescription('');
    setActivityType('pleasant');
    setMoodBefore(4);
    setMoodAfter(5);
    setNotes('');
    setValidationMessage('');
    setFromChatPrefill(false);
    setFromChatMoodPrefill(false);
    handledChatPrefillKeyRef.current = '';
    pendingWeekSlotIdRef.current = '';
    pendingProductLinkRef.current = null;
  }, []);

  const applyRoutePrefill = useCallback(
    (params) => {
      const parsed = parseBaRecordRouteParams(params);
      if (
        !parsed.fromChat ||
        (!parsed.prefillActivityDescription &&
          parsed.prefillMoodBefore == null &&
          !parsed.prefillActivityType)
      ) {
        return;
      }

      const prefillKey = `${parsed.prefillActivityDescription}|${parsed.prefillMoodBefore}|${parsed.prefillActivityType}`;
      if (prefillKey === handledChatPrefillKeyRef.current) return;
      handledChatPrefillKeyRef.current = prefillKey;

      if (parsed.prefillActivityDescription) {
        setActivityDescription(parsed.prefillActivityDescription);
        setFromChatPrefill(true);
      }
      if (parsed.prefillMoodBefore != null) {
        setMoodBefore(parsed.prefillMoodBefore);
        setFromChatMoodPrefill(true);
      }
      if (parsed.prefillActivityType) {
        setActivityType(parsed.prefillActivityType);
      }
      setViewMode('log');
      setStepIndex(0);
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      applyRoutePrefill(route.params);
      loadWeekPlan();
      loadRecords({ silent: true });
    }, [applyRoutePrefill, route.params, loadWeekPlan, loadRecords]),
  );

  const goNext = () => {
    setValidationMessage('');
    if (stepIndex === 0 && !activityDescription.trim()) {
      setValidationMessage(TEXTS.VALIDATION_ACTIVITY);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setValidationMessage('');
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    if (!activityDescription.trim()) {
      setValidationMessage(TEXTS.VALIDATION_ACTIVITY);
      return;
    }
    setSaving(true);
    try {
      const response = await api.post(ENDPOINTS.BEHAVIORAL_ACTIVATION_LOGS, {
        activityDescription: activityDescription.trim(),
        activityType,
        moodBefore,
        moodAfter,
        notes: notes.trim(),
      });
      if (response?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_SAVED);
        recordInterventionCompleted('behavioral_activation');

        const slotId = pendingWeekSlotIdRef.current;
        const logId = response?.record?._id;
        const productKind = pendingProductLinkRef.current;
        const currentPlan = weekPlanRef.current;
        const slotBeforeSave = currentPlan?.slots?.find((s) => s.slotId === slotId);
        if (slotId && logId && currentPlan?.slots) {
          const updated = currentPlan.slots.map((s) =>
            s.slotId === slotId
              ? { ...s, status: 'completed', completedLogId: logId }
              : s,
          );
          const synced = await persistWeekPlan(updated);
          pendingWeekSlotIdRef.current = '';
          if (synced) {
            setViewMode('week');
          }

          const hasExistingLink =
            !!slotBeforeSave?.linkedTaskId || !!slotBeforeSave?.linkedHabitId;

          if (productKind === 'task' || productKind === 'habit') {
            try {
              const linkRes = await api.post(ENDPOINTS.BEHAVIORAL_ACTIVATION_WEEK_PLAN_LINK, {
                slotId,
                weekStart: weekStart || undefined,
                productKind,
                logId,
              });
              if (linkRes?.success && linkRes?.plan) {
                setWeekPlan(linkRes.plan);
                weekPlanRef.current = linkRes.plan;
                showToast(
                  productKind === 'task'
                    ? TEXTS.LINK_PRODUCT_TOAST_TASK
                    : TEXTS.LINK_PRODUCT_TOAST_HABIT,
                );
              }
            } catch (linkErr) {
              console.error('Error vinculando BA con producto:', linkErr);
              showToast(TEXTS.LINK_PRODUCT_TOAST_ERROR);
            }
          } else if (hasExistingLink) {
            try {
              const syncRes = await api.post(ENDPOINTS.BEHAVIORAL_ACTIVATION_WEEK_PLAN_SYNC, {
                slotId,
                weekStart: weekStart || undefined,
                logId,
              });
              if (syncRes?.success && syncRes?.plan) {
                setWeekPlan(syncRes.plan);
                weekPlanRef.current = syncRes.plan;
              }
            } catch (syncErr) {
              console.error('Error sincronizando BA con producto:', syncErr);
            }
          }
        }
        pendingProductLinkRef.current = null;

        resetWizard();
        await loadRecords();
      } else {
        showToast(response?.error || TEXTS.TOAST_ERROR);
      }
    } catch (err) {
      console.error('Error guardando registro BA:', err);
      showToast(TEXTS.TOAST_ERROR);
      pendingWeekSlotIdRef.current = '';
      pendingProductLinkRef.current = null;
    } finally {
      setSaving(false);
    }
  };

  const performDelete = useCallback(
    async (id) => {
      try {
        await api.delete(ENDPOINTS.BEHAVIORAL_ACTIVATION_LOG_BY_ID(id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_DELETED);
        setRecords((prev) => prev.filter((r) => r._id !== id));
      } catch (err) {
        console.error('Error eliminando registro BA:', err);
        showToast(TEXTS.TOAST_ERROR);
      }
    },
    [TEXTS.TOAST_DELETED, TEXTS.TOAST_ERROR, showToast],
  );

  const handleDelete = useCallback(
    (id) => {
      confirmDestructiveAction({
        title: TEXTS.DELETE_CONFIRM_TITLE,
        message: TEXTS.DELETE_CONFIRM_MESSAGE,
        cancelLabel: TEXTS.DELETE_CANCEL,
        confirmLabel: TEXTS.DELETE_CONFIRM,
        onConfirm: () => performDelete(id),
      });
    },
    [
      performDelete,
      TEXTS.DELETE_CANCEL,
      TEXTS.DELETE_CONFIRM,
      TEXTS.DELETE_CONFIRM_MESSAGE,
      TEXTS.DELETE_CONFIRM_TITLE,
    ],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(ENDPOINTS.BEHAVIORAL_ACTIVATION_LOGS_EXPORT);
      const text = response?.exportText;
      if (!text) {
        showToast(TEXTS.TOAST_EXPORT_ERROR);
        return;
      }
      await Share.share({ message: text });
    } catch (err) {
      console.error('Error exportando registros BA:', err);
      showToast(TEXTS.TOAST_EXPORT_ERROR);
    } finally {
      setExporting(false);
    }
  };

  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP1_TITLE}</Text>
          {fromChatPrefill ? (
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.PREFILL_HINT}</Text>
          ) : null}
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP1_HINT}</Text>
          <View style={styles.typeSegment}>
            {[
              { id: 'pleasant', label: TEXTS.TYPE_PLEASANT },
              { id: 'routine', label: TEXTS.TYPE_ROUTINE },
            ].map(({ id, label }) => {
              const selected = activityType === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.typeSegmentItem, selected && styles.typeSegmentItemOn]}
                  onPress={() => setActivityType(id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.typeSegmentText,
                      selected && styles.typeSegmentTextOn,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={[techniqueScreenStyles.textInput, { minHeight: 88, marginTop: 0 }]}
            placeholder={TEXTS.STEP1_PLACEHOLDER}
            placeholderTextColor={colors.textSecondary}
            value={activityDescription}
            onChangeText={setActivityDescription}
            multiline
            textAlignVertical="top"
          />
        </>
      );
    }
    if (stepIndex === 1) {
      return (
        <>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP2_TITLE}</Text>
          {fromChatMoodPrefill ? (
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.PREFILL_MOOD_HINT}</Text>
          ) : null}
          <IntensityScalePicker
            hint={TEXTS.STEP2_HINT}
            value={moodBefore}
            onChange={setMoodBefore}
            accessibilityLabelPrefix={TEXTS.STEP2_TITLE}
            style={{ marginTop: SPACING.sm }}
          />
        </>
      );
    }
    return (
      <>
        <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP3_TITLE}</Text>
        <IntensityScalePicker
          hint={TEXTS.STEP3_HINT}
          value={moodAfter}
          onChange={setMoodAfter}
          accessibilityLabelPrefix={TEXTS.STEP3_TITLE}
          style={{ marginTop: SPACING.sm }}
        />
        <Text style={[techniqueScreenStyles.formHint, { marginTop: SPACING.sm }]}>
          {TEXTS.STEP3_NOTES}
        </Text>
        <TextInput
          style={[techniqueScreenStyles.textInput, { minHeight: 72 }]}
          placeholder={TEXTS.STEP3_NOTES_PLACEHOLDER}
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={techniqueScreenStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>{TEXTS.INTRO_KICKER}</Text>
            <Text style={techniqueScreenStyles.introTitle}>{TEXTS.INTRO_TITLE}</Text>
            <Text style={techniqueScreenStyles.introText}>{TEXTS.INTRO_BODY}</Text>
          </View>

          <View style={styles.viewSegment}>
            {[
              { id: 'week', label: TEXTS.TAB_WEEK },
              { id: 'log', label: TEXTS.TAB_LOG },
            ].map(({ id, label }) => {
              const selected = viewMode === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.viewSegmentItem, selected && styles.viewSegmentItemOn]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setViewMode(id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.viewSegmentText, selected && styles.viewSegmentTextOn]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {viewMode === 'week' ? (
            <BehavioralActivationWeekPanel
              TEXTS={TEXTS}
              colors={colors}
              techniqueScreenStyles={techniqueScreenStyles}
              styles={styles}
              slots={weekPlan?.slots}
              dayLabels={dayLabels}
              loading={loadingWeekPlan}
              savingSlotId={savingSlotId}
              onRegisterSlot={handleRegisterWeekSlot}
              onSkipSlot={handleSkipWeekSlot}
            />
          ) : null}

          {viewMode === 'log' ? (
          <>
          <View style={techniqueScreenStyles.card}>
            <Text style={techniqueScreenStyles.cardMeta}>
              {TEXTS.STEP_PROGRESS} {stepIndex + 1} {TEXTS.OF} {STEPS.length}
            </Text>
            <View style={styles.stepRow}>
              {STEPS.map((label, index) => {
                const active = index === stepIndex;
                const done = index < stepIndex;
                return (
                  <React.Fragment key={label}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: active || done ? colors.accentLineSoft : colors.glassFill,
                          borderColor: active ? colors.primary : colors.accentLineSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepDotText,
                          { color: active || done ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                    {index < STEPS.length - 1 ? <View style={styles.stepConnector} /> : null}
                  </React.Fragment>
                );
              })}
            </View>
            {validationMessage ? (
              <Text style={styles.validationText}>{validationMessage}</Text>
            ) : null}
            {renderStepContent()}
            <View style={[techniqueScreenStyles.navRow, { marginTop: SPACING.md }]}>
              <TouchableOpacity
                style={techniqueScreenStyles.navButton}
                onPress={goBack}
                accessibilityRole="button"
              >
                <Text style={techniqueScreenStyles.navButtonTextMuted}>{TEXTS.BACK}</Text>
              </TouchableOpacity>
              {stepIndex < STEPS.length - 1 ? (
                <TouchableOpacity
                  style={[techniqueScreenStyles.navButton, techniqueScreenStyles.navButtonPrimary]}
                  onPress={goNext}
                  accessibilityRole="button"
                >
                  <Text style={techniqueScreenStyles.navButtonText}>{TEXTS.NEXT}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    techniqueScreenStyles.navButton,
                    techniqueScreenStyles.navButtonPrimary,
                    saving && { opacity: 0.7 },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                  accessibilityRole="button"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Text style={techniqueScreenStyles.navButtonText}>{TEXTS.SAVE}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={techniqueScreenStyles.card}>
            <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.RECENT_TITLE}</Text>
            {moodTrendLine ? (
              <Text style={[techniqueScreenStyles.formHint, { marginBottom: SPACING.sm }]}>
                {moodTrendLine}
              </Text>
            ) : null}
            {loadingRecords ? (
              <ActivityIndicator color={colors.primary} />
            ) : records.length === 0 ? (
              <Text style={techniqueScreenStyles.formHint}>{TEXTS.RECENT_EMPTY}</Text>
            ) : (
              records.slice(0, 10).map((record) => (
                  <View key={record._id} style={styles.recordItem}>
                    <View style={styles.recordBody}>
                      <Text style={techniqueScreenStyles.formSectionHeading}>
                        {record.activityDescription}
                      </Text>
                      <Text style={techniqueScreenStyles.formHint}>
                        {formatEntryDate(record.entryDate)}
                      </Text>
                      <IntensityBeforeAfterMarker
                        beforeValue={record.moodBefore}
                        afterValue={record.moodAfter}
                        compact
                        style={{ marginTop: SPACING.xs }}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(record._id)}
                      accessibilityLabel={TEXTS.DELETE_A11Y}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                ))
            )}
          </View>

          <View style={styles.exportBlock}>
            <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.EXPORT}</Text>
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.EXPORT_HINT}</Text>
            <TouchableOpacity
              style={techniqueScreenStyles.primaryButton}
              onPress={handleExport}
              disabled={exporting || records.length === 0}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.EXPORT}</Text>
              )}
            </TouchableOpacity>
          </View>
          </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BehavioralActivationScreen;
