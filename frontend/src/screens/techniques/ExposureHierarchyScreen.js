/**
 * Jerarquía de exposición + SUDS (#87).
 * Crear pasos ordenados, registrar intentos y avanzar sin saltos.
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
import { getFocusTheme } from '../../styles/focusCardTheme';
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';
import { confirmDestructiveAction } from '../../utils/confirmDestructiveAction';
import { parseExposurePlanRouteParams } from '../../utils/exposurePlanPrefill';
import {
  buildExposureAdvanceConfirmCopy,
  canMarkExposureStepComplete,
} from '../../utils/exposurePlanAdvance';
import { resolveExposurePlanErrorMessage } from '../../utils/exposurePlanApiErrors';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';
import IntensityBeforeAfterMarker from '../../components/techniques/IntensityBeforeAfterMarker';
import IntensityScalePicker from '../../components/techniques/IntensityScalePicker';

const SUDS_LEVELS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const MAX_STEPS = 15;
const MIN_STEPS = 2;

const DEFAULT_TEXTS = {
  TITLE: 'Jerarquía de exposición',
  INTRO_KICKER: 'TCC',
  INTRO_TITLE: 'Enfrenta lo que evitas, paso a paso',
  INTRO_BODY:
    'Arma una lista de situaciones de menor a mayor ansiedad. Registra tu SUDS (0–100) en cada intento. No sustituye terapia presencial.',
  DISCLAIMER: 'Herramienta de apoyo; avanza solo cuando completes el paso actual.',
  TAB_CREATE: 'Nueva jerarquía',
  TAB_PRACTICE: 'Practicar',
  GOAL_LABEL: '¿Qué situación o miedo quieres trabajar?',
  GOAL_HINT: 'Una frase clara sobre lo que evitas o te da miedo.',
  GOAL_PLACEHOLDER: 'Ejemplo: hablar en reuniones sin prepararme de más',
  STEPS_LABEL: 'Pasos (de menos a más difícil)',
  STEPS_HINT: 'Arriba el paso más fácil; abajo el más difícil. Puedes editar cada uno.',
  LADDER_EASY: 'Más fácil',
  LADDER_HARD: 'Más difícil',
  PREFILL_HINT:
    'Sugerencia a partir de tu mensaje en el chat. Puedes editarla antes de guardar.',
  STEP_PLACEHOLDER: 'Describe el paso…',
  ADD_STEP: 'Agregar paso',
  REMOVE_STEP: 'Quitar',
  SAVE_PLAN: 'Guardar jerarquía',
  SAVING: 'Guardando…',
  TOAST_SAVED: 'Jerarquía guardada',
  TOAST_ERROR: 'No se pudo guardar. Intenta de nuevo.',
  TOAST_ATTEMPT: 'Intento registrado',
  TOAST_STEP_DONE: 'Paso completado',
  TOAST_DELETED: 'Plan eliminado',
  TOAST_EXPORT_ERROR: 'No se pudo exportar',
  VALIDATION_GOAL: 'Escribe un objetivo antes de continuar.',
  VALIDATION_STEPS: 'Agrega al menos 2 pasos con descripción.',
  CURRENT_STEP: 'Paso actual',
  PEAK_SUDS: 'SUDS pico (0–100)',
  END_SUDS: 'SUDS al terminar (0–100)',
  NOTES_LABEL: 'Notas (opcional)',
  NOTES_PLACEHOLDER: 'Qué ayudó, qué fue difícil…',
  LOG_ATTEMPT: 'Registrar intento',
  COMPLETE_STEP: 'Marcar paso como completado',
  COMPLETE_NEEDS_ATTEMPT: 'Registra al menos un intento antes de marcar el paso como completado.',
  STEP_LOCKED: 'Completa el paso actual antes de intentar avanzar.',
  STEP_ALREADY_COMPLETED: 'Este paso ya está completado.',
  CONFIRM_COMPLETE_TITLE: '¿Listo para avanzar?',
  CONFIRM_COMPLETE_BODY:
    'Completaste «{step}» con al menos un intento registrado. Pasarás al siguiente paso, que suele ser más difícil.\n\nSiguiente: «{next}»\n\nSolo avanza si te sientes preparado.',
  CONFIRM_COMPLETE_LAST_TITLE: '¿Completar jerarquía?',
  CONFIRM_COMPLETE_LAST_BODY:
    'Completaste «{step}». Esto marcará toda la jerarquía como terminada. ¿Continuar?',
  CONFIRM_ADVANCE: 'Sí, avanzar',
  CONFIRM_CANCEL: 'Todavía no',
  ALL_DONE: 'Completaste todos los pasos de esta jerarquía.',
  NO_PLANS: 'Aún no hay jerarquías guardadas.',
  NO_PLANS_HINT: 'Crea una lista de pasos en la pestaña «Nueva jerarquía».',
  NO_PLANS_CTA: 'Ir a nueva jerarquía',
  RECENT_TITLE: 'Tus jerarquías',
  EXPORT: 'Exportar resumen',
  EXPORT_HINT: 'Texto para compartir con tu terapeuta.',
  DELETE_A11Y: 'Eliminar jerarquía',
  DELETE_CONFIRM_TITLE: 'Eliminar jerarquía',
  DELETE_CONFIRM_MESSAGE:
    'Se borrarán todos los pasos e intentos registrados. Esta acción no se puede deshacer.',
  DELETE_CANCEL: 'Cancelar',
  DELETE_CONFIRM: 'Eliminar',
  STEP_OF: 'Paso',
  OF: 'de',
  ATTEMPTS: 'intentos',
  RECENT_ATTEMPTS: 'Últimos intentos',
};

function formatPlanDate(iso) {
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

const ExposureHierarchyScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.EXPOSURE_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.EXPOSURE_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.EXPOSURE_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY: translated?.EXPOSURE_INTRO_BODY || DEFAULT_TEXTS.INTRO_BODY,
      DISCLAIMER: translated?.EXPOSURE_DISCLAIMER || DEFAULT_TEXTS.DISCLAIMER,
      TAB_CREATE: translated?.EXPOSURE_TAB_CREATE || DEFAULT_TEXTS.TAB_CREATE,
      TAB_PRACTICE: translated?.EXPOSURE_TAB_PRACTICE || DEFAULT_TEXTS.TAB_PRACTICE,
      GOAL_LABEL: translated?.EXPOSURE_GOAL_LABEL || DEFAULT_TEXTS.GOAL_LABEL,
      GOAL_HINT: translated?.EXPOSURE_GOAL_HINT || DEFAULT_TEXTS.GOAL_HINT,
      GOAL_PLACEHOLDER: translated?.EXPOSURE_GOAL_PLACEHOLDER || DEFAULT_TEXTS.GOAL_PLACEHOLDER,
      STEPS_LABEL: translated?.EXPOSURE_STEPS_LABEL || DEFAULT_TEXTS.STEPS_LABEL,
      STEPS_HINT: translated?.EXPOSURE_STEPS_HINT || DEFAULT_TEXTS.STEPS_HINT,
      LADDER_EASY: translated?.EXPOSURE_LADDER_EASY || DEFAULT_TEXTS.LADDER_EASY,
      LADDER_HARD: translated?.EXPOSURE_LADDER_HARD || DEFAULT_TEXTS.LADDER_HARD,
      PREFILL_HINT: translated?.EXPOSURE_PREFILL_HINT || DEFAULT_TEXTS.PREFILL_HINT,
      STEP_PLACEHOLDER: translated?.EXPOSURE_STEP_PLACEHOLDER || DEFAULT_TEXTS.STEP_PLACEHOLDER,
      ADD_STEP: translated?.EXPOSURE_ADD_STEP || DEFAULT_TEXTS.ADD_STEP,
      REMOVE_STEP: translated?.EXPOSURE_REMOVE_STEP || DEFAULT_TEXTS.REMOVE_STEP,
      SAVE_PLAN: translated?.EXPOSURE_SAVE_PLAN || DEFAULT_TEXTS.SAVE_PLAN,
      SAVING: translated?.EXPOSURE_SAVING || DEFAULT_TEXTS.SAVING,
      TOAST_SAVED: translated?.EXPOSURE_TOAST_SAVED || DEFAULT_TEXTS.TOAST_SAVED,
      TOAST_ERROR: translated?.EXPOSURE_TOAST_ERROR || DEFAULT_TEXTS.TOAST_ERROR,
      TOAST_ATTEMPT: translated?.EXPOSURE_TOAST_ATTEMPT || DEFAULT_TEXTS.TOAST_ATTEMPT,
      TOAST_STEP_DONE: translated?.EXPOSURE_TOAST_STEP_DONE || DEFAULT_TEXTS.TOAST_STEP_DONE,
      TOAST_DELETED: translated?.EXPOSURE_TOAST_DELETED || DEFAULT_TEXTS.TOAST_DELETED,
      TOAST_EXPORT_ERROR:
        translated?.EXPOSURE_TOAST_EXPORT_ERROR || DEFAULT_TEXTS.TOAST_EXPORT_ERROR,
      VALIDATION_GOAL: translated?.EXPOSURE_VALIDATION_GOAL || DEFAULT_TEXTS.VALIDATION_GOAL,
      VALIDATION_STEPS:
        translated?.EXPOSURE_VALIDATION_STEPS || DEFAULT_TEXTS.VALIDATION_STEPS,
      CURRENT_STEP: translated?.EXPOSURE_CURRENT_STEP || DEFAULT_TEXTS.CURRENT_STEP,
      PEAK_SUDS: translated?.EXPOSURE_PEAK_SUDS || DEFAULT_TEXTS.PEAK_SUDS,
      END_SUDS: translated?.EXPOSURE_END_SUDS || DEFAULT_TEXTS.END_SUDS,
      NOTES_LABEL: translated?.EXPOSURE_NOTES_LABEL || DEFAULT_TEXTS.NOTES_LABEL,
      NOTES_PLACEHOLDER:
        translated?.EXPOSURE_NOTES_PLACEHOLDER || DEFAULT_TEXTS.NOTES_PLACEHOLDER,
      LOG_ATTEMPT: translated?.EXPOSURE_LOG_ATTEMPT || DEFAULT_TEXTS.LOG_ATTEMPT,
      COMPLETE_STEP: translated?.EXPOSURE_COMPLETE_STEP || DEFAULT_TEXTS.COMPLETE_STEP,
      COMPLETE_NEEDS_ATTEMPT:
        translated?.EXPOSURE_COMPLETE_NEEDS_ATTEMPT || DEFAULT_TEXTS.COMPLETE_NEEDS_ATTEMPT,
      STEP_LOCKED: translated?.EXPOSURE_STEP_LOCKED || DEFAULT_TEXTS.STEP_LOCKED,
      STEP_ALREADY_COMPLETED:
        translated?.EXPOSURE_STEP_ALREADY_COMPLETED || DEFAULT_TEXTS.STEP_ALREADY_COMPLETED,
      CONFIRM_COMPLETE_TITLE:
        translated?.EXPOSURE_CONFIRM_COMPLETE_TITLE || DEFAULT_TEXTS.CONFIRM_COMPLETE_TITLE,
      CONFIRM_COMPLETE_BODY:
        translated?.EXPOSURE_CONFIRM_COMPLETE_BODY || DEFAULT_TEXTS.CONFIRM_COMPLETE_BODY,
      CONFIRM_COMPLETE_LAST_TITLE:
        translated?.EXPOSURE_CONFIRM_COMPLETE_LAST_TITLE || DEFAULT_TEXTS.CONFIRM_COMPLETE_LAST_TITLE,
      CONFIRM_COMPLETE_LAST_BODY:
        translated?.EXPOSURE_CONFIRM_COMPLETE_LAST_BODY || DEFAULT_TEXTS.CONFIRM_COMPLETE_LAST_BODY,
      CONFIRM_ADVANCE: translated?.EXPOSURE_CONFIRM_ADVANCE || DEFAULT_TEXTS.CONFIRM_ADVANCE,
      CONFIRM_CANCEL: translated?.EXPOSURE_CONFIRM_CANCEL || DEFAULT_TEXTS.CONFIRM_CANCEL,
      ALL_DONE: translated?.EXPOSURE_ALL_DONE || DEFAULT_TEXTS.ALL_DONE,
      NO_PLANS: translated?.EXPOSURE_NO_PLANS || DEFAULT_TEXTS.NO_PLANS,
      NO_PLANS_HINT: translated?.EXPOSURE_NO_PLANS_HINT || DEFAULT_TEXTS.NO_PLANS_HINT,
      NO_PLANS_CTA: translated?.EXPOSURE_NO_PLANS_CTA || DEFAULT_TEXTS.NO_PLANS_CTA,
      RECENT_TITLE: translated?.EXPOSURE_RECENT_TITLE || DEFAULT_TEXTS.RECENT_TITLE,
      EXPORT: translated?.EXPOSURE_EXPORT || DEFAULT_TEXTS.EXPORT,
      EXPORT_HINT: translated?.EXPOSURE_EXPORT_HINT || DEFAULT_TEXTS.EXPORT_HINT,
      DELETE_A11Y: translated?.EXPOSURE_DELETE_A11Y || DEFAULT_TEXTS.DELETE_A11Y,
      DELETE_CONFIRM_TITLE:
        translated?.EXPOSURE_DELETE_CONFIRM_TITLE || DEFAULT_TEXTS.DELETE_CONFIRM_TITLE,
      DELETE_CONFIRM_MESSAGE:
        translated?.EXPOSURE_DELETE_CONFIRM_MESSAGE || DEFAULT_TEXTS.DELETE_CONFIRM_MESSAGE,
      DELETE_CANCEL: translated?.TCC_DELETE_CANCEL || DEFAULT_TEXTS.DELETE_CANCEL,
      DELETE_CONFIRM: translated?.TCC_DELETE_CONFIRM || DEFAULT_TEXTS.DELETE_CONFIRM,
      STEP_OF: translated?.EXPOSURE_STEP_OF || DEFAULT_TEXTS.STEP_OF,
      OF: translated?.EXPOSURE_OF || DEFAULT_TEXTS.OF,
      ATTEMPTS: translated?.EXPOSURE_ATTEMPTS || DEFAULT_TEXTS.ATTEMPTS,
      RECENT_ATTEMPTS: translated?.EXPOSURE_RECENT_ATTEMPTS || DEFAULT_TEXTS.RECENT_ATTEMPTS,
    }),
    [translated],
  );

  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const focusTheme = useMemo(
    () => getFocusTheme(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const { showToast } = useToast();

  const [mode, setMode] = useState('create');
  const [title, setTitle] = useState('');
  const [draftSteps, setDraftSteps] = useState(['', '']);
  const [validationMessage, setValidationMessage] = useState('');
  const [fromChatPrefill, setFromChatPrefill] = useState(false);
  const handledChatPrefillKeyRef = useRef('');
  const handledResetAtRef = useRef(null);
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingAttempt, setLoggingAttempt] = useState(false);
  const [completingStep, setCompletingStep] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [peakSuds, setPeakSuds] = useState(50);
  const [endSuds, setEndSuds] = useState(30);
  const [attemptNotes, setAttemptNotes] = useState('');

  const activePlan = useMemo(
    () => plans.find((p) => p._id === activePlanId) || null,
    [plans, activePlanId],
  );

  const currentStep = useMemo(() => {
    if (!activePlan?.steps?.length) return null;
    const index = activePlan.currentStepIndex ?? 0;
    return activePlan.steps[index] || null;
  }, [activePlan]);

  const currentStepAttemptCount = currentStep?.attempts?.length || 0;
  const canCompleteStep = canMarkExposureStepComplete(currentStepAttemptCount);

  const allStepsCompleted = useMemo(() => {
    if (!activePlan?.steps?.length) return false;
    return activePlan.steps.every((s) => s.status === 'completed');
  }, [activePlan]);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const response = await api.get(ENDPOINTS.EXPOSURE_PLANS);
      if (response?.success && Array.isArray(response.plans)) {
        setPlans(response.plans);
        setActivePlanId((prev) => {
          if (prev && response.plans.some((p) => p._id === prev)) return prev;
          return response.plans[0]?._id || null;
        });
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error('Error cargando planes de exposición:', err);
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    const openPlanId = route.params?.openPlanId ? String(route.params.openPlanId) : '';
    if (!openPlanId || loadingPlans || !plans.length) return;
    if (plans.some((p) => String(p._id) === openPlanId)) {
      setActivePlanId(openPlanId);
      setMode(route.params?.mode === 'create' ? 'create' : 'practice');
    }
  }, [route.params?.openPlanId, route.params?.mode, plans, loadingPlans]);

  useEffect(() => {
    setPeakSuds(50);
    setEndSuds(30);
    setAttemptNotes('');
  }, [activePlan?._id, activePlan?.currentStepIndex]);

  const resetCreateForm = useCallback(() => {
    setTitle('');
    setDraftSteps(['', '']);
    setValidationMessage('');
    setFromChatPrefill(false);
    handledChatPrefillKeyRef.current = '';
  }, []);

  const applyRoutePrefill = useCallback(
    (params) => {
      const raw = params && typeof params === 'object' ? params : {};
      if (raw.resetFormAt != null && handledResetAtRef.current !== raw.resetFormAt) {
        handledResetAtRef.current = raw.resetFormAt;
        handledChatPrefillKeyRef.current = '';
        resetCreateForm();
        return;
      }

      const parsed = parseExposurePlanRouteParams(raw);
      if (
        !parsed.fromChat ||
        (!parsed.prefillGoal && parsed.prefillSteps.length === 0)
      ) {
        if (raw.fromChat === false) setFromChatPrefill(false);
        return;
      }

      const prefillKey = `${parsed.prefillGoal}|${parsed.prefillSteps.join('|')}`;
      if (prefillKey === handledChatPrefillKeyRef.current) return;
      handledChatPrefillKeyRef.current = prefillKey;
      handledResetAtRef.current = null;

      if (parsed.prefillGoal) setTitle(parsed.prefillGoal);
      if (parsed.prefillSteps.length >= 2) {
        setDraftSteps(parsed.prefillSteps);
      }
      setFromChatPrefill(true);
      setMode('create');
      setValidationMessage('');
    },
    [resetCreateForm],
  );

  useFocusEffect(
    useCallback(() => {
      applyRoutePrefill(route.params);
    }, [applyRoutePrefill, route.params]),
  );

  const updateDraftStep = (index, value) => {
    setDraftSteps((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addDraftStep = () => {
    if (draftSteps.length >= MAX_STEPS) return;
    setDraftSteps((prev) => [...prev, '']);
  };

  const removeDraftStep = (index) => {
    if (draftSteps.length <= MIN_STEPS) return;
    setDraftSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePlan = async () => {
    setValidationMessage('');
    const trimmedTitle = title.trim();
    const trimmedSteps = draftSteps.map((s) => s.trim()).filter(Boolean);
    if (!trimmedTitle) {
      setValidationMessage(TEXTS.VALIDATION_GOAL);
      return;
    }
    if (trimmedSteps.length < MIN_STEPS) {
      setValidationMessage(TEXTS.VALIDATION_STEPS);
      return;
    }
    setSaving(true);
    try {
      const response = await api.post(ENDPOINTS.EXPOSURE_PLANS, {
        title: trimmedTitle,
        steps: trimmedSteps,
      });
      if (response?.success && response.plan) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_SAVED);
        resetCreateForm();
        setActivePlanId(response.plan._id);
        setMode('practice');
        await loadPlans();
      } else {
        showToast(response?.error || TEXTS.TOAST_ERROR);
      }
    } catch (err) {
      console.error('Error guardando jerarquía:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleLogAttempt = async () => {
    if (!activePlan?._id || currentStep == null || loggingAttempt || completingStep) return;
    const stepIndex = activePlan.currentStepIndex ?? 0;
    setLoggingAttempt(true);
    try {
      const response = await api.post(ENDPOINTS.EXPOSURE_PLAN_ATTEMPTS(activePlan._id), {
        stepIndex,
        peakSuds,
        endSuds,
        notes: attemptNotes.trim(),
      });
      if (response?.success && response.plan) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_ATTEMPT);
        setAttemptNotes('');
        setPlans((prev) =>
          prev.map((p) => (p._id === response.plan._id ? response.plan : p)),
        );
      } else {
        showToast(
          resolveExposurePlanErrorMessage(response, {
            toastError: TEXTS.TOAST_ERROR,
            stepLocked: TEXTS.STEP_LOCKED,
            completeNeedsAttempt: TEXTS.COMPLETE_NEEDS_ATTEMPT,
            stepAlreadyCompleted: TEXTS.STEP_ALREADY_COMPLETED,
          }),
        );
      }
    } catch (err) {
      console.error('Error registrando intento:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setLoggingAttempt(false);
    }
  };

  const exposureErrorTexts = useMemo(
    () => ({
      toastError: TEXTS.TOAST_ERROR,
      stepLocked: TEXTS.STEP_LOCKED,
      completeNeedsAttempt: TEXTS.COMPLETE_NEEDS_ATTEMPT,
      stepAlreadyCompleted: TEXTS.STEP_ALREADY_COMPLETED,
    }),
    [
      TEXTS.TOAST_ERROR,
      TEXTS.STEP_LOCKED,
      TEXTS.COMPLETE_NEEDS_ATTEMPT,
      TEXTS.STEP_ALREADY_COMPLETED,
    ],
  );

  const performCompleteStep = useCallback(async () => {
    if (!activePlan?._id || completingStep) return;
    const stepIndex = activePlan.currentStepIndex ?? 0;
    const isLastStep = stepIndex >= (activePlan.steps?.length ?? 0) - 1;
    setCompletingStep(true);
    try {
      const response = await api.post(
        ENDPOINTS.EXPOSURE_PLAN_STEP_COMPLETE(activePlan._id, stepIndex),
      );
      if (response?.success && response.plan) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_STEP_DONE);
        if (isLastStep) {
          recordInterventionCompleted('exposure_hierarchy');
        }
        setPlans((prev) =>
          prev.map((p) => (p._id === response.plan._id ? response.plan : p)),
        );
      } else {
        showToast(resolveExposurePlanErrorMessage(response, exposureErrorTexts));
      }
    } catch (err) {
      console.error('Error completando paso:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setCompletingStep(false);
    }
  }, [activePlan, completingStep, TEXTS.TOAST_STEP_DONE, TEXTS.TOAST_ERROR, exposureErrorTexts, showToast]);

  const handleCompleteStep = useCallback(() => {
    if (!activePlan?._id || !canCompleteStep || !currentStep || completingStep || loggingAttempt) {
      return;
    }

    const stepIndex = activePlan.currentStepIndex ?? 0;
    const isLastStep = stepIndex >= activePlan.steps.length - 1;
    const nextStep = !isLastStep ? activePlan.steps[stepIndex + 1] : null;
    const stepLabel = currentStep.description?.trim() || TEXTS.CURRENT_STEP;

    const { title, message } = buildExposureAdvanceConfirmCopy({
      stepLabel,
      nextStepLabel: nextStep?.description,
      isLastStep,
      texts: {
        currentStepFallback: TEXTS.CURRENT_STEP,
        confirmCompleteTitle: TEXTS.CONFIRM_COMPLETE_TITLE,
        confirmCompleteBody: TEXTS.CONFIRM_COMPLETE_BODY,
        confirmCompleteLastTitle: TEXTS.CONFIRM_COMPLETE_LAST_TITLE,
        confirmCompleteLastBody: TEXTS.CONFIRM_COMPLETE_LAST_BODY,
      },
    });

    Alert.alert(title, message, [
      { text: TEXTS.CONFIRM_CANCEL, style: 'cancel' },
      { text: TEXTS.CONFIRM_ADVANCE, onPress: performCompleteStep },
    ]);
  }, [
    activePlan,
    canCompleteStep,
    currentStep,
    performCompleteStep,
    TEXTS.CONFIRM_ADVANCE,
    TEXTS.CONFIRM_CANCEL,
    TEXTS.CURRENT_STEP,
    completingStep,
    loggingAttempt,
  ]);

  const performDelete = useCallback(
    async (id) => {
      try {
        await api.delete(ENDPOINTS.EXPOSURE_PLAN_BY_ID(id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_DELETED);
        setPlans((prev) => prev.filter((p) => p._id !== id));
        if (activePlanId === id) {
          setActivePlanId(null);
        }
      } catch (err) {
        console.error('Error eliminando plan:', err);
        showToast(TEXTS.TOAST_ERROR);
      }
    },
    [activePlanId, TEXTS.TOAST_DELETED, TEXTS.TOAST_ERROR, showToast],
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
      const response = await api.get(ENDPOINTS.EXPOSURE_PLANS_EXPORT);
      const text = response?.exportText;
      if (!text) {
        showToast(TEXTS.TOAST_EXPORT_ERROR);
        return;
      }
      await Share.share({ message: text });
    } catch (err) {
      console.error('Error exportando planes:', err);
      showToast(TEXTS.TOAST_EXPORT_ERROR);
    } finally {
      setExporting(false);
    }
  };

  const renderSudsPicker = (label, value, onChange, pickerStyle) => (
    <IntensityScalePicker
      label={label}
      values={SUDS_LEVELS}
      value={value}
      onChange={onChange}
      lowLabel="0"
      highLabel="100"
      accessibilityLabelPrefix={label}
      style={pickerStyle}
    />
  );

  const renderStepProgress = (plan) => {
    if (!plan?.steps?.length) return null;
    const current = (plan.currentStepIndex ?? 0) + 1;
    const total = plan.steps.length;
    const ratio = Math.min(1, current / total);
    return (
      <View style={styles.progressBlock}>
        <Text style={techniqueScreenStyles.cardMeta}>
          {TEXTS.STEP_OF} {current} {TEXTS.OF} {total}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.chromeInput }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${ratio * 100}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderCreatePanel = () => (
    <View style={techniqueScreenStyles.card}>
      {fromChatPrefill ? (
        <Text style={techniqueScreenStyles.formHint}>{TEXTS.PREFILL_HINT}</Text>
      ) : null}
      <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.GOAL_LABEL}</Text>
      <Text style={techniqueScreenStyles.formHint}>{TEXTS.GOAL_HINT}</Text>
      <TextInput
        style={[techniqueScreenStyles.textInput, styles.goalInput]}
        placeholder={TEXTS.GOAL_PLACEHOLDER}
        placeholderTextColor={colors.textSecondary}
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setFromChatPrefill(false);
        }}
        multiline
        textAlignVertical="top"
        accessibilityLabel={TEXTS.GOAL_LABEL}
      />
      <Text style={[techniqueScreenStyles.formSectionHeading, { marginTop: SPACING.sm }]}>
        {TEXTS.STEPS_LABEL}
      </Text>
      <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEPS_HINT}</Text>
      <Text style={[styles.ladderScaleLabel, { color: colors.textSecondary }]}>
        {TEXTS.LADDER_EASY}
      </Text>
      <View style={styles.ladderList}>
        {draftSteps.map((step, index) => (
          <View key={`draft-${index}`} style={styles.ladderRow}>
            <View style={styles.ladderRail}>
              <View
                style={[
                  styles.ladderBadge,
                  {
                    backgroundColor: colors.accentLineSoft,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.ladderBadgeText, { color: colors.primary }]}>
                  {index + 1}
                </Text>
              </View>
              {index < draftSteps.length - 1 ? (
                <View style={[styles.ladderLine, { backgroundColor: colors.accentLineSoft }]} />
              ) : null}
            </View>
            <View style={styles.ladderInputCol}>
              <TextInput
                style={[techniqueScreenStyles.textInput, styles.stepInput]}
                placeholder={TEXTS.STEP_PLACEHOLDER}
                placeholderTextColor={colors.textSecondary}
                value={step}
                onChangeText={(v) => {
                  updateDraftStep(index, v);
                  setFromChatPrefill(false);
                }}
                accessibilityLabel={`${TEXTS.STEPS_LABEL} ${index + 1}`}
              />
              {draftSteps.length > MIN_STEPS ? (
                <TouchableOpacity
                  style={styles.removeStepBtn}
                  onPress={() => removeDraftStep(index)}
                  accessibilityRole="button"
                  accessibilityLabel={TEXTS.REMOVE_STEP}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.ladderScaleLabel, { color: colors.textSecondary }]}>
        {TEXTS.LADDER_HARD}
      </Text>
      {draftSteps.length < MAX_STEPS ? (
        <TouchableOpacity style={styles.addStepBtn} onPress={addDraftStep}>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.addStepText, { color: colors.primary }]}>{TEXTS.ADD_STEP}</Text>
        </TouchableOpacity>
      ) : null}
      {validationMessage ? (
        <Text style={[styles.validationText, { color: colors.error || '#c0392b' }]}>
          {validationMessage}
        </Text>
      ) : null}
      <TouchableOpacity
        style={[
          techniqueScreenStyles.navButton,
          techniqueScreenStyles.navButtonPrimary,
          styles.saveButton,
          saving && { opacity: 0.7 },
        ]}
        onPress={handleSavePlan}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Text style={techniqueScreenStyles.navButtonText}>{TEXTS.SAVE_PLAN}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPracticePanel = () => {
    if (loadingPlans) {
      return (
        <View style={techniqueScreenStyles.card}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (plans.length === 0) {
      return (
        <View style={techniqueScreenStyles.card}>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.NO_PLANS}</Text>
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.NO_PLANS_HINT}</Text>
          <TouchableOpacity
            style={[
              techniqueScreenStyles.navButton,
              techniqueScreenStyles.navButtonPrimary,
              styles.emptyCta,
            ]}
            onPress={() => setMode('create')}
          >
            <Text style={techniqueScreenStyles.navButtonText}>{TEXTS.NO_PLANS_CTA}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.planTabsScroll}
          contentContainerStyle={[
            styles.planTabsContent,
            {
              backgroundColor: colors.chromeInput,
              borderColor: focusTheme.FOCUS_BORDER_SUBTLE,
            },
          ]}
        >
          {plans.map((plan) => {
            const selected = plan._id === activePlanId;
            return (
              <TouchableOpacity
                key={plan._id}
                style={[
                  styles.planTab,
                  selected && {
                    backgroundColor: colors.cardBackground,
                    borderColor: focusTheme.FOCUS_ACCENT_BORDER,
                  },
                ]}
                onPress={() => setActivePlanId(plan._id)}
              >
                <Text
                  style={[
                    styles.planTabText,
                    { color: selected ? colors.primary : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {plan.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activePlan && currentStep && !allStepsCompleted ? (
          <View style={techniqueScreenStyles.card}>
            {renderStepProgress(activePlan)}
            <Text style={techniqueScreenStyles.cardMeta}>{TEXTS.CURRENT_STEP}</Text>
            <Text style={techniqueScreenStyles.formSectionHeading}>
              {currentStep.description}
            </Text>
            <Text style={techniqueScreenStyles.formHint}>
              {(currentStep.attempts?.length || 0)} {TEXTS.ATTEMPTS}
            </Text>
            {renderSudsPicker(TEXTS.PEAK_SUDS, peakSuds, setPeakSuds, styles.sudsPickerFirst)}
            {renderSudsPicker(TEXTS.END_SUDS, endSuds, setEndSuds, styles.sudsPickerSecond)}
            {currentStep?.attempts?.length > 0 ? (
              <View style={styles.recentAttemptsBlock}>
                <Text style={[techniqueScreenStyles.formSectionHeading, styles.recentAttemptsTitle]}>
                  {TEXTS.RECENT_ATTEMPTS}
                </Text>
                {[...(currentStep.attempts || [])]
                  .slice(-3)
                  .reverse()
                  .map((attempt) => (
                    <View key={String(attempt._id || attempt.attemptDate)} style={styles.attemptRow}>
                      <Text style={techniqueScreenStyles.formHint}>
                        {formatPlanDate(attempt.attemptDate)}
                      </Text>
                      <IntensityBeforeAfterMarker
                        beforeValue={attempt.peakSuds}
                        afterValue={attempt.endSuds}
                        min={0}
                        max={100}
                        deltaMode="lower-is-better"
                        compact
                        style={{ marginTop: SPACING.xs }}
                      />
                    </View>
                  ))}
              </View>
            ) : null}
            <Text style={[techniqueScreenStyles.formSectionHeading, styles.notesHeading]}>
              {TEXTS.NOTES_LABEL}
            </Text>
            <TextInput
              style={[techniqueScreenStyles.textInput, styles.notesInput]}
              placeholder={TEXTS.NOTES_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={attemptNotes}
              onChangeText={setAttemptNotes}
              multiline
              textAlignVertical="top"
            />
            {!canCompleteStep ? (
              <Text style={techniqueScreenStyles.formHint}>{TEXTS.COMPLETE_NEEDS_ATTEMPT}</Text>
            ) : null}
            <TouchableOpacity
              style={[
                techniqueScreenStyles.navButton,
                techniqueScreenStyles.navButtonPrimary,
                styles.practiceAction,
                loggingAttempt && { opacity: 0.7 },
              ]}
              onPress={handleLogAttempt}
              disabled={loggingAttempt}
            >
              {loggingAttempt ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Text style={techniqueScreenStyles.navButtonText}>{TEXTS.LOG_ATTEMPT}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                techniqueScreenStyles.navButton,
                styles.practiceAction,
                (completingStep || !canCompleteStep) && techniqueScreenStyles.navButtonDisabled,
              ]}
              onPress={handleCompleteStep}
              disabled={completingStep || !canCompleteStep}
            >
              {completingStep ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={techniqueScreenStyles.navButtonTextMuted}>{TEXTS.COMPLETE_STEP}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : activePlan && allStepsCompleted ? (
          <View style={[techniqueScreenStyles.card, styles.doneCard]}>
            <MaterialCommunityIcons name="check-circle-outline" size={32} color={colors.primary} />
            <Text style={[techniqueScreenStyles.introTitle, styles.doneTitle]}>{TEXTS.ALL_DONE}</Text>
            <Text style={techniqueScreenStyles.formHint}>{activePlan.title}</Text>
          </View>
        ) : null}

        <View style={techniqueScreenStyles.card}>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.RECENT_TITLE}</Text>
          {plans.map((plan) => {
            const stepIndex = (plan.currentStepIndex ?? 0) + 1;
            const stepTotal = plan.steps?.length || 0;
            const done = stepIndex >= stepTotal && stepTotal > 0;
            return (
              <View key={`list-${plan._id}`} style={styles.planListItem}>
                <TouchableOpacity
                  style={styles.planListBody}
                  onPress={() => {
                    setActivePlanId(plan._id);
                    setMode('practice');
                  }}
                >
                  <Text style={techniqueScreenStyles.formSectionHeading}>{plan.title}</Text>
                  <Text style={techniqueScreenStyles.formHint}>
                    {formatPlanDate(plan.updatedAt)} · {TEXTS.STEP_OF} {stepIndex} {TEXTS.OF}{' '}
                    {stepTotal}
                    {done ? ' · ✓' : ''}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(plan._id)}
                  accessibilityRole="button"
                  accessibilityLabel={TEXTS.DELETE_A11Y}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title={TEXTS.TITLE}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
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
            <Text style={[techniqueScreenStyles.formHint, { marginTop: SPACING.sm }]}>
              {TEXTS.DISCLAIMER}
            </Text>
          </View>

          <View
            style={[
              styles.modeRow,
              {
                backgroundColor: colors.chromeInput,
                borderColor: focusTheme.FOCUS_BORDER_SUBTLE,
              },
            ]}
          >
            {['create', 'practice'].map((tab) => {
              const active = mode === tab;
              const label = tab === 'create' ? TEXTS.TAB_CREATE : TEXTS.TAB_PRACTICE;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.modeTab,
                    active && {
                      backgroundColor: colors.cardBackground,
                      borderColor: focusTheme.FOCUS_ACCENT_BORDER,
                    },
                  ]}
                  onPress={() => setMode(tab)}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      { color: active ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === 'create' ? renderCreatePanel() : renderPracticePanel()}

          {plans.length > 0 ? (
            <View style={styles.exportBlock}>
              <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.EXPORT}</Text>
              <Text style={techniqueScreenStyles.formHint}>{TEXTS.EXPORT_HINT}</Text>
              <TouchableOpacity
                style={[techniqueScreenStyles.secondaryButton, styles.exportButton]}
                onPress={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={techniqueScreenStyles.secondaryButtonText}>{TEXTS.EXPORT}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  modeRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginBottom: SPACING.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  modeTabText: { fontSize: 14, fontWeight: '600' },
  goalInput: {
    minHeight: 56,
    marginBottom: SPACING.sm,
  },
  ladderScaleLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  ladderList: {
    marginBottom: SPACING.xs,
  },
  ladderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  ladderRail: {
    width: 36,
    alignItems: 'center',
    paddingTop: 10,
  },
  ladderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ladderBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ladderLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginTop: 4,
    borderRadius: 1,
  },
  ladderInputCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  stepInput: {
    flex: 1,
    minHeight: 48,
    marginBottom: 0,
    paddingVertical: 10,
  },
  removeStepBtn: {
    paddingTop: 12,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  addStepText: { fontSize: 14, fontWeight: '600' },
  saveButton: {
    alignSelf: 'stretch',
    marginTop: SPACING.md,
  },
  validationText: { marginTop: SPACING.sm, fontSize: 14 },
  progressBlock: { marginBottom: SPACING.sm },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sudsPickerFirst: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sudsPickerSecond: {
    marginTop: 0,
    marginBottom: SPACING.lg,
  },
  recentAttemptsBlock: {
    marginBottom: SPACING.sm,
  },
  recentAttemptsTitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  attemptRow: {
    marginBottom: SPACING.sm,
  },
  notesHeading: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  notesInput: { minHeight: 72, marginTop: SPACING.xs },
  practiceAction: { alignSelf: 'stretch', marginTop: SPACING.sm },
  emptyCta: { alignSelf: 'stretch', marginTop: SPACING.md },
  doneCard: { alignItems: 'center', paddingVertical: SPACING.lg },
  doneTitle: { marginTop: SPACING.sm, textAlign: 'center' },
  planTabsScroll: { marginBottom: SPACING.md, maxHeight: 52 },
  planTabsContent: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingRight: SPACING.md,
  },
  planTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    maxWidth: 200,
  },
  planTabText: { fontSize: 13, fontWeight: '600' },
  planListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  planListBody: { flex: 1, paddingRight: SPACING.sm },
  exportBlock: { marginTop: SPACING.md, marginBottom: SPACING.xxl },
  exportButton: { alignSelf: 'stretch', marginTop: SPACING.sm },
});

export default ExposureHierarchyScreen;
