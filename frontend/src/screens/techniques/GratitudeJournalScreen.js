/**
 * Pantalla de Diario de Gratitud
 * Permite al usuario escribir y guardar entradas de gratitud
 */

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';
import {
  FOCUS_BORDER_SUBTLE,
  FOCUS_KICKER_COLOR,
  FOCUS_META,
  FOCUS_PANEL,
} from '../../styles/focusCardTheme';

const GRATITUDE_ENTRIES_KEY = 'gratitudeJournalEntries';

const GratitudeJournalScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const inputRef = useRef(null);
  const pendingDeleteRef = useRef(null);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    });
  }, []);

  const handleSave = () => {
    if (currentEntry.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newEntry = {
        id: Date.now(),
        text: currentEntry.trim(),
        date: new Date().toISOString(),
      };
      setEntries(prev => [newEntry, ...prev]);
      setCurrentEntry('');
      Keyboard.dismiss();
    }
  };

  const handleDeleteEntry = (entry) => {
    if (!entry) return;
    // eliminar optimista con undo via toast
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
        if (Array.isArray(parsed)) setEntries(parsed);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={colors.white} 
          />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Diario de Gratitud</Text>
          <Text style={styles.headerMeta}>{todayLabel}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.panel}>
            <Text style={styles.panelKicker}>INTENCIÓN</Text>
            <Text style={styles.panelTitle}>Tres cosas por las que agradeces hoy</Text>
            <Text style={styles.panelBody}>
              Escribe con frases cortas. No busques perfección: busca presencia.
            </Text>
          </View>

          <View style={styles.composerCard}>
            <View style={styles.composerHeader}>
              <Text style={styles.composerTitle}>Tu entrada</Text>
              {!!currentEntry.trim() && (
                <TouchableOpacity
                  onPress={() => {
                    setCurrentEntry('');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar texto"
                >
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="¿Por qué estás agradecido hoy?"
              placeholderTextColor={FOCUS_META}
              value={currentEntry}
              onChangeText={setCurrentEntry}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.composerFooter}>
              <TouchableOpacity
                style={styles.keyboardChip}
                onPress={() => Keyboard.dismiss()}
                accessibilityRole="button"
                accessibilityLabel="Ocultar teclado"
              >
                <MaterialCommunityIcons name="keyboard-close" size={16} color={FOCUS_KICKER_COLOR} />
                <Text style={styles.keyboardChipText}>Listo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !currentEntry.trim() && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!currentEntry.trim()}
                accessibilityRole="button"
                accessibilityLabel="Guardar entrada"
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {entries.length > 0 && (
            <View style={styles.entriesContainer}>
              <View style={styles.entriesHeader}>
                <Text style={styles.entriesTitle}>Entradas</Text>
                <Text style={styles.entriesCount}>{entries.length}</Text>
              </View>
              {entries.map(entry => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entryDate}>
                      {new Date(entry.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteEntry(entry)}
                      style={styles.deleteIconButton}
                      accessibilityRole="button"
                      accessibilityLabel="Eliminar entrada"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="rgba(255,107,107,0.9)" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.entryText}>{entry.text}</Text>
                </View>
              ))}
            </View>
          )}
          {entries.length === 0 && (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="book-heart-outline" size={24} color={FOCUS_KICKER_COLOR} />
              <Text style={styles.emptyTitle}>Tu primera entrada</Text>
              <Text style={styles.emptyBody}>
                Prueba con: “Agradezco…”, “Hoy me ayudó…”, “Valoro…”.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FOCUS_BORDER_SUBTLE,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerMeta: {
    marginTop: 3,
    fontSize: 12,
    color: FOCUS_META,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  panel: {
    ...FOCUS_PANEL,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  panelKicker: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  panelTitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  panelBody: {
    color: FOCUS_META,
    fontSize: 14,
    lineHeight: 20,
  },
  composerCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    padding: 14,
    marginBottom: 16,
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
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    color: colors.white,
    fontSize: 15,
    minHeight: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  keyboardChipText: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
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
  },
  entryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryDate: {
    fontSize: 12,
    color: FOCUS_META,
    marginBottom: 8,
    fontWeight: '500',
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
    marginBottom: 8,
  },
  entryText: {
    fontSize: 15,
    color: colors.white,
    lineHeight: 22,
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBody: {
    color: FOCUS_META,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});

export default GratitudeJournalScreen;

