/**
 * Pantalla de Diario de Gratitud
 * Permite al usuario escribir y guardar entradas de gratitud
 */

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';
import { SPACING } from '../../constants/ui';
import {
  getGratitudeEntryDisplayText,
  sanitizeGratitudeEntriesFromStorage,
} from '../../utils/gratitudeJournalEntry';
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';
import GratitudeWritingPrompt from '../../components/gratitude/GratitudeWritingPrompt';

const GRATITUDE_ENTRIES_KEY = 'gratitudeJournalEntries';

const DEFAULT_TEXTS = {
  TITLE: 'Diario de Gratitud',
  INTRO_KICKER: 'Gratitud',
  INTRO_TITLE: 'Tres lineas, aqui y ahora',
  INTRO_BODY: 'Tres respuestas cortas. No busques perfeccion: busca presencia.',
  PRIVACY_LOCAL_ONLY: 'Solo en tu dispositivo',
  ENTRY_TITLE: 'Tu entrada',
  CLEAR_LINES: 'Limpiar',
  CLEAR_LINES_A11Y: 'Limpiar las tres lineas',
  TEMPLATE_INSERT_A11Y_PREFIX: 'Insertar plantilla:',
  TEMPLATE_INSERT_HINT: 'Anade el inicio de frase en la linea que tienes enfocada',
  TEMPLATE_CHIP_1_LABEL: 'Hoy agradezco…',
  TEMPLATE_CHIP_1_PREFIX: 'Hoy agradezco ',
  TEMPLATE_CHIP_2_LABEL: 'Me ayudó…',
  TEMPLATE_CHIP_2_PREFIX: 'Me ayudó ',
  TEMPLATE_CHIP_3_LABEL: 'Valoro…',
  TEMPLATE_CHIP_3_PREFIX: 'Valoro ',
  LINE_1_PLACEHOLDER: 'Algo que te hizo bien hoy',
  LINE_2_PLACEHOLDER: 'Una persona o gesto que valoras',
  LINE_3_PLACEHOLDER: 'Algo de ti que reconoces',
  SAVE_ENTRY_A11Y: 'Guardar entrada de gratitud',
  SAVE_ENTRY: 'Guardar',
  TOAST_SAVED: 'Quedo registrado',
  TOAST_DELETED: 'Entrada eliminada',
  UNDO: 'Deshacer',
  ENTRIES_TITLE: 'Entradas',
  ENTRIES_TODAY_TITLE: 'Hoy',
  FILTER_SHOW_ALL_A11Y: 'Mostrar todas las entradas',
  FILTER_SHOW_TODAY_A11Y: 'Mostrar solo entradas de hoy',
  FILTER_HINT: 'Filtra la lista por el dia actual',
  FILTER_TODAY_ONLY: 'Solo hoy',
  FILTER_EMPTY: 'No hay entradas hoy. Puedes escribir arriba o quitar el filtro.',
  DELETE_ENTRY_A11Y_PREFIX: 'Eliminar entrada del',
  DELETE_ENTRY_HINT: 'Elimina esta entrada. Puedes deshacer con el aviso que aparece despues.',
  EMPTY_TITLE: 'Cuando quieras, tres lineas bastan',
  EXAMPLE_1: 'Ejemplo: "Hoy agradezco el silencio de la manana."',
  EXAMPLE_2: 'Ejemplo: "Me ayudo que alguien me escuchara sin juzgar."',
  EXAMPLE_3: 'Ejemplo: "Valoro el descanso que pude tomar hoy."',
  WRITING_PROMPT_KICKER: 'Momento para ti',
  WRITING_PROMPT_ANOTHER: 'Otra frase',
  WRITING_PROMPT_A11Y: 'Frase para inspirar tu escritura',
  WRITING_PROMPT_HINT: 'Toca para mostrar otra frase',
};

function buildGratitudeTemplateChips(texts) {
  return [
    {
      id: 'c1',
      label: texts.TEMPLATE_CHIP_1_LABEL,
      prefix: texts.TEMPLATE_CHIP_1_PREFIX,
    },
    {
      id: 'c2',
      label: texts.TEMPLATE_CHIP_2_LABEL,
      prefix: texts.TEMPLATE_CHIP_2_PREFIX,
    },
    {
      id: 'c3',
      label: texts.TEMPLATE_CHIP_3_LABEL,
      prefix: texts.TEMPLATE_CHIP_3_PREFIX,
    },
  ];
}

