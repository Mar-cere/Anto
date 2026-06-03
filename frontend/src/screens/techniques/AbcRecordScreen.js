/**
 * Pantalla de Autorregistro ABC (#86).
 * Wizard A → B → C con persistencia en backend y exportación para revisión.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { parseAbcRecordRouteParams } from '../../utils/abcRecordPrefill';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const STEPS = ['A', 'B', 'C'];
const INTENSITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const DEFAULT_TEXTS = {
  TITLE: 'Autorregistro ABC',
  INTRO_KICKER: 'TCC',
  INTRO_TITLE: 'Observa la cadena situación → pensamiento → consecuencia',
  INTRO_BODY:
    'Tres pasos breves para identificar patrones. No busques la formulación perfecta: anota lo que ocurrió tal como lo recuerdas.',
  STEP_A_TITLE: 'A — Situación activadora',
  STEP_A_HINT: '¿Qué pasó? ¿Dónde estabas? ¿Con quién?',
  STEP_A_PLACEHOLDER: 'Ejemplo: Mi jefe me pidió entregar un informe en una hora.',
  STEP_B_TITLE: 'B — Pensamientos',
  STEP_B_HINT: '¿Qué pensaste en ese momento? Anota la frase tal como apareció.',
  STEP_B_PLACEHOLDER: 'Ejemplo: "Nunca voy a poder cumplir a tiempo."',
  STEP_C_TITLE: 'C — Consecuencias',
  STEP_C_EMOTION_HINT: '¿Qué emoción sentiste?',
  STEP_C_EMOTION_PLACEHOLDER: 'Ejemplo: ansiedad, enojo, tristeza…',
  STEP_C_INTENSITY_LABEL: 'Intensidad (1–10)',
  STEP_C_BEHAVIOR_HINT: '¿Qué hiciste o sentiste en el cuerpo?',
  STEP_C_BEHAVIOR_PLACEHOLDER: 'Ejemplo: me tensé, evité responder, me quedé en silencio.',
  NEXT: 'Siguiente',
  BACK: 'Atrás',
  SAVE: 'Guardar registro',
  SAVING: 'Guardando…',
  TOAST_SAVED: 'Registro guardado',
  TOAST_ERROR: 'No se pudo guardar. Intenta de nuevo.',
  TOAST_DELETED: 'Registro eliminado',
  TOAST_EXPORT_ERROR: 'No se pudo exportar',
  RECENT_TITLE: 'Registros recientes',
  RECENT_EMPTY: 'Aún no hay registros. Completa el wizard arriba.',
  EXPORT: 'Exportar resumen',
  EXPORT_HINT: 'Texto para compartir con tu terapeuta o revisar después.',
  DELETE_A11Y: 'Eliminar registro',
  STEP_PROGRESS: 'Paso',
  OF: 'de',
  VALIDATION_A: 'Describe la situación antes de continuar.',
  VALIDATION_B: 'Anota al menos un pensamiento antes de continuar.',
  PREFILL_HINT: 'Tomado de tu mensaje en el chat. Puedes editarlo antes de continuar.',
  PREFILL_HINT_B: 'Pensamiento detectado en tu mensaje. Ajusta la frase si hace falta.',
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

const AbcRecordScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.ABC_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.ABC_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.ABC_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY: translated?.ABC_INTRO_BODY || DEFAULT_TEXTS.INTRO_BODY,
      STEP_A_TITLE: translated?.ABC_STEP_A_TITLE || DEFAULT_TEXTS.STEP_A_TITLE,
      STEP_A_HINT: translated?.ABC_STEP_A_HINT || DEFAULT_TEXTS.STEP_A_HINT,
      STEP_A_PLACEHOLDER:
        translated?.ABC_STEP_A_PLACEHOLDER || DEFAULT_TEXTS.STEP_A_PLACEHOLDER,
      STEP_B_TITLE: translated?.ABC_STEP_B_TITLE || DEFAULT_TEXTS.STEP_B_TITLE,
      STEP_B_HINT: translated?.ABC_STEP_B_HINT || DEFAULT_TEXTS.STEP_B_HINT,
      STEP_B_PLACEHOLDER:
        translated?.ABC_STEP_B_PLACEHOLDER || DEFAULT_TEXTS.STEP_B_PLACEHOLDER,
      STEP_C_TITLE: translated?.ABC_STEP_C_TITLE || DEFAULT_TEXTS.STEP_C_TITLE,
      STEP_C_EMOTION_HINT:
        translated?.ABC_STEP_C_EMOTION_HINT || DEFAULT_TEXTS.STEP_C_EMOTION_HINT,
      STEP_C_EMOTION_PLACEHOLDER:
        translated?.ABC_STEP_C_EMOTION_PLACEHOLDER ||
        DEFAULT_TEXTS.STEP_C_EMOTION_PLACEHOLDER,
      STEP_C_INTENSITY_LABEL:
        translated?.ABC_STEP_C_INTENSITY_LABEL || DEFAULT_TEXTS.STEP_C_INTENSITY_LABEL,
      STEP_C_BEHAVIOR_HINT:
        translated?.ABC_STEP_C_BEHAVIOR_HINT || DEFAULT_TEXTS.STEP_C_BEHAVIOR_HINT,
      STEP_C_BEHAVIOR_PLACEHOLDER:
        translated?.ABC_STEP_C_BEHAVIOR_PLACEHOLDER ||
        DEFAULT_TEXTS.STEP_C_BEHAVIOR_PLACEHOLDER,
      NEXT: translated?.ABC_NEXT || DEFAULT_TEXTS.NEXT,
      BACK: translated?.ABC_BACK || DEFAULT_TEXTS.BACK,
      SAVE: translated?.ABC_SAVE || DEFAULT_TEXTS.SAVE,
      SAVING: translated?.ABC_SAVING || DEFAULT_TEXTS.SAVING,
      TOAST_SAVED: translated?.ABC_TOAST_SAVED || DEFAULT_TEXTS.TOAST_SAVED,
      TOAST_ERROR: translated?.ABC_TOAST_ERROR || DEFAULT_TEXTS.TOAST_ERROR,
      TOAST_DELETED: translated?.ABC_TOAST_DELETED || DEFAULT_TEXTS.TOAST_DELETED,
      TOAST_EXPORT_ERROR:
        translated?.ABC_TOAST_EXPORT_ERROR || DEFAULT_TEXTS.TOAST_EXPORT_ERROR,
      RECENT_TITLE: translated?.ABC_RECENT_TITLE || DEFAULT_TEXTS.RECENT_TITLE,
      RECENT_EMPTY: translated?.ABC_RECENT_EMPTY || DEFAULT_TEXTS.RECENT_EMPTY,
      EXPORT: translated?.ABC_EXPORT || DEFAULT_TEXTS.EXPORT,
      EXPORT_HINT: translated?.ABC_EXPORT_HINT || DEFAULT_TEXTS.EXPORT_HINT,
      DELETE_A11Y: translated?.ABC_DELETE_A11Y || DEFAULT_TEXTS.DELETE_A11Y,
      STEP_PROGRESS: translated?.ABC_STEP_PROGRESS || DEFAULT_TEXTS.STEP_PROGRESS,
      OF: translated?.ABC_OF || DEFAULT_TEXTS.OF,
      VALIDATION_A: translated?.ABC_VALIDATION_A || DEFAULT_TEXTS.VALIDATION_A,
      VALIDATION_B: translated?.ABC_VALIDATION_B || DEFAULT_TEXTS.VALIDATION_B,
      PREFILL_HINT: translated?.ABC_PREFILL_HINT || DEFAULT_TEXTS.PREFILL_HINT,
      PREFILL_HINT_B: translated?.ABC_PREFILL_HINT_B || DEFAULT_TEXTS.PREFILL_HINT_B,
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
  const [activatingEvent, setActivatingEvent] = useState('');
  const [beliefs, setBeliefs] = useState('');
  const [emotions, setEmotions] = useState('');
  const [emotionIntensity, setEmotionIntensity] = useState(5);
  const [consequence, setConsequence] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fromChatPrefill, setFromChatPrefill] = useState(false);
  const [fromChatPrefillB, setFromChatPrefillB] = useState(false);
  const handledResetAtRef = useRef(null);
  const handledChatPrefillKeyRef = useRef('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        keyboardView: {
          flex: 1,
        },
        scrollView: {
          flex: 1,
        },
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
        stepDotText: {
          fontSize: 14,
          fontWeight: '700',
        },
        stepConnector: {
          flex: 1,
          height: 2,
          borderRadius: 1,
          backgroundColor: colors.accentLineSoft,
        },
        navRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
          gap: 12,
        },
        validationText: {
          fontSize: 13,
          color: colors.error,
          marginBottom: 8,
        },
        intensityRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        },
        intensityChip: {
          minWidth: 36,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          alignItems: 'center',
        },
        intensityChipText: {
          fontSize: 14,
          fontWeight: '600',
        },
        recordCard: {
          marginBottom: 12,
        },
        recordMeta: {
          fontSize: 12,
          color: colors.textSecondary,
          marginBottom: 6,
        },
        recordSnippet: {
          fontSize: 14,
          color: colors.text,
          lineHeight: 20,
        },
        recordActions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 8,
        },
        exportBlock: {
          marginTop: 8,
          marginBottom: 20,
        },
      }),
    [colors],
  );

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setActivatingEvent('');
    setBeliefs('');
    setEmotions('');
    setEmotionIntensity(5);
    setConsequence('');
    setValidationMessage('');
    setFromChatPrefill(false);
    setFromChatPrefillB(false);
    handledChatPrefillKeyRef.current = '';
  }, []);

  const applyRoutePrefill = useCallback((params) => {
    const raw = params && typeof params === 'object' ? params : {};
    if (raw.resetFormAt != null && handledResetAtRef.current !== raw.resetFormAt) {
      handledResetAtRef.current = raw.resetFormAt;
      handledChatPrefillKeyRef.current = '';
      resetWizard();
      return;
    }

    const parsed = parseAbcRecordRouteParams(raw);
    if (!parsed.fromChat || (!parsed.prefillActivatingEvent && !parsed.prefillBeliefs)) {
      if (raw.fromChat === false) {
        setFromChatPrefill(false);
        setFromChatPrefillB(false);
      }
      return;
    }

    const prefillKey = `${parsed.prefillActivatingEvent}|${parsed.prefillBeliefs}`;
    if (prefillKey === handledChatPrefillKeyRef.current) return;
    handledChatPrefillKeyRef.current = prefillKey;
    handledResetAtRef.current = null;

    if (parsed.prefillActivatingEvent) {
      setActivatingEvent(parsed.prefillActivatingEvent);
      setFromChatPrefill(true);
    } else {
      setFromChatPrefill(false);
    }
    if (parsed.prefillBeliefs) {
      setBeliefs(parsed.prefillBeliefs);
      setFromChatPrefillB(true);
    } else {
      setFromChatPrefillB(false);
    }
    setStepIndex(0);
  }, [resetWizard]);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const response = await api.get(ENDPOINTS.ABC_RECORDS);
      if (response?.success && Array.isArray(response.records)) {
        setRecords(response.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error cargando registros ABC:', err);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useFocusEffect(
    useCallback(() => {
      applyRoutePrefill(route.params);
    }, [applyRoutePrefill, route.params]),
  );

  const goNext = () => {
    setValidationMessage('');
    if (stepIndex === 0 && !activatingEvent.trim()) {
      setValidationMessage(TEXTS.VALIDATION_A);
      return;
    }
    if (stepIndex === 1 && !beliefs.trim()) {
      setValidationMessage(TEXTS.VALIDATION_B);
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
    if (!activatingEvent.trim() || !beliefs.trim()) {
      setValidationMessage(
        !activatingEvent.trim() ? TEXTS.VALIDATION_A : TEXTS.VALIDATION_B,
      );
      return;
    }
    setSaving(true);
    try {
      const response = await api.post(ENDPOINTS.ABC_RECORDS, {
        activatingEvent: activatingEvent.trim(),
        beliefs: beliefs.trim(),
        emotions: emotions.trim(),
        emotionIntensity,
        consequence: consequence.trim(),
      });
      if (response?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_SAVED);
        recordInterventionCompleted('abc_record');
        resetWizard();
        await loadRecords();
      } else {
        showToast(response?.error || TEXTS.TOAST_ERROR);
      }
    } catch (err) {
      console.error('Error guardando registro ABC:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(ENDPOINTS.ABC_RECORD_BY_ID(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(TEXTS.TOAST_DELETED);
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Error eliminando registro ABC:', err);
      showToast(TEXTS.TOAST_ERROR);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(ENDPOINTS.ABC_RECORDS_EXPORT);
      const text = response?.exportText;
      if (!text) {
        showToast(TEXTS.TOAST_EXPORT_ERROR);
        return;
      }
      await Share.share({ message: text });
    } catch (err) {
      console.error('Error exportando registros ABC:', err);
      showToast(TEXTS.TOAST_EXPORT_ERROR);
    } finally {
      setExporting(false);
    }
  };

  const renderStepIndicator = () => (
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
  );

  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP_A_TITLE}</Text>
          {fromChatPrefill && stepIndex === 0 ? (
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.PREFILL_HINT}</Text>
          ) : null}
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP_A_HINT}</Text>
          <TextInput
            style={[techniqueScreenStyles.textInput, { minHeight: 100 }]}
            placeholder={TEXTS.STEP_A_PLACEHOLDER}
            placeholderTextColor={colors.textSecondary}
            value={activatingEvent}
            onChangeText={setActivatingEvent}
            multiline
            textAlignVertical="top"
            accessibilityLabel={TEXTS.STEP_A_TITLE}
          />
        </>
      );
    }
    if (stepIndex === 1) {
      return (
        <>
          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP_B_TITLE}</Text>
          {fromChatPrefillB && stepIndex === 1 ? (
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.PREFILL_HINT_B}</Text>
          ) : null}
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP_B_HINT}</Text>
          <TextInput
            style={[techniqueScreenStyles.textInput, { minHeight: 100 }]}
            placeholder={TEXTS.STEP_B_PLACEHOLDER}
            placeholderTextColor={colors.textSecondary}
            value={beliefs}
            onChangeText={setBeliefs}
            multiline
            textAlignVertical="top"
            accessibilityLabel={TEXTS.STEP_B_TITLE}
          />
        </>
      );
    }
    return (
      <>
        <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP_C_TITLE}</Text>
        <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP_C_EMOTION_HINT}</Text>
        <TextInput
          style={techniqueScreenStyles.textInput}
          placeholder={TEXTS.STEP_C_EMOTION_PLACEHOLDER}
          placeholderTextColor={colors.textSecondary}
          value={emotions}
          onChangeText={setEmotions}
          accessibilityLabel={TEXTS.STEP_C_EMOTION_HINT}
        />
        <Text style={[techniqueScreenStyles.formHint, { marginTop: 12 }]}>
          {TEXTS.STEP_C_INTENSITY_LABEL}
        </Text>
        <View style={styles.intensityRow}>
          {INTENSITY_OPTIONS.map((value) => {
            const selected = emotionIntensity === value;
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.intensityChip,
                  {
                    backgroundColor: selected ? colors.accentLineSoft : colors.glassFill,
                    borderColor: selected ? colors.primary : colors.accentLineSoft,
                  },
                ]}
                onPress={() => setEmotionIntensity(value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${TEXTS.STEP_C_INTENSITY_LABEL} ${value}`}
              >
                <Text
                  style={[
                    styles.intensityChipText,
                    { color: selected ? colors.primary : colors.text },
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP_C_BEHAVIOR_HINT}</Text>
        <TextInput
          style={[techniqueScreenStyles.textInput, { minHeight: 80 }]}
          placeholder={TEXTS.STEP_C_BEHAVIOR_PLACEHOLDER}
          placeholderTextColor={colors.textSecondary}
          value={consequence}
          onChangeText={setConsequence}
          multiline
          textAlignVertical="top"
          accessibilityLabel={TEXTS.STEP_C_BEHAVIOR_HINT}
        />
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
          </View>

          <View style={techniqueScreenStyles.card}>
            <Text style={techniqueScreenStyles.cardMeta}>
              {TEXTS.STEP_PROGRESS} {stepIndex + 1} {TEXTS.OF} {STEPS.length}
            </Text>
            {renderStepIndicator()}
            {validationMessage ? (
              <Text style={styles.validationText}>{validationMessage}</Text>
            ) : null}
            {renderStepContent()}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={techniqueScreenStyles.primaryButton}
                onPress={goBack}
                accessibilityRole="button"
              >
                <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.BACK}</Text>
              </TouchableOpacity>
              {stepIndex < STEPS.length - 1 ? (
                <TouchableOpacity
                  style={[
                    techniqueScreenStyles.primaryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={goNext}
                  accessibilityRole="button"
                >
                  <Text
                    style={[techniqueScreenStyles.primaryButtonText, { color: colors.textOnPrimary }]}
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
                  accessibilityRole="button"
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

          <View style={styles.exportBlock}>
            <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.EXPORT}</Text>
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.EXPORT_HINT}</Text>
            <TouchableOpacity
              style={techniqueScreenStyles.primaryButton}
              onPress={handleExport}
              disabled={exporting || records.length === 0}
              accessibilityRole="button"
            >
              <Text style={techniqueScreenStyles.primaryButtonText}>
                {exporting ? TEXTS.SAVING : TEXTS.EXPORT}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.RECENT_TITLE}</Text>
          {loadingRecords ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : records.length === 0 ? (
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.RECENT_EMPTY}</Text>
          ) : (
            records.map((record) => (
              <View
                key={record._id}
                style={[techniqueScreenStyles.card, styles.recordCard]}
              >
                <Text style={styles.recordMeta}>{formatEntryDate(record.entryDate)}</Text>
                <Text style={styles.recordSnippet} numberOfLines={3}>
                  <Text style={{ fontWeight: '600' }}>A: </Text>
                  {record.activatingEvent}
                </Text>
                <Text style={[styles.recordSnippet, { marginTop: 4 }]} numberOfLines={2}>
                  <Text style={{ fontWeight: '600' }}>B: </Text>
                  {record.beliefs}
                </Text>
                {(record.emotions || record.consequence) && (
                  <Text style={[styles.recordSnippet, { marginTop: 4 }]} numberOfLines={2}>
                    <Text style={{ fontWeight: '600' }}>C: </Text>
                    {[record.emotions, record.emotionIntensity ? `${record.emotionIntensity}/10` : null, record.consequence]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}
                <View style={styles.recordActions}>
                  <TouchableOpacity
                    onPress={() => handleDelete(record._id)}
                    accessibilityRole="button"
                    accessibilityLabel={TEXTS.DELETE_A11Y}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AbcRecordScreen;
