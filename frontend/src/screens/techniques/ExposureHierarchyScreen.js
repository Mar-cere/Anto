/**
 * Jerarquía de exposición + SUDS (#87).
 * Crear pasos ordenados, registrar intentos y avanzar sin saltos.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

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
  GOAL_PLACEHOLDER: 'Ejemplo: hablar en reuniones sin prepararme de más',
  STEPS_LABEL: 'Pasos (de menos a más difícil)',
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
  ALL_DONE: 'Completaste todos los pasos de esta jerarquía.',
  NO_PLANS: 'Aún no hay jerarquías. Crea una arriba.',
  RECENT_TITLE: 'Tus jerarquías',
  EXPORT: 'Exportar resumen',
  EXPORT_HINT: 'Texto para compartir con tu terapeuta.',
  DELETE_A11Y: 'Eliminar jerarquía',
  STEP_OF: 'Paso',
  OF: 'de',
  ATTEMPTS: 'intentos',
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
      GOAL_PLACEHOLDER: translated?.EXPOSURE_GOAL_PLACEHOLDER || DEFAULT_TEXTS.GOAL_PLACEHOLDER,
      STEPS_LABEL: translated?.EXPOSURE_STEPS_LABEL || DEFAULT_TEXTS.STEPS_LABEL,
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
      ALL_DONE: translated?.EXPOSURE_ALL_DONE || DEFAULT_TEXTS.ALL_DONE,
      NO_PLANS: translated?.EXPOSURE_NO_PLANS || DEFAULT_TEXTS.NO_PLANS,
      RECENT_TITLE: translated?.EXPOSURE_RECENT_TITLE || DEFAULT_TEXTS.RECENT_TITLE,
      EXPORT: translated?.EXPOSURE_EXPORT || DEFAULT_TEXTS.EXPORT,
      EXPORT_HINT: translated?.EXPOSURE_EXPORT_HINT || DEFAULT_TEXTS.EXPORT_HINT,
      DELETE_A11Y: translated?.EXPOSURE_DELETE_A11Y || DEFAULT_TEXTS.DELETE_A11Y,
      STEP_OF: translated?.EXPOSURE_STEP_OF || DEFAULT_TEXTS.STEP_OF,
      OF: translated?.EXPOSURE_OF || DEFAULT_TEXTS.OF,
      ATTEMPTS: translated?.EXPOSURE_ATTEMPTS || DEFAULT_TEXTS.ATTEMPTS,
    }),
    [translated],
  );

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const { showToast } = useToast();

  const [mode, setMode] = useState('create');
  const [title, setTitle] = useState('');
  const [draftSteps, setDraftSteps] = useState(['', '']);
  const [validationMessage, setValidationMessage] = useState('');
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
  const canCompleteStep = currentStepAttemptCount > 0;

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

  const resetCreateForm = () => {
    setTitle('');
    setDraftSteps(['', '']);
    setValidationMessage('');
  };

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
        recordInterventionCompleted('exposure_hierarchy');
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
    if (!activePlan?._id || currentStep == null) return;
    setLoggingAttempt(true);
    try {
      const stepIndex = activePlan.currentStepIndex ?? 0;
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
        showToast(response?.error || TEXTS.TOAST_ERROR);
      }
    } catch (err) {
      console.error('Error registrando intento:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setLoggingAttempt(false);
    }
  };

  const handleCompleteStep = async () => {
    if (!activePlan?._id) return;
    const stepIndex = activePlan.currentStepIndex ?? 0;
    setCompletingStep(true);
    try {
      const response = await api.post(
        ENDPOINTS.EXPOSURE_PLAN_STEP_COMPLETE(activePlan._id, stepIndex),
      );
      if (response?.success && response.plan) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_STEP_DONE);
        recordInterventionCompleted('exposure_hierarchy');
        setPlans((prev) =>
          prev.map((p) => (p._id === response.plan._id ? response.plan : p)),
        );
      } else {
        showToast(response?.error || TEXTS.TOAST_ERROR);
      }
    } catch (err) {
      console.error('Error completando paso:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setCompletingStep(false);
    }
  };

  const handleDelete = async (id) => {
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
  };

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

  const renderSudsPicker = (label, value, onChange) => (
    <View style={styles.sudsBlock}>
      <Text style={techniqueScreenStyles.formHint}>{label}</Text>
      <View style={styles.sudsRow}>
        {SUDS_LEVELS.map((level) => {
          const selected = value === level;
          return (
            <TouchableOpacity
              key={`${label}-${level}`}
              style={[
                styles.sudsChip,
                {
                  backgroundColor: selected ? colors.primary : colors.glassFill,
                  borderColor: selected ? colors.primary : colors.accentLineSoft,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(level);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.sudsChipText,
                  { color: selected ? colors.textOnPrimary : colors.textSecondary },
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderCreatePanel = () => (
    <View style={techniqueScreenStyles.card}>
      <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.GOAL_LABEL}</Text>
      <TextInput
        style={techniqueScreenStyles.textInput}
        placeholder={TEXTS.GOAL_PLACEHOLDER}
        placeholderTextColor={colors.textSecondary}
        value={title}
        onChangeText={setTitle}
        accessibilityLabel={TEXTS.GOAL_LABEL}
      />
      <Text style={[techniqueScreenStyles.formSectionHeading, { marginTop: SPACING.md }]}>
        {TEXTS.STEPS_LABEL}
      </Text>
      {draftSteps.map((step, index) => (
        <View key={`draft-${index}`} style={styles.stepDraftRow}>
          <Text style={[styles.stepIndexLabel, { color: colors.textSecondary }]}>
            {index + 1}.
          </Text>
          <TextInput
            style={[techniqueScreenStyles.textInput, styles.stepDraftInput]}
            placeholder={TEXTS.STEP_PLACEHOLDER}
            placeholderTextColor={colors.textSecondary}
            value={step}
            onChangeText={(v) => updateDraftStep(index, v)}
            accessibilityLabel={`${TEXTS.STEPS_LABEL} ${index + 1}`}
          />
          {draftSteps.length > MIN_STEPS ? (
            <TouchableOpacity
              onPress={() => removeDraftStep(index)}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.REMOVE_STEP}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
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
          techniqueScreenStyles.primaryButton,
          { backgroundColor: colors.primary, marginTop: SPACING.md, opacity: saving ? 0.7 : 1 },
        ]}
        onPress={handleSavePlan}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Text style={[techniqueScreenStyles.primaryButtonText, { color: colors.textOnPrimary }]}>
            {TEXTS.SAVE_PLAN}
          </Text>
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
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.NO_PLANS}</Text>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.planTabs}
          contentContainerStyle={styles.planTabsContent}
        >
          {plans.map((plan) => {
            const selected = plan._id === activePlanId;
            return (
              <TouchableOpacity
                key={plan._id}
                style={[
                  styles.planTab,
                  {
                    backgroundColor: selected ? colors.primary : colors.glassFill,
                    borderColor: selected ? colors.primary : colors.accentLineSoft,
                  },
                ]}
                onPress={() => setActivePlanId(plan._id)}
              >
                <Text
                  style={[
                    styles.planTabText,
                    { color: selected ? colors.textOnPrimary : colors.text },
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
            <Text style={techniqueScreenStyles.cardMeta}>
              {TEXTS.CURRENT_STEP} · {TEXTS.STEP_OF}{' '}
              {(activePlan.currentStepIndex ?? 0) + 1} {TEXTS.OF} {activePlan.steps.length}
            </Text>
            <Text style={techniqueScreenStyles.formSectionHeading}>
              {currentStep.description}
            </Text>
            <Text style={techniqueScreenStyles.formHint}>
              {(currentStep.attempts?.length || 0)} {TEXTS.ATTEMPTS}
            </Text>
            {renderSudsPicker(TEXTS.PEAK_SUDS, peakSuds, setPeakSuds)}
            {renderSudsPicker(TEXTS.END_SUDS, endSuds, setEndSuds)}
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.NOTES_LABEL}</Text>
            <TextInput
              style={[techniqueScreenStyles.textInput, { minHeight: 72 }]}
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
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[techniqueScreenStyles.primaryButton, { opacity: loggingAttempt ? 0.7 : 1 }]}
                onPress={handleLogAttempt}
                disabled={loggingAttempt}
              >
                {loggingAttempt ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.LOG_ATTEMPT}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  techniqueScreenStyles.primaryButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: completingStep || !canCompleteStep ? 0.5 : 1,
                  },
                ]}
                onPress={handleCompleteStep}
                disabled={completingStep || !canCompleteStep}
              >
                {completingStep ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text
                    style={[
                      techniqueScreenStyles.primaryButtonText,
                      { color: colors.textOnPrimary },
                    ]}
                  >
                    {TEXTS.COMPLETE_STEP}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : activePlan && allStepsCompleted ? (
          <View style={techniqueScreenStyles.card}>
            <Text style={techniqueScreenStyles.introTitle}>{TEXTS.ALL_DONE}</Text>
            <Text style={techniqueScreenStyles.formHint}>{activePlan.title}</Text>
          </View>
        ) : null}

        <View style={techniqueScreenStyles.card}>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.RECENT_TITLE}</Text>
          {plans.map((plan) => (
            <View key={`list-${plan._id}`} style={styles.planListItem}>
              <View style={styles.planListBody}>
                <Text style={techniqueScreenStyles.formSectionHeading}>{plan.title}</Text>
                <Text style={techniqueScreenStyles.formHint}>
                  {formatPlanDate(plan.updatedAt)} ·{' '}
                  {TEXTS.STEP_OF} {(plan.currentStepIndex ?? 0) + 1} {TEXTS.OF}{' '}
                  {plan.steps?.length || 0}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(plan._id)}
                accessibilityRole="button"
                accessibilityLabel={TEXTS.DELETE_A11Y}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}
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

          <View style={styles.modeRow}>
            {['create', 'practice'].map((tab) => {
              const active = mode === tab;
              const label = tab === 'create' ? TEXTS.TAB_CREATE : TEXTS.TAB_PRACTICE;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.modeTab,
                    {
                      backgroundColor: active ? colors.primary : colors.glassFill,
                      borderColor: active ? colors.primary : colors.accentLineSoft,
                    },
                  ]}
                  onPress={() => setMode(tab)}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      { color: active ? colors.textOnPrimary : colors.text },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === 'create' ? renderCreatePanel() : renderPracticePanel()}

          <View style={styles.exportBlock}>
            <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.EXPORT}</Text>
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.EXPORT_HINT}</Text>
            <TouchableOpacity
              style={techniqueScreenStyles.primaryButton}
              onPress={handleExport}
              disabled={exporting || plans.length === 0}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.EXPORT}</Text>
              )}
            </TouchableOpacity>
          </View>
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
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modeTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeTabText: { fontSize: 14, fontWeight: '600' },
  stepDraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  stepIndexLabel: { width: 24, fontWeight: '600' },
  stepDraftInput: { flex: 1 },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  addStepText: { fontSize: 14, fontWeight: '600' },
  validationText: { marginTop: SPACING.sm, fontSize: 14 },
  sudsBlock: { marginTop: SPACING.sm },
  sudsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.xs,
  },
  sudsChip: {
    minWidth: 44,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sudsChipText: { fontSize: 12, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  planTabs: { marginBottom: SPACING.md, maxHeight: 48 },
  planTabsContent: { gap: SPACING.sm, paddingRight: SPACING.md },
  planTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
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
  exportBlock: { marginTop: SPACING.lg, marginBottom: SPACING.xxl },
});

export default ExposureHierarchyScreen;
