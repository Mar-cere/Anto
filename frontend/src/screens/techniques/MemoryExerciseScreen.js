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
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Ejercicio de Memoria',
  INTRO_KICKER: 'Memoria',
  INTRO_TITLE: 'Trabaja con tus recuerdos',
  INTRO_BODY:
    'Los ejercicios de memoria pueden ayudarte a procesar emociones y encontrar significado en tus experiencias.',
  START: 'Comenzar',
  BACK: 'Volver',
  SAVE: 'Guardar',
  EXERCISE_1_TITLE: 'Recuerdos Positivos',
  EXERCISE_1_DESC:
    'Escribe sobre un recuerdo positivo que te traiga alegria y paz.',
  EXERCISE_1_PROMPT: 'Describe un momento feliz que quieras recordar...',
  EXERCISE_2_TITLE: 'Lecciones Aprendidas',
  EXERCISE_2_DESC:
    'Reflexiona sobre las lecciones que has aprendido de experiencias pasadas.',
  EXERCISE_2_PROMPT: '¿Que has aprendido de tus experiencias?',
  EXERCISE_3_TITLE: 'Gratitud por el Pasado',
  EXERCISE_3_DESC:
    'Escribe sobre personas o momentos del pasado por los que estas agradecido.',
  EXERCISE_3_PROMPT: '¿Por que estas agradecido del pasado?',
};

const MemoryExerciseScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.MEMORY_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.MEMORY_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.MEMORY_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.MEMORY_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      START: translated?.MEMORY_START || DEFAULT_TEXTS.START,
      BACK: translated?.MEMORY_BACK || DEFAULT_TEXTS.BACK,
      SAVE: translated?.MEMORY_SAVE || DEFAULT_TEXTS.SAVE,
      EXERCISE_1_TITLE:
        translated?.MEMORY_EXERCISE_1_TITLE || DEFAULT_TEXTS.EXERCISE_1_TITLE,
      EXERCISE_1_DESC:
        translated?.MEMORY_EXERCISE_1_DESC ||
        DEFAULT_TEXTS.EXERCISE_1_DESC,
      EXERCISE_1_PROMPT:
        translated?.MEMORY_EXERCISE_1_PROMPT ||
        DEFAULT_TEXTS.EXERCISE_1_PROMPT,
      EXERCISE_2_TITLE:
        translated?.MEMORY_EXERCISE_2_TITLE || DEFAULT_TEXTS.EXERCISE_2_TITLE,
      EXERCISE_2_DESC:
        translated?.MEMORY_EXERCISE_2_DESC ||
        DEFAULT_TEXTS.EXERCISE_2_DESC,
      EXERCISE_2_PROMPT:
        translated?.MEMORY_EXERCISE_2_PROMPT ||
        DEFAULT_TEXTS.EXERCISE_2_PROMPT,
      EXERCISE_3_TITLE:
        translated?.MEMORY_EXERCISE_3_TITLE || DEFAULT_TEXTS.EXERCISE_3_TITLE,
      EXERCISE_3_DESC:
        translated?.MEMORY_EXERCISE_3_DESC ||
        DEFAULT_TEXTS.EXERCISE_3_DESC,
      EXERCISE_3_PROMPT:
        translated?.MEMORY_EXERCISE_3_PROMPT ||
        DEFAULT_TEXTS.EXERCISE_3_PROMPT,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [response, setResponse] = useState('');
  const MEMORY_EXERCISES = useMemo(
    () => [
      {
        id: 1,
        title: TEXTS.EXERCISE_1_TITLE,
        description: TEXTS.EXERCISE_1_DESC,
        prompt: TEXTS.EXERCISE_1_PROMPT,
        icon: 'emoticon-happy',
      },
      {
        id: 2,
        title: TEXTS.EXERCISE_2_TITLE,
        description: TEXTS.EXERCISE_2_DESC,
        prompt: TEXTS.EXERCISE_2_PROMPT,
        icon: 'lightbulb-on',
      },
      {
        id: 3,
        title: TEXTS.EXERCISE_3_TITLE,
        description: TEXTS.EXERCISE_3_DESC,
        prompt: TEXTS.EXERCISE_3_PROMPT,
        icon: 'heart',
      },
    ],
    [
      TEXTS.EXERCISE_1_TITLE,
      TEXTS.EXERCISE_1_DESC,
      TEXTS.EXERCISE_1_PROMPT,
      TEXTS.EXERCISE_2_TITLE,
      TEXTS.EXERCISE_2_DESC,
      TEXTS.EXERCISE_2_PROMPT,
      TEXTS.EXERCISE_3_TITLE,
      TEXTS.EXERCISE_3_DESC,
      TEXTS.EXERCISE_3_PROMPT,
    ]
  );

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
        title={TEXTS.TITLE}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>{TEXTS.INTRO_KICKER}</Text>
            <Text style={techniqueScreenStyles.introTitle}>{TEXTS.INTRO_TITLE}</Text>
            <Text style={techniqueScreenStyles.introText}>{TEXTS.INTRO_BODY}</Text>
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
                  <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.START}</Text>
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
                  <Text style={techniqueScreenStyles.secondaryButtonText}>{TEXTS.BACK}</Text>
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
                  <Text style={techniqueScreenStyles.saveButtonText}>{TEXTS.SAVE}</Text>
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
