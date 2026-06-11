/**
 * Registro de pensamiento automático (#89): situación + cognición + distorsión.
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
import { confirmDestructiveAction } from '../../utils/confirmDestructiveAction';
import { parseAtRecordRouteParams } from '../../utils/atRecordPrefill';
import IntensityScalePicker from '../../components/techniques/IntensityScalePicker';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const STEPS = ['1', '2', '3'];

const DEFAULT_TEXTS = {
  TITLE: 'Pensamiento automático',
  INTRO_KICKER: 'TCC',
  INTRO_TITLE: 'Analiza un pensamiento difícil',
  INTRO_BODY:
    'Anota qué pasó, qué pensaste y qué patrón notas. Opcionalmente, formula una versión más equilibrada.',
  STEP1_TITLE: 'Situación',
  STEP1_HINT: '¿Qué estaba pasando cuando apareció el pensamiento?',
  STEP1_PLACEHOLDER: 'Ejemplo: discutí con mi pareja por un mensaje',
  STEP1_THOUGHT: 'Pensamiento automático',
  STEP1_THOUGHT_HINT: 'Escríbelo tal como apareció, sin juzgarlo.',
  STEP1_THOUGHT_PLACEHOLDER: 'Ejemplo: nunca voy a poder arreglarlo',
  STEP2_TITLE: 'Emoción',
  STEP2_HINT: '¿Qué sentiste? (opcional)',
  STEP2_PLACEHOLDER: 'Ejemplo: tristeza, ansiedad…',
  STEP2_INTENSITY: 'Intensidad (1–10)',
  STEP3_TITLE: '¿Qué patrón notas?',
  STEP3_HINT: 'Elige el que más se parezca (opcional).',
  STEP3_LOADING: 'Cargando opciones…',
  STEP3_BALANCED: 'Pensamiento alternativo (opcional)',
  STEP3_BALANCED_PLACEHOLDER: 'Una versión más equilibrada del pensamiento…',
  STEP3_NOTES: 'Notas (opcional)',
  STEP3_NOTES_PLACEHOLDER: 'Qué notaste al revisar el pensamiento…',
  NEXT: 'Siguiente',
  BACK: 'Atrás',
  SAVE: 'Guardar registro',
  SAVING: 'Guardando…',
  TOAST_SAVED: 'Pensamiento registrado',
  TOAST_ERROR: 'No se pudo guardar. Intenta de nuevo.',
  TOAST_DELETED: 'Registro eliminado',
  TOAST_EXPORT_ERROR: 'No se pudo exportar',
  RECENT_TITLE: 'Registros recientes',
  RECENT_EMPTY: 'Aún no hay registros. Completa el wizard arriba.',
  EXPORT: 'Exportar resumen',
  EXPORT_HINT: 'Texto para compartir con tu terapeuta.',
  DELETE_A11Y: 'Eliminar registro',
  DELETE_CONFIRM_TITLE: 'Eliminar registro de pensamiento',
  DELETE_CONFIRM_MESSAGE:
    'Este registro se eliminará permanentemente. Esta acción no se puede deshacer.',
  DELETE_CANCEL: 'Cancelar',
  DELETE_CONFIRM: 'Eliminar',
  STEP_PROGRESS: 'Paso',
  OF: 'de',
  VALIDATION_SITUATION: 'Describe la situación antes de continuar.',
  VALIDATION_THOUGHT: 'Escribe el pensamiento automático antes de continuar.',
  PREFILL_HINT:
    'Sugerencia a partir de tu mensaje en el chat. Puedes editarla antes de continuar.',
  PREFILL_DISTORTION_HINT: 'Patrón sugerido desde el chat (puedes cambiarlo).',
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

const AutomaticThoughtRecordScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.AT_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.AT_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.AT_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY: translated?.AT_INTRO_BODY || DEFAULT_TEXTS.INTRO_BODY,
      STEP1_TITLE: translated?.AT_STEP1_TITLE || DEFAULT_TEXTS.STEP1_TITLE,
      STEP1_HINT: translated?.AT_STEP1_HINT || DEFAULT_TEXTS.STEP1_HINT,
      STEP1_PLACEHOLDER: translated?.AT_STEP1_PLACEHOLDER || DEFAULT_TEXTS.STEP1_PLACEHOLDER,
      STEP1_THOUGHT: translated?.AT_STEP1_THOUGHT || DEFAULT_TEXTS.STEP1_THOUGHT,
      STEP1_THOUGHT_HINT: translated?.AT_STEP1_THOUGHT_HINT || DEFAULT_TEXTS.STEP1_THOUGHT_HINT,
      STEP1_THOUGHT_PLACEHOLDER:
        translated?.AT_STEP1_THOUGHT_PLACEHOLDER || DEFAULT_TEXTS.STEP1_THOUGHT_PLACEHOLDER,
      STEP2_TITLE: translated?.AT_STEP2_TITLE || DEFAULT_TEXTS.STEP2_TITLE,
      STEP2_HINT: translated?.AT_STEP2_HINT || DEFAULT_TEXTS.STEP2_HINT,
      STEP2_PLACEHOLDER: translated?.AT_STEP2_PLACEHOLDER || DEFAULT_TEXTS.STEP2_PLACEHOLDER,
      STEP2_INTENSITY: translated?.AT_STEP2_INTENSITY || DEFAULT_TEXTS.STEP2_INTENSITY,
      STEP3_TITLE: translated?.AT_STEP3_TITLE || DEFAULT_TEXTS.STEP3_TITLE,
      STEP3_HINT: translated?.AT_STEP3_HINT || DEFAULT_TEXTS.STEP3_HINT,
      STEP3_LOADING: translated?.AT_STEP3_LOADING || DEFAULT_TEXTS.STEP3_LOADING,
      STEP3_BALANCED: translated?.AT_STEP3_BALANCED || DEFAULT_TEXTS.STEP3_BALANCED,
      STEP3_BALANCED_PLACEHOLDER:
        translated?.AT_STEP3_BALANCED_PLACEHOLDER || DEFAULT_TEXTS.STEP3_BALANCED_PLACEHOLDER,
      STEP3_NOTES: translated?.AT_STEP3_NOTES || DEFAULT_TEXTS.STEP3_NOTES,
      STEP3_NOTES_PLACEHOLDER:
        translated?.AT_STEP3_NOTES_PLACEHOLDER || DEFAULT_TEXTS.STEP3_NOTES_PLACEHOLDER,
      NEXT: translated?.AT_NEXT || DEFAULT_TEXTS.NEXT,
      BACK: translated?.AT_BACK || DEFAULT_TEXTS.BACK,
      SAVE: translated?.AT_SAVE || DEFAULT_TEXTS.SAVE,
      SAVING: translated?.AT_SAVING || DEFAULT_TEXTS.SAVING,
      TOAST_SAVED: translated?.AT_TOAST_SAVED || DEFAULT_TEXTS.TOAST_SAVED,
      TOAST_ERROR: translated?.AT_TOAST_ERROR || DEFAULT_TEXTS.TOAST_ERROR,
      TOAST_DELETED: translated?.AT_TOAST_DELETED || DEFAULT_TEXTS.TOAST_DELETED,
      TOAST_EXPORT_ERROR: translated?.AT_TOAST_EXPORT_ERROR || DEFAULT_TEXTS.TOAST_EXPORT_ERROR,
      RECENT_TITLE: translated?.AT_RECENT_TITLE || DEFAULT_TEXTS.RECENT_TITLE,
      RECENT_EMPTY: translated?.AT_RECENT_EMPTY || DEFAULT_TEXTS.RECENT_EMPTY,
      EXPORT: translated?.AT_EXPORT || DEFAULT_TEXTS.EXPORT,
      EXPORT_HINT: translated?.AT_EXPORT_HINT || DEFAULT_TEXTS.EXPORT_HINT,
      DELETE_A11Y: translated?.AT_DELETE_A11Y || DEFAULT_TEXTS.DELETE_A11Y,
      DELETE_CONFIRM_TITLE:
        translated?.AT_DELETE_CONFIRM_TITLE || DEFAULT_TEXTS.DELETE_CONFIRM_TITLE,
      DELETE_CONFIRM_MESSAGE:
        translated?.AT_DELETE_CONFIRM_MESSAGE || DEFAULT_TEXTS.DELETE_CONFIRM_MESSAGE,
      DELETE_CANCEL: translated?.TCC_DELETE_CANCEL || DEFAULT_TEXTS.DELETE_CANCEL,
      DELETE_CONFIRM: translated?.TCC_DELETE_CONFIRM || DEFAULT_TEXTS.DELETE_CONFIRM,
      STEP_PROGRESS: translated?.AT_STEP_PROGRESS || DEFAULT_TEXTS.STEP_PROGRESS,
      OF: translated?.AT_OF || DEFAULT_TEXTS.OF,
      VALIDATION_SITUATION:
        translated?.AT_VALIDATION_SITUATION || DEFAULT_TEXTS.VALIDATION_SITUATION,
      VALIDATION_THOUGHT:
        translated?.AT_VALIDATION_THOUGHT || DEFAULT_TEXTS.VALIDATION_THOUGHT,
      PREFILL_HINT: translated?.AT_PREFILL_HINT || DEFAULT_TEXTS.PREFILL_HINT,
      PREFILL_DISTORTION_HINT:
        translated?.AT_PREFILL_DISTORTION_HINT || DEFAULT_TEXTS.PREFILL_DISTORTION_HINT,
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
  const [situation, setSituation] = useState('');
  const [automaticThought, setAutomaticThought] = useState('');
  const [emotion, setEmotion] = useState('');
  const [emotionIntensity, setEmotionIntensity] = useState(5);
  const [distortionType, setDistortionType] = useState('');
  const [distortionName, setDistortionName] = useState('');
  const [balancedThought, setBalancedThought] = useState('');
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const [distortionTypes, setDistortionTypes] = useState([]);
  const [loadingDistortions, setLoadingDistortions] = useState(true);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fromChatSituationPrefill, setFromChatSituationPrefill] = useState(false);
  const [fromChatThoughtPrefill, setFromChatThoughtPrefill] = useState(false);
  const [fromChatDistortionPrefill, setFromChatDistortionPrefill] = useState(false);
  const handledChatPrefillKeyRef = useRef('');
  const handledResetAtRef = useRef(null);

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
        distortionRow: { marginTop: SPACING.sm },
        distortionOption: {
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          marginBottom: 8,
        },
        distortionOptionLabel: { fontSize: 15, fontWeight: '600' },
        distortionOptionHint: { fontSize: 13, marginTop: 2 },
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

  const loadDistortionTypes = useCallback(async (suggestedTypes = []) => {
    setLoadingDistortions(true);
    try {
      const query =
        suggestedTypes.length > 0
          ? `?${suggestedTypes.map((type) => `suggestedType=${encodeURIComponent(type)}`).join('&')}`
          : '';
      const response = await api.get(`${ENDPOINTS.AUTOMATIC_THOUGHT_DISTORTION_OPTIONS}${query}`);
      if (Array.isArray(response?.options)) {
        setDistortionTypes(response.options);
      } else {
        setDistortionTypes([]);
      }
    } catch (err) {
      console.error('Error cargando patrones AT:', err);
      setDistortionTypes([]);
    } finally {
      setLoadingDistortions(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const response = await api.get(ENDPOINTS.AUTOMATIC_THOUGHT_LOGS);
      if (response?.success && Array.isArray(response.records)) {
        setRecords(response.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error cargando registros AT:', err);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    loadDistortionTypes();
    loadRecords();
  }, [loadDistortionTypes, loadRecords]);

  useEffect(() => {
    if (!fromChatDistortionPrefill || !distortionType) return;
    loadDistortionTypes([distortionType]);
  }, [fromChatDistortionPrefill, distortionType, loadDistortionTypes]);

  const resolveDistortionPayload = useCallback(() => {
    if (!distortionType) {
      return { distortionType: '', distortionName: '' };
    }
    const match = distortionTypes.find((item) => item.type === distortionType);
    if (!match) {
      return { distortionType: '', distortionName: '' };
    }
    return {
      distortionType: match.type,
      distortionName: (distortionName || match.label || '').trim(),
    };
  }, [distortionType, distortionName, distortionTypes]);

  useEffect(() => {
    if (!distortionType || distortionTypes.length === 0) return;
    const match = distortionTypes.find((item) => item.type === distortionType);
    if (!match) {
      setDistortionType('');
      setDistortionName('');
      setFromChatDistortionPrefill(false);
      return;
    }
    if (!distortionName && match.label) {
      setDistortionName(match.label);
    }
  }, [distortionType, distortionName, distortionTypes]);

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setSituation('');
    setAutomaticThought('');
    setEmotion('');
    setEmotionIntensity(5);
    setDistortionType('');
    setDistortionName('');
    setBalancedThought('');
    setNotes('');
    setValidationMessage('');
    setFromChatSituationPrefill(false);
    setFromChatThoughtPrefill(false);
    setFromChatDistortionPrefill(false);
    handledChatPrefillKeyRef.current = '';
  }, []);

  const applyRoutePrefill = useCallback(
    (params) => {
      const raw = params && typeof params === 'object' ? params : {};
      if (raw.resetFormAt != null && handledResetAtRef.current !== raw.resetFormAt) {
        handledResetAtRef.current = raw.resetFormAt;
        handledChatPrefillKeyRef.current = '';
        resetWizard();
        return;
      }

      const parsed = parseAtRecordRouteParams(raw);
      if (
        !parsed.fromChat ||
        (!parsed.prefillSituation &&
          !parsed.prefillAutomaticThought &&
          parsed.prefillEmotionIntensity == null &&
          !parsed.prefillDistortionType)
      ) {
        if (raw.fromChat === false) {
          setFromChatSituationPrefill(false);
          setFromChatThoughtPrefill(false);
          setFromChatDistortionPrefill(false);
        }
        return;
      }

      const prefillKey = `${parsed.prefillSituation}|${parsed.prefillAutomaticThought}|${parsed.prefillEmotionIntensity}|${parsed.prefillDistortionType}`;
      if (prefillKey === handledChatPrefillKeyRef.current) return;
      handledChatPrefillKeyRef.current = prefillKey;
      handledResetAtRef.current = null;

      if (parsed.prefillSituation) {
        setSituation(parsed.prefillSituation);
        setFromChatSituationPrefill(true);
      } else {
        setFromChatSituationPrefill(false);
      }
      if (parsed.prefillAutomaticThought) {
        setAutomaticThought(parsed.prefillAutomaticThought);
        setFromChatThoughtPrefill(true);
      } else {
        setFromChatThoughtPrefill(false);
      }
      if (parsed.prefillEmotionIntensity != null) {
        setEmotionIntensity(parsed.prefillEmotionIntensity);
      }
      if (parsed.prefillDistortionType) {
        setDistortionType(parsed.prefillDistortionType);
        setDistortionName(parsed.prefillDistortionName || '');
        setFromChatDistortionPrefill(true);
      } else {
        setFromChatDistortionPrefill(false);
      }
      setStepIndex(0);
    },
    [resetWizard],
  );

  useFocusEffect(
    useCallback(() => {
      applyRoutePrefill(route.params);
    }, [applyRoutePrefill, route.params]),
  );

  const selectDistortion = (item) => {
    Haptics.selectionAsync().catch(() => {});
    if (distortionType === item.type) {
      setDistortionType('');
      setDistortionName('');
      return;
    }
    setDistortionType(item.type);
    setDistortionName(item.label || '');
    setFromChatDistortionPrefill(false);
  };

  const goNext = () => {
    setValidationMessage('');
    if (stepIndex === 0) {
      if (!situation.trim()) {
        setValidationMessage(TEXTS.VALIDATION_SITUATION);
        return;
      }
      if (!automaticThought.trim()) {
        setValidationMessage(TEXTS.VALIDATION_THOUGHT);
        return;
      }
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
    if (!situation.trim() || !automaticThought.trim()) {
      setValidationMessage(
        !situation.trim() ? TEXTS.VALIDATION_SITUATION : TEXTS.VALIDATION_THOUGHT,
      );
      return;
    }
    setSaving(true);
    try {
      const distortion = resolveDistortionPayload();
      const response = await api.post(ENDPOINTS.AUTOMATIC_THOUGHT_LOGS, {
        situation: situation.trim(),
        automaticThought: automaticThought.trim(),
        emotion: emotion.trim(),
        emotionIntensity,
        distortionType: distortion.distortionType,
        distortionName: distortion.distortionName,
        balancedThought: balancedThought.trim(),
        notes: notes.trim(),
      });
      if (response?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_SAVED);
        recordInterventionCompleted('automatic_thought_record');
        resetWizard();
        await loadRecords();
      } else {
        showToast(response?.error || TEXTS.TOAST_ERROR);
      }
    } catch (err) {
      console.error('Error guardando registro AT:', err);
      showToast(TEXTS.TOAST_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const performDelete = useCallback(
    async (id) => {
      try {
        await api.delete(ENDPOINTS.AUTOMATIC_THOUGHT_LOG_BY_ID(id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(TEXTS.TOAST_DELETED);
        setRecords((prev) => prev.filter((r) => r._id !== id));
      } catch (err) {
        console.error('Error eliminando registro AT:', err);
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
      const response = await api.get(ENDPOINTS.AUTOMATIC_THOUGHT_LOGS_EXPORT);
      const text = response?.exportText;
      if (!text) {
        showToast(TEXTS.TOAST_EXPORT_ERROR);
        return;
      }
      await Share.share({ message: text });
    } catch (err) {
      console.error('Error exportando registros AT:', err);
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
          {fromChatSituationPrefill || fromChatThoughtPrefill ? (
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.PREFILL_HINT}</Text>
          ) : null}
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP1_HINT}</Text>
          <TextInput
            style={[techniqueScreenStyles.textInput, { minHeight: 72 }]}
            placeholder={TEXTS.STEP1_PLACEHOLDER}
            placeholderTextColor={colors.textSecondary}
            value={situation}
            onChangeText={(value) => {
              setSituation(value);
              setFromChatSituationPrefill(false);
            }}
            multiline
            textAlignVertical="top"
          />
          <Text style={[techniqueScreenStyles.formSectionHeading, { marginTop: SPACING.md }]}>
            {TEXTS.STEP1_THOUGHT}
          </Text>
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP1_THOUGHT_HINT}</Text>
          <TextInput
            style={[techniqueScreenStyles.textInput, { minHeight: 88 }]}
            placeholder={TEXTS.STEP1_THOUGHT_PLACEHOLDER}
            placeholderTextColor={colors.textSecondary}
            value={automaticThought}
            onChangeText={(value) => {
              setAutomaticThought(value);
              setFromChatThoughtPrefill(false);
            }}
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
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP2_HINT}</Text>
          <TextInput
            style={techniqueScreenStyles.textInput}
            placeholder={TEXTS.STEP2_PLACEHOLDER}
            placeholderTextColor={colors.textSecondary}
            value={emotion}
            onChangeText={setEmotion}
          />
          <IntensityScalePicker
            label={TEXTS.STEP2_INTENSITY}
            value={emotionIntensity}
            onChange={setEmotionIntensity}
            accessibilityLabelPrefix={TEXTS.STEP2_INTENSITY}
            style={{ marginTop: SPACING.sm }}
          />
        </>
      );
    }
    return (
      <>
        <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.STEP3_TITLE}</Text>
        {fromChatDistortionPrefill ? (
          <Text style={techniqueScreenStyles.formHint}>{TEXTS.PREFILL_DISTORTION_HINT}</Text>
        ) : null}
        <Text style={techniqueScreenStyles.formHint}>{TEXTS.STEP3_HINT}</Text>
        {loadingDistortions ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: SPACING.sm }} />
        ) : (
          <View style={styles.distortionRow}>
            {distortionTypes.map((item) => {
              const selected = distortionType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.distortionOption,
                    {
                      backgroundColor: selected ? colors.accentLineSoft : colors.glassFill,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => selectDistortion(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                >
                  <Text
                    style={[
                      styles.distortionOptionLabel,
                      { color: selected ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.hint ? (
                    <Text
                      style={[
                        styles.distortionOptionHint,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.hint}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <Text style={[techniqueScreenStyles.formSectionHeading, { marginTop: SPACING.md }]}>
          {TEXTS.STEP3_BALANCED}
        </Text>
        <TextInput
          style={[techniqueScreenStyles.textInput, { minHeight: 72 }]}
          placeholder={TEXTS.STEP3_BALANCED_PLACEHOLDER}
          placeholderTextColor={colors.textSecondary}
          value={balancedThought}
          onChangeText={setBalancedThought}
          multiline
          textAlignVertical="top"
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
            {loadingRecords ? (
              <ActivityIndicator color={colors.primary} />
            ) : records.length === 0 ? (
              <Text style={techniqueScreenStyles.formHint}>{TEXTS.RECENT_EMPTY}</Text>
            ) : (
              records.slice(0, 10).map((record) => (
                <View key={record._id} style={styles.recordItem}>
                  <View style={styles.recordBody}>
                    <Text style={techniqueScreenStyles.formSectionHeading} numberOfLines={2}>
                      {record.automaticThought}
                    </Text>
                    <Text style={techniqueScreenStyles.formHint} numberOfLines={2}>
                      {formatEntryDate(record.entryDate)}
                      {record.distortionName ? ` · ${record.distortionName}` : ''}
                      {record.emotionIntensity != null ? ` · ${record.emotionIntensity}/10` : ''}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AutomaticThoughtRecordScreen;