function createStyles(colors, t) {
  return StyleSheet.create({
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
    todayMeta: {
      marginTop: 8,
      color: t.FOCUS_META,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
      textTransform: 'capitalize',
    },
    composerCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 22,
      padding: SPACING.CARD_INNER_INSET,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    privacyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: 10,
    },
    privacyText: {
      color: t.FOCUS_KICKER_COLOR,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    composerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    composerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    clearText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    templatesRow: {
      paddingVertical: 6,
      gap: SPACING.CARD_INNER_INSET,
    },
    templateChip: {
      borderRadius: 999,
      paddingHorizontal: SPACING.CHIP_INSET,
      paddingVertical: SPACING.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      backgroundColor: colors.glassFill,
    },
    templateChipText: {
      color: t.FOCUS_KICKER_COLOR,
      fontSize: 13,
      fontWeight: '700',
    },
    linesBlock: {
      marginTop: 10,
      gap: SPACING.CARD_INNER_INSET,
    },
    lineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      backgroundColor: colors.chromeInput,
      paddingHorizontal: SPACING.INPUT_INSET,
      paddingVertical: SPACING.sm,
    },
    linePrefix: {
      color: t.FOCUS_META,
      fontWeight: '800',
      marginRight: 8,
      minWidth: 22,
      textAlign: 'right',
    },
    lineInput: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 14,
      paddingVertical: 6,
    },
    composerFooter: {
      marginTop: 18,
      paddingTop: SPACING.xs,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      gap: SPACING.CHIP_INSET,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.CARD_INNER_INSET,
    },
    toggleLabel: {
      color: t.FOCUS_META,
      fontSize: 13,
      fontWeight: '700',
    },
    subtleIconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.CHIP_INSET,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
      backgroundColor: colors.glassFill,
    },
    subtleIconText: {
      color: t.FOCUS_KICKER_COLOR,
      fontWeight: '700',
      fontSize: 13,
    },
    entriesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      marginTop: 18,
    },
    entriesTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    entryCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 22,
      padding: SPACING.CARD_INNER_INSET,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      marginBottom: 12,
    },
    entryMeta: {
      color: t.FOCUS_META,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 10,
    },
    entryText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
    },
    entryActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
    },
    deleteButton: {
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.CHIP_INSET,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      backgroundColor: colors.glassFill,
    },
    deleteButtonText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
    },
    emptyStateCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 22,
      padding: SPACING.CARD_INNER_INSET,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      alignItems: 'center',
    },
    emptyStateTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateText: {
      color: t.FOCUS_META,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
  });
}

function isSameLocalDay(isoDate, refDate = new Date()) {
  try {
    const d = new Date(isoDate);
    return (
      d.getFullYear() === refDate.getFullYear() &&
      d.getMonth() === refDate.getMonth() &&
      d.getDate() === refDate.getDate()
    );
  } catch {
    return false;
  }
}

