/**
 * Pantalla de Ejercicio de Memoria
 * Ejercicios para trabajar con recuerdos y procesar emociones
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
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
import ParticleBackground from '../../components/ParticleBackground';
import { useTheme } from '../../context/ThemeContext';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

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
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [response, setResponse] = useState('');

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
        saveGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  const handleSelectExercise = (exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedExercise(exercise);
    setResponse('');
  };

  const handleSave = () => {
    if (response.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResponse('');
      setSelectedExercise(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title="Ejercicio de Memoria"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>Memoria</Text>
            <Text style={techniqueScreenStyles.introTitle}>Trabaja con tus recuerdos</Text>
            <Text style={techniqueScreenStyles.introText}>
              Los ejercicios de memoria pueden ayudarte a procesar emociones y encontrar significado en tus experiencias.
            </Text>
          </View>

          {!selectedExercise ? (
            MEMORY_EXERCISES.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                style={techniqueScreenStyles.card}
                onPress={() => handleSelectExercise(exercise)}
              >
                <View style={techniqueScreenStyles.rowHeader}>
                  <View style={techniqueScreenStyles.iconTile}>
                    <MaterialCommunityIcons
                      name={exercise.icon}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <View style={techniqueScreenStyles.infoColumn}>
                    <Text style={techniqueScreenStyles.cardTitle}>{exercise.title}</Text>
                  </View>
                </View>
                <Text style={techniqueScreenStyles.cardBody}>{exercise.description}</Text>
                <View style={techniqueScreenStyles.primaryButton}>
                  <Text style={techniqueScreenStyles.primaryButtonText}>Comenzar</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={techniqueScreenStyles.card}>
              <View style={techniqueScreenStyles.rowHeader}>
                <View style={techniqueScreenStyles.iconTile}>
                  <MaterialCommunityIcons
                    name={selectedExercise.icon}
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={techniqueScreenStyles.infoColumn}>
                  <Text style={techniqueScreenStyles.cardTitle}>{selectedExercise.title}</Text>
                </View>
              </View>
              <Text style={techniqueScreenStyles.cardBody}>{selectedExercise.description}</Text>
              <Text style={techniqueScreenStyles.promptText}>{selectedExercise.prompt}</Text>
              <TextInput
                style={[techniqueScreenStyles.textInput, techniqueScreenStyles.textInputTall]}
                placeholder={selectedExercise.prompt}
                placeholderTextColor={colors.textSecondary}
                value={response}
                onChangeText={setResponse}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              <View style={techniqueScreenStyles.buttonRow}>
                <TouchableOpacity
                  style={techniqueScreenStyles.secondaryButton}
                  onPress={() => {
                    setSelectedExercise(null);
                    setResponse('');
                  }}
                >
                  <Text style={techniqueScreenStyles.secondaryButtonText}>Volver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    techniqueScreenStyles.saveButton,
                    styles.saveGrow,
                    !response.trim() && techniqueScreenStyles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!response.trim()}
                >
                  <Text style={techniqueScreenStyles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// `styles` se deriva del tema dentro del componente.

export default MemoryExerciseScreen;
