/**
 * Pantalla de Ejercicio de Memoria
 * Ejercicios para trabajar con recuerdos y procesar emociones
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import Header from '../../components/Header';
import { colors } from '../../styles/globalStyles';

const MEMORY_EXERCISES = [
  {
    id: 1,
    title: 'Recuerdos Positivos',
    description: 'Escribe sobre un recuerdo positivo que te traiga alegría y paz.',
    prompt: 'Describe un momento feliz que quieras recordar...',
    icon: 'emoticon-happy',
  },
  {
    id: 2,
    title: 'Lecciones Aprendidas',
    description: 'Reflexiona sobre las lecciones que has aprendido de experiencias pasadas.',
    prompt: '¿Qué has aprendido de tus experiencias?',
    icon: 'lightbulb-on',
  },
  {
    id: 3,
    title: 'Gratitud por el Pasado',
    description: 'Escribe sobre personas o momentos del pasado por los que estás agradecido.',
    prompt: '¿Por qué estás agradecido del pasado?',
    icon: 'heart',
  },
];

const MemoryExerciseScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [response, setResponse] = useState('');

  const handleSelectExercise = (exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedExercise(exercise);
    setResponse('');
  };

  const handleSave = () => {
    if (response.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Aquí podrías guardar la respuesta
      setResponse('');
      setSelectedExercise(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Ejercicio de Memoria"
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>💭 Trabaja con tus recuerdos</Text>
            <Text style={styles.introText}>
              Los ejercicios de memoria pueden ayudarte a procesar emociones y encontrar significado en tus experiencias.
            </Text>
          </View>

          {!selectedExercise ? (
            MEMORY_EXERCISES.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseCard}
                onPress={() => handleSelectExercise(exercise)}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name={exercise.icon}
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  </View>
                </View>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                <TouchableOpacity style={styles.startButton}>
                  <Text style={styles.startButtonText}>Comenzar</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.exerciseContainer}>
              <View style={styles.exerciseHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={selectedExercise.icon}
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{selectedExercise.title}</Text>
                </View>
              </View>
              <Text style={styles.exerciseDescription}>{selectedExercise.description}</Text>
              <Text style={styles.prompt}>{selectedExercise.prompt}</Text>
              <TextInput
                style={styles.input}
                placeholder={selectedExercise.prompt}
                placeholderTextColor={colors.textSecondary}
                value={response}
                onChangeText={setResponse}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setSelectedExercise(null);
                    setResponse('');
                  }}
                >
                  <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, !response.trim() && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={!response.trim()}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
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
  exerciseCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    fontSize: 16,
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MemoryExerciseScreen;

