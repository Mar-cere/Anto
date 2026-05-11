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
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';
import { SPACING } from '../../constants/ui';
import {
  getGratitudeEntryDisplayText,
  sanitizeGratitudeEntriesFromStorage,
} from '../../utils/gratitudeJournalEntry';

const GRATITUDE_ENTRIES_KEY = 'gratitudeJournalEntries';

const TEMPLATE_CHIPS = [
  { id: 'c1', label: 'Hoy agradezco…', prefix: 'Hoy agradezco ' },
  { id: 'c2', label: 'Me ayudó…', prefix: 'Me ayudó ' },
  { id: 'c3', label: 'Valoro…', prefix: 'Valoro ' },
];

const ROTATING_EXAMPLES = [
  'Ejemplo: “Hoy agradezco el silencio de la mañana.”',
  'Ejemplo: “Me ayudó que alguien me escuchara sin juzgar.”',
  'Ejemplo: “Valoro el descanso que pude tomar hoy.”',
];

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
      padding: SPACING.SCREEN_EDGE_INSET,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    privacyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
      gap: 10,
    },
    templateChip: {
      borderRadius: 999,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingVertical: 8,
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
      gap: 10,
    },
    lineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      backgroundColor: colors.chromeInput,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingVertical: 8,
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
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      gap: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    toggleLabel: {
      color: t.FOCUS_META,
      fontSize: 13,
      fontWeight: '700',
    },
    subtleIconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingVertical: 10,
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
      padding: SPACING.SCREEN_EDGE_INSET,
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
      paddingVertical: 10,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
      padding: SPACING.SCREEN_EDGE_INSET,
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

  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    });
  }, []);

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
  }, []);

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

    showToast({ message: 'Quedó registrado', type: 'success', duration: 2500 });

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
      message: 'Entrada eliminada',
      type: 'info',
      action: {
        label: 'Deshacer',
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
      <Header
        title="Diario de Gratitud"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            techniqueScreenStyles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>Gratitud</Text>
            <Text style={techniqueScreenStyles.introTitle}>Tres líneas, aquí y ahora</Text>
            <Text style={styles.todayMeta}>{todayLabel}</Text>
            <Text style={techniqueScreenStyles.introText}>
              Tres respuestas cortas. No busques perfección: busca presencia.
            </Text>
          </View>

          <View style={styles.composerCard}>
            <View style={styles.privacyRow}>
              <MaterialCommunityIcons name="lock-outline" size={14} color={t.FOCUS_KICKER_COLOR} />
              <Text style={styles.privacyText}>Solo en tu dispositivo</Text>
            </View>

            <View style={styles.composerHeader}>
              <Text style={styles.composerTitle}>Tu entrada</Text>
              {!!hasAnyLine && (
                <TouchableOpacity
                  onPress={clearLines}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar las tres líneas"
                >
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesRow}
              keyboardShouldPersistTaps="handled"
            >
              {TEMPLATE_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={styles.templateChip}
                  onPress={() => insertTemplate(chip.prefix)}
                  accessibilityRole="button"
                  accessibilityLabel={`Insertar plantilla: ${chip.label}`}
                  accessibilityHint="Añade el inicio de frase en la línea que tienes enfocada"
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
                'Algo que te hizo bien hoy',
                input1Ref
              )}
              {renderLineField(
                1,
                line2,
                setLine2,
                'Una persona o gesto que valoras',
                input2Ref
              )}
              {renderLineField(
                2,
                line3,
                setLine3,
                'Algo de ti que reconoces',
                input3Ref
              )}
            </View>

            <View style={styles.composerFooter}>
              <TouchableOpacity
                style={styles.keyboardChip}
                onPress={() => Keyboard.dismiss()}
                accessibilityRole="button"
                accessibilityLabel="Ocultar teclado"
              >
                <MaterialCommunityIcons name="keyboard-close" size={16} color={t.FOCUS_KICKER_COLOR} />
                <Text style={styles.keyboardChipText}>Listo</Text>
              </TouchableOpacity>
              <Animated.View style={{ flex: 1, transform: [{ scale: saveBtnScale }] }}>
                <TouchableOpacity
                  style={[
                    techniqueScreenStyles.saveButton,
                    styles.saveButtonGrow,
                    !hasAnyLine && techniqueScreenStyles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!hasAnyLine}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar entrada de gratitud"
                >
                  <Text style={techniqueScreenStyles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {entries.length > 0 && (
            <View style={styles.entriesContainer}>
              <View style={styles.entriesHeader}>
                <Text style={styles.entriesTitle}>{todayOnly ? 'Hoy' : 'Entradas'}</Text>
                <View style={styles.entriesHeaderRight}>
                  <TouchableOpacity
                    style={[styles.filterChip, todayOnly && styles.filterChipActive]}
                    onPress={() => {
                      setTodayOnly((v) => !v);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={todayOnly ? 'Mostrar todas las entradas' : 'Mostrar solo entradas de hoy'}
                    accessibilityHint="Filtra la lista por el día actual"
                  >
                    <Text style={[styles.filterChipText, todayOnly && styles.filterChipTextActive]}>
                      Solo hoy
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.entriesCount}>{visibleEntries.length}</Text>
                </View>
              </View>
              {visibleEntries.length === 0 && todayOnly ? (
                <Text style={styles.filterEmptyText}>
                  No hay entradas hoy. Puedes escribir arriba o quitar el filtro.
                </Text>
              ) : (
                visibleEntries.map((entry, index) => {
                  const dateStr = new Date(entry.date).toLocaleDateString('es-ES', {
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
                            accessibilityLabel={`Eliminar entrada del ${dateStr}`}
                            accessibilityHint="Elimina esta entrada. Puedes deshacer con el aviso que aparece después."
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
              <Text style={styles.emptyTitle}>Cuando quieras, tres líneas bastan</Text>
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
    padding: SPACING.SCREEN_EDGE_INSET,
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
    gap: 8,
    paddingBottom: 12,
  },
  templateChip: {
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingVertical: 8,
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
    gap: 8,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
    paddingVertical: 12,
    lineHeight: 20,
  },
  composerFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  keyboardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
  },
  keyboardChipText: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButtonGrow: {
    flex: 1,
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
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
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
    paddingVertical: 14,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
    paddingVertical: 16,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
    padding: 18,
    gap: 8,
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
