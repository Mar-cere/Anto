/**
 * Activación conductual (#88): actividad + ánimo antes/después.
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

const STEPS = ['1', '2', '3'];
const MOOD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
  RECENT_EMPTY: 'Aún no hay registros. Completa el wizard arriba.',
  EXPORT: 'Exportar resumen',
  EXPORT_HINT: 'Texto para compartir con tu terapeuta.',
  DELETE_A11Y: 'Eliminar registro',
  STEP_PROGRESS: 'Paso',
  OF: 'de',
  VALIDATION_ACTIVITY: 'Describe la actividad antes de continuar.',
  MOOD_DELTA: 'Cambio de ánimo',
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
      RECENT_EMPTY: translated?.BA_RECENT_EMPTY || DEFAULT_TEXTS.RECENT_EMPTY,
      EXPORT: translated?.BA_EXPORT || DEFAULT_TEXTS.EXPORT,
      EXPORT_HINT: translated?.BA_EXPORT_HINT || DEFAULT_TEXTS.EXPORT_HINT,
      DELETE_A11Y: translated?.BA_DELETE_A11Y || DEFAULT_TEXTS.DELETE_A11Y,
      STEP_PROGRESS: translated?.BA_STEP_PROGRESS || DEFAULT_TEXTS.STEP_PROGRESS,
      OF: translated?.BA_OF || DEFAULT_TEXTS.OF,
      VALIDATION_ACTIVITY:
        translated?.BA_VALIDATION_ACTIVITY || DEFAULT_TEXTS.VALIDATION_ACTIVITY,
      MOOD_DELTA: translated?.BA_MOOD_DELTA || DEFAULT_TEXTS.MOOD_DELTA,
    }),
    [translated],
  );

  const navigation = useNavigation();
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
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

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
        navRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
        typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
        typeChip: {
          flex: 1,
          paddingVertical: SPACING.sm,
          borderRadius: 12,
          borderWidth: 1,
          alignItems: 'center',
        },
        typeChipText: { fontSize: 13, fontWeight: '600' },
        moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.xs },
        moodChip: {
          minWidth: 36,
          paddingVertical: 6,
          paddingHorizontal: 4,
          borderRadius: 8,
          borderWidth: 1,
          alignItems: 'center',
        },
        moodChipText: { fontSize: 12, fontWeight: '600' },
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
      }),
    [colors],
  );

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const response = await api.get(ENDPOINTS.BEHAVIORAL_ACTIVATION_LOGS);
      if (response?.success && Array.isArray(response.records)) {
        setRecords(response.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error cargando registros BA:', err);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setActivityDescription('');
    setActivityType('pleasant');
    setMoodBefore(4);
    setMoodAfter(5);
    setNotes('');
    setValidationMessage('');
  }, []);

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
        resetWizard();
        await loadRecords();
      } else {
        showToast(response?.error || TEXTS.TOAST_ERROR);
      }
    } catch (err) {
      console.error('Error guardando registro BA:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(ENDPOINTS.BEHAVIORAL_ACTIVATION_LOG_BY_ID(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(TEXTS.TOAST_DELETED);
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Error eliminando registro BA:', err);
      showToast(TEXTS.TOAST_ERROR);
    }
  };

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

  const renderMoodPicker = (label, value, onChange) => (
    <View style={{ marginTop: SPACING.sm }}>
      <Text style={techniqueScreenStyles.formSectionHeading}>{label}</Text>
      <View style={styles.moodRow}>
        {MOOD_OPTIONS.map((level) => {
          const selected = value === level;
          return (
            <TouchableOpacity
              key={`${label}-${level}`}
              style={[
                styles.moodChip,
                {
                  backgroundColor: selected ? colors.primary : colors.glassFill,
                  borderColor: selected ? colors.primary : colors.accentLineSoft,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(level);
              }}
            >
              <Text
                style={[
                  styles.moodChipText,
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

  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP1_TITLE}</Text>
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP1_HINT}</Text>
          <View style={styles.typeRow}>
            {[
              { id: 'pleasant', label: TEXTS.TYPE_PLEASANT },
              { id: 'routine', label: TEXTS.TYPE_ROUTINE },
            ].map(({ id, label }) => {
              const selected = activityType === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.glassFill,
                      borderColor: selected ? colors.primary : colors.accentLineSoft,
                    },
                  ]}
                  onPress={() => setActivityType(id)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: selected ? colors.textOnPrimary : colors.textPrimary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={[techniqueScreenStyles.textInput, { minHeight: 88 }]}
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
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP2_HINT}</Text>
          {renderMoodPicker(TEXTS.STEP2_TITLE, moodBefore, setMoodBefore)}
        </>
      );
    }
    return (
      <>
        <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP3_HINT}</Text>
        {renderMoodPicker(TEXTS.STEP3_TITLE, moodAfter, setMoodAfter)}
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
            <View style={styles.navRow}>
              <TouchableOpacity style={techniqueScreenStyles.primaryButton} onPress={goBack}>
                <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.BACK}</Text>
              </TouchableOpacity>
              {stepIndex < STEPS.length - 1 ? (
                <TouchableOpacity
                  style={[techniqueScreenStyles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={goNext}
                >
                  <Text
                    style={[
                      techniqueScreenStyles.primaryButtonText,
                      { color: colors.textOnPrimary },
                    ]}
                  >
                    {TEXTS.NEXT}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    techniqueScreenStyles.primaryButton,
                    { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Text
                      style={[
                        techniqueScreenStyles.primaryButtonText,
                        { color: colors.textOnPrimary },
                      ]}
                    >
                      {TEXTS.SAVE}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={techniqueScreenStyles.card}>
            <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.RECENT_TITLE}</Text>
            {loadingRecords ? (
              <ActivityIndicator color={colors.primary} />
            ) : records.length === 0 ? (
              <Text style={techniqueScreenStyles.formHint}>{TEXTS.RECENT_EMPTY}</Text>
            ) : (
              records.slice(0, 10).map((record) => {
                const delta = (record.moodAfter ?? 0) - (record.moodBefore ?? 0);
                const deltaLabel = delta > 0 ? `+${delta}` : String(delta);
                return (
                  <View key={record._id} style={styles.recordItem}>
                    <View style={styles.recordBody}>
                      <Text style={techniqueScreenStyles.formSectionHeading}>
                        {record.activityDescription}
                      </Text>
                      <Text style={techniqueScreenStyles.formHint}>
                        {formatEntryDate(record.entryDate)} · {record.moodBefore}→
                        {record.moodAfter} ({TEXTS.MOOD_DELTA} {deltaLabel})
                      </Text>
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
                );
              })
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
                <ActivityIndicator size="small" color={colors.textPrimary} />
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

export default BehavioralActivationScreen;