const GratitudeJournalScreen = () => {
  const { language } = useLanguage();
  const translated = useSectionTranslations('TECHNIQUES');
  const T = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE: translated?.GRATITUDE_TITLE ?? DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.GRATITUDE_INTRO_KICKER ?? DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.GRATITUDE_INTRO_TITLE ?? DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY: translated?.GRATITUDE_INTRO_BODY ?? DEFAULT_TEXTS.INTRO_BODY,
      PRIVACY_LOCAL_ONLY:
        translated?.GRATITUDE_PRIVACY_LOCAL_ONLY ?? DEFAULT_TEXTS.PRIVACY_LOCAL_ONLY,
      ENTRY_TITLE: translated?.GRATITUDE_ENTRY_TITLE ?? DEFAULT_TEXTS.ENTRY_TITLE,
      CLEAR_LINES: translated?.GRATITUDE_CLEAR_LINES ?? DEFAULT_TEXTS.CLEAR_LINES,
      CLEAR_LINES_A11Y:
        translated?.GRATITUDE_CLEAR_LINES_A11Y ?? DEFAULT_TEXTS.CLEAR_LINES_A11Y,
      TEMPLATE_INSERT_A11Y_PREFIX:
        translated?.GRATITUDE_TEMPLATE_INSERT_A11Y_PREFIX ??
        DEFAULT_TEXTS.TEMPLATE_INSERT_A11Y_PREFIX,
      TEMPLATE_INSERT_HINT:
        translated?.GRATITUDE_TEMPLATE_INSERT_HINT ?? DEFAULT_TEXTS.TEMPLATE_INSERT_HINT,
      TEMPLATE_CHIP_1_LABEL:
        translated?.GRATITUDE_TEMPLATE_CHIP_1_LABEL ?? DEFAULT_TEXTS.TEMPLATE_CHIP_1_LABEL,
      TEMPLATE_CHIP_1_PREFIX:
        translated?.GRATITUDE_TEMPLATE_CHIP_1_PREFIX ?? DEFAULT_TEXTS.TEMPLATE_CHIP_1_PREFIX,
      TEMPLATE_CHIP_2_LABEL:
        translated?.GRATITUDE_TEMPLATE_CHIP_2_LABEL ?? DEFAULT_TEXTS.TEMPLATE_CHIP_2_LABEL,
      TEMPLATE_CHIP_2_PREFIX:
        translated?.GRATITUDE_TEMPLATE_CHIP_2_PREFIX ?? DEFAULT_TEXTS.TEMPLATE_CHIP_2_PREFIX,
      TEMPLATE_CHIP_3_LABEL:
        translated?.GRATITUDE_TEMPLATE_CHIP_3_LABEL ?? DEFAULT_TEXTS.TEMPLATE_CHIP_3_LABEL,
      TEMPLATE_CHIP_3_PREFIX:
        translated?.GRATITUDE_TEMPLATE_CHIP_3_PREFIX ?? DEFAULT_TEXTS.TEMPLATE_CHIP_3_PREFIX,
      LINE_1_PLACEHOLDER:
        translated?.GRATITUDE_LINE_1_PLACEHOLDER ?? DEFAULT_TEXTS.LINE_1_PLACEHOLDER,
      LINE_2_PLACEHOLDER:
        translated?.GRATITUDE_LINE_2_PLACEHOLDER ?? DEFAULT_TEXTS.LINE_2_PLACEHOLDER,
      LINE_3_PLACEHOLDER:
        translated?.GRATITUDE_LINE_3_PLACEHOLDER ?? DEFAULT_TEXTS.LINE_3_PLACEHOLDER,
      SAVE_ENTRY_A11Y:
        translated?.GRATITUDE_SAVE_ENTRY_A11Y ?? DEFAULT_TEXTS.SAVE_ENTRY_A11Y,
      SAVE_ENTRY: translated?.GRATITUDE_SAVE_ENTRY ?? DEFAULT_TEXTS.SAVE_ENTRY,
      TOAST_SAVED: translated?.GRATITUDE_TOAST_SAVED ?? DEFAULT_TEXTS.TOAST_SAVED,
      TOAST_DELETED: translated?.GRATITUDE_TOAST_DELETED ?? DEFAULT_TEXTS.TOAST_DELETED,
      UNDO: translated?.GRATITUDE_UNDO ?? DEFAULT_TEXTS.UNDO,
      ENTRIES_TITLE: translated?.GRATITUDE_ENTRIES_TITLE ?? DEFAULT_TEXTS.ENTRIES_TITLE,
      ENTRIES_TODAY_TITLE:
        translated?.GRATITUDE_ENTRIES_TODAY_TITLE ?? DEFAULT_TEXTS.ENTRIES_TODAY_TITLE,
      FILTER_SHOW_ALL_A11Y:
        translated?.GRATITUDE_FILTER_SHOW_ALL_A11Y ?? DEFAULT_TEXTS.FILTER_SHOW_ALL_A11Y,
      FILTER_SHOW_TODAY_A11Y:
        translated?.GRATITUDE_FILTER_SHOW_TODAY_A11Y ?? DEFAULT_TEXTS.FILTER_SHOW_TODAY_A11Y,
      FILTER_HINT: translated?.GRATITUDE_FILTER_HINT ?? DEFAULT_TEXTS.FILTER_HINT,
      FILTER_TODAY_ONLY:
        translated?.GRATITUDE_FILTER_TODAY_ONLY ?? DEFAULT_TEXTS.FILTER_TODAY_ONLY,
      FILTER_EMPTY: translated?.GRATITUDE_FILTER_EMPTY ?? DEFAULT_TEXTS.FILTER_EMPTY,
      DELETE_ENTRY_A11Y_PREFIX:
        translated?.GRATITUDE_DELETE_ENTRY_A11Y_PREFIX ?? DEFAULT_TEXTS.DELETE_ENTRY_A11Y_PREFIX,
      DELETE_ENTRY_HINT:
        translated?.GRATITUDE_DELETE_ENTRY_HINT ?? DEFAULT_TEXTS.DELETE_ENTRY_HINT,
      EMPTY_TITLE: translated?.GRATITUDE_EMPTY_TITLE ?? DEFAULT_TEXTS.EMPTY_TITLE,
      EXAMPLE_1: translated?.GRATITUDE_EXAMPLE_1 ?? DEFAULT_TEXTS.EXAMPLE_1,
      EXAMPLE_2: translated?.GRATITUDE_EXAMPLE_2 ?? DEFAULT_TEXTS.EXAMPLE_2,
      EXAMPLE_3: translated?.GRATITUDE_EXAMPLE_3 ?? DEFAULT_TEXTS.EXAMPLE_3,
      WRITING_PROMPT_KICKER:
        translated?.GRATITUDE_WRITING_PROMPT_KICKER ?? DEFAULT_TEXTS.WRITING_PROMPT_KICKER,
      WRITING_PROMPT_ANOTHER:
        translated?.GRATITUDE_WRITING_PROMPT_ANOTHER ?? DEFAULT_TEXTS.WRITING_PROMPT_ANOTHER,
      WRITING_PROMPT_A11Y:
        translated?.GRATITUDE_WRITING_PROMPT_A11Y ?? DEFAULT_TEXTS.WRITING_PROMPT_A11Y,
      WRITING_PROMPT_HINT:
        translated?.GRATITUDE_WRITING_PROMPT_HINT ?? DEFAULT_TEXTS.WRITING_PROMPT_HINT,
    }),
    [translated]
  );
  const templateChips = useMemo(() => buildGratitudeTemplateChips(T), [T]);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { colors, resolvedScheme, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [entries, setEntries] = useState([]);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const focusedLineRef = useRef(0);
  const pendingDeleteRef = useRef(null);
  const saveBtnScale = useRef(new Animated.Value(1)).current;

  const ROTATING_EXAMPLES = useMemo(
    () => [T.EXAMPLE_1, T.EXAMPLE_2, T.EXAMPLE_3],
    [T.EXAMPLE_1, T.EXAMPLE_2, T.EXAMPLE_3]
  );

  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);

  const todayLabel = useMemo(() => {
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    });
  }, [language]);

  const hasAnyLine = line1.trim() || line2.trim() || line3.trim();

  const visibleEntries = useMemo(() => {
    if (!todayOnly) return entries;
    return entries.filter((e) => isSameLocalDay(e.date));
  }, [entries, todayOnly]);

  useEffect(() => {
    const id = setInterval(() => {
      setExampleIndex((i) => (i + 1) % ROTATING_EXAMPLES.length);
    }, 4500);
    return () => clearInterval(id);
  }, [ROTATING_EXAMPLES.length]);

  const insertTemplate = useCallback(
    (prefix) => {
      const idx = focusedLineRef.current;
      const setters = [setLine1, setLine2, setLine3];
      const values = [line1, line2, line3];
      const cur = values[idx] ?? '';
      const next =
        cur.trim() === '' ? prefix : `${cur.trimEnd()} ${prefix}`;
      setters[idx](next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [line1, line2, line3]
  );

  const clearLines = () => {
    setLine1('');
    setLine2('');
    setLine3('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    const l1 = line1.trim();
    const l2 = line2.trim();
    const l3 = line3.trim();
    if (!l1 && !l2 && !l3) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const lines = [l1, l2, l3];
    const text = lines.filter(Boolean).map((line, i) => `${i + 1}) ${line}`).join('\n');
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      lines,
      text,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setLine1('');
    setLine2('');
    setLine3('');
    Keyboard.dismiss();

    showToast({ message: T.TOAST_SAVED, type: 'success', duration: 2500 });

    recordInterventionCompleted('gratitude_journal');

    Animated.sequence([
      Animated.spring(saveBtnScale, {
        toValue: 1.04,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(saveBtnScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDeleteEntry = (entry) => {
    if (!entry) return;
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (pendingDeleteRef.current) {
      pendingDeleteRef.current = null;
    }

    pendingDeleteRef.current = {
      entry,
      previous,
    };

    showToast({
      message: T.TOAST_DELETED,
      type: 'info',
      action: {
        label: T.UNDO,
        onPress: () => {
          const pending = pendingDeleteRef.current;
          if (!pending) return;
          setEntries(pending.previous);
          pendingDeleteRef.current = null;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
    });
  };

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const saved = await AsyncStorage.getItem(GRATITUDE_ENTRIES_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEntries(sanitizeGratitudeEntriesFromStorage(parsed));
        }
      } catch (e) {
        console.error('Error cargando diario de gratitud:', e);
      }
    };
    loadEntries();
  }, []);

  useEffect(() => {
    const saveEntries = async () => {
      try {
        await AsyncStorage.setItem(GRATITUDE_ENTRIES_KEY, JSON.stringify(entries));
      } catch (e) {
        console.error('Error guardando diario de gratitud:', e);
      }
    };
    saveEntries();
  }, [entries]);

  const renderLineField = (index, value, setValue, placeholder, inputRef) => (
    <View style={styles.lineRow}>
      <Text style={styles.linePrefix}>{index + 1})</Text>
      <TextInput
        ref={inputRef}
        style={styles.lineInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={setValue}
        onFocus={() => {
          focusedLineRef.current = index;
        }}
        returnKeyType={index < 2 ? 'next' : 'default'}
        onSubmitEditing={() => {
          if (index === 0) input2Ref.current?.focus();
          else if (index === 1) input3Ref.current?.focus();
        }}
        blurOnSubmit={index === 2}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={T.TITLE} showBackButton onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            techniqueScreenStyles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>{T.INTRO_KICKER}</Text>
            <Text style={techniqueScreenStyles.introTitle}>{T.INTRO_TITLE}</Text>
            <Text style={styles.todayMeta}>{todayLabel}</Text>
            <Text style={techniqueScreenStyles.introText}>{T.INTRO_BODY}</Text>
            <GratitudeWritingPrompt
              kicker={T.WRITING_PROMPT_KICKER}
              anotherLabel={T.WRITING_PROMPT_ANOTHER}
              a11yLabel={T.WRITING_PROMPT_A11Y}
              a11yHint={T.WRITING_PROMPT_HINT}
            />
          </View>

          <View style={styles.composerCard}>
            <View style={styles.privacyRow}>
              <MaterialCommunityIcons name="lock-outline" size={14} color={t.FOCUS_KICKER_COLOR} />
              <Text style={styles.privacyText}>{T.PRIVACY_LOCAL_ONLY}</Text>
            </View>

            <View style={styles.composerHeader}>
              <Text style={styles.composerTitle}>{T.ENTRY_TITLE}</Text>
              {!!hasAnyLine && (
                <TouchableOpacity
                  onPress={clearLines}
                  accessibilityRole="button"
                  accessibilityLabel={T.CLEAR_LINES_A11Y}
                >
                  <Text style={styles.clearText}>{T.CLEAR_LINES}</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesRow}
              keyboardShouldPersistTaps="handled"
            >
              {templateChips.map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={styles.templateChip}
                  onPress={() => insertTemplate(chip.prefix)}
                  accessibilityRole="button"
                  accessibilityLabel={`${T.TEMPLATE_INSERT_A11Y_PREFIX} ${chip.label}`}
                  accessibilityHint={T.TEMPLATE_INSERT_HINT}
                >
                  <Text style={styles.templateChipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.linesBlock}>
              {renderLineField(
                0,
                line1,
                setLine1,
                T.LINE_1_PLACEHOLDER,
                input1Ref
              )}
              {renderLineField(
                1,
                line2,
                setLine2,
                T.LINE_2_PLACEHOLDER,
                input2Ref
              )}
              {renderLineField(
                2,
                line3,
                setLine3,
                T.LINE_3_PLACEHOLDER,
                input3Ref
              )}
            </View>

            <View style={styles.composerFooter}>
              <Animated.View style={{ transform: [{ scale: saveBtnScale }] }}>
                <TouchableOpacity
                  style={[
                    techniqueScreenStyles.saveButton,
                    !hasAnyLine && techniqueScreenStyles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!hasAnyLine}
                  accessibilityRole="button"
                  accessibilityLabel={T.SAVE_ENTRY_A11Y}
                >
                  <Text style={techniqueScreenStyles.saveButtonText}>{T.SAVE_ENTRY}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {entries.length > 0 && (
            <View style={styles.entriesContainer}>
              <View style={styles.entriesHeader}>
                <Text style={styles.entriesTitle}>
                  {todayOnly ? T.ENTRIES_TODAY_TITLE : T.ENTRIES_TITLE}
                </Text>
                <View style={styles.entriesHeaderRight}>
                  <TouchableOpacity
                    style={[styles.filterChip, todayOnly && styles.filterChipActive]}
                    onPress={() => {
                      setTodayOnly((v) => !v);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      todayOnly ? T.FILTER_SHOW_ALL_A11Y : T.FILTER_SHOW_TODAY_A11Y
                    }
                    accessibilityHint={T.FILTER_HINT}
                  >
                    <Text style={[styles.filterChipText, todayOnly && styles.filterChipTextActive]}>
                      {T.FILTER_TODAY_ONLY}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.entriesCount}>{visibleEntries.length}</Text>
                </View>
              </View>
              {visibleEntries.length === 0 && todayOnly ? (
                <Text style={styles.filterEmptyText}>{T.FILTER_EMPTY}</Text>
              ) : (
                visibleEntries.map((entry, index) => {
                  const locale = language === 'en' ? 'en-US' : 'es-ES';
                  const dateStr = new Date(entry.date).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                  const body = getGratitudeEntryDisplayText(entry);
                  return (
                    <View key={entry.id}>
                      <View style={styles.entryCard}>
                        <View style={styles.entryHeaderRow}>
                          <Text style={styles.entryDateKicker}>{dateStr}</Text>
                          <TouchableOpacity
                            onPress={() => handleDeleteEntry(entry)}
                            style={styles.deleteIconButton}
                            accessibilityRole="button"
                            accessibilityLabel={`${T.DELETE_ENTRY_A11Y_PREFIX} ${dateStr}`}
                            accessibilityHint={T.DELETE_ENTRY_HINT}
                          >
                            <MaterialCommunityIcons
                              name="trash-can-outline"
                              size={18}
                              color="rgba(255,107,107,0.9)"
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.entryText}>{body}</Text>
                      </View>
                      {index < visibleEntries.length - 1 ? (
                        <View style={styles.entrySeparator} />
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {entries.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{T.EMPTY_TITLE}</Text>
              <Text style={styles.emptyBody}>{ROTATING_EXAMPLES[exampleIndex]}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/*
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  todayMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: FOCUS_META,
    marginBottom: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  composerCard: {
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    padding: SPACING.CARD_INNER_INSET,
    marginBottom: 14,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  privacyText: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  composerTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
  },
  clearText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  templatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingBottom: SPACING.CHIP_INSET,
  },
  templateChip: {
    paddingHorizontal: SPACING.CHIP_INSET,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  templateChipText: {
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '600',
  },
  linesBlock: {
    gap: SPACING.sm,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    paddingHorizontal: SPACING.INPUT_INSET,
    minHeight: 48,
  },
  linePrefix: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
    minWidth: 22,
  },
  lineInput: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    paddingVertical: SPACING.INPUT_INSET,
    lineHeight: 20,
  },
  composerFooter: {
    marginTop: 12,
  },
  entriesContainer: {
    marginTop: 6,
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  entriesHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.CARD_INNER_INSET,
  },
  filterChip: {
    paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  filterChipActive: {
    borderColor: FOCUS_ACCENT_BORDER,
    backgroundColor: 'rgba(30, 131, 211,0.12)',
  },
  filterChipText: {
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: FOCUS_KICKER_COLOR,
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: -0.2,
  },
  entriesCount: {
    color: FOCUS_META,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'right',
  },
  entryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 22,
    paddingVertical: SPACING.CHIP_INSET,
    paddingHorizontal: SPACING.CARD_INNER_INSET,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  entrySeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: FOCUS_BORDER_SUBTLE,
    marginVertical: 10,
    marginHorizontal: 6,
  },
  filterEmptyText: {
    color: FOCUS_META,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: SPACING.HERO_INSET_COMPACT,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.CARD_INNER_INSET,
    marginBottom: 8,
  },
  entryDateKicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_COLOR,
    flex: 1,
  },
  deleteIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,107,107,0.18)',
  },
  entryText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    padding: SPACING.HERO_INSET,
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    color: FOCUS_META,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
*/

export default GratitudeJournalScreen;
