/**
 * Pantalla de Diario de Gratitud
 * Permite al usuario escribir y guardar entradas de gratitud
 */

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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

const GratitudeJournalScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');

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
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>Diario de Gratitud</Text>
        <View style={styles.headerButton} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>📔 Escribe sobre lo que agradeces</Text>
            <Text style={styles.introText}>
              Practicar la gratitud puede mejorar tu bienestar emocional. 
              Escribe tres cosas por las que estés agradecido hoy.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="¿Por qué estás agradecido hoy?"
              placeholderTextColor={colors.textSecondary}
              value={currentEntry}
              onChangeText={setCurrentEntry}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.saveButton, !currentEntry.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!currentEntry.trim()}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          {entries.length > 0 && (
            <View style={styles.entriesContainer}>
              <Text style={styles.entriesTitle}>Tus entradas anteriores</Text>
              {entries.map(entry => (
                <View key={entry.id} style={styles.entryCard}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.entryText}>{entry.text}</Text>
                </View>
              ))}
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
    paddingVertical: 12,
    backgroundColor: 'rgba(3, 10, 36, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 221, 219, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(29, 43, 95, 0.5)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introContainer: {
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 10,
  },
  introText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  entriesContainer: {
    marginTop: 20,
  },
  entriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 15,
  },
  entryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  entryText: {
    fontSize: 16,
    color: colors.white,
    lineHeight: 24,
  },
});

export default GratitudeJournalScreen;

