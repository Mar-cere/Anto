/**
 * Pantalla de Mindfulness
 * Guía al usuario a través de ejercicios de atención plena
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Mindfulness',
  INTRO_KICKER: 'Mindfulness',
  INTRO_TITLE: 'Practica la atencion plena',
  INTRO_BODY:
    'El mindfulness puede ayudarte a reducir el estres y mejorar tu bienestar mental.',
  TIMER_REMAINING: 'Tiempo restante',
  STOP: 'Detener',
  START: 'Comenzar',
  EXERCISE_1_TITLE: 'Respiracion Consciente',
  EXERCISE_1_DESC:
    'Enfocate en tu respiracion. Inhala por 4 segundos, manten por 4, exhala por 4.',
  EXERCISE_1_DURATION: '5 minutos',
  EXERCISE_2_TITLE: 'Escaneo Corporal',
  EXERCISE_2_DESC:
    'Lleva tu atencion a cada parte de tu cuerpo, desde los dedos de los pies hasta la cabeza.',
  EXERCISE_2_DURATION: '10 minutos',
  EXERCISE_3_TITLE: 'Observacion de Pensamientos',
  EXERCISE_3_DESC:
    'Observa tus pensamientos sin juzgarlos, como nubes pasando por el cielo.',
  EXERCISE_3_DURATION: '5 minutos',
  EXERCISE_4_TITLE: 'Caminata Consciente',
  EXERCISE_4_DESC:
    'Camina lentamente, prestando atencion a cada paso y a las sensaciones de tu cuerpo.',
  EXERCISE_4_DURATION: '10 minutos',
};

const MindfulnessScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.MINDFULNESS_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.MINDFULNESS_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.MINDFULNESS_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.MINDFULNESS_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      TIMER_REMAINING:
        translated?.MINDFULNESS_TIMER_REMAINING || DEFAULT_TEXTS.TIMER_REMAINING,
      STOP: translated?.MINDFULNESS_STOP || DEFAULT_TEXTS.STOP,
      START: translated?.MINDFULNESS_START || DEFAULT_TEXTS.START,
      EXERCISE_1_TITLE:
        translated?.MINDFULNESS_EXERCISE_1_TITLE || DEFAULT_TEXTS.EXERCISE_1_TITLE,
      EXERCISE_1_DESC:
        translated?.MINDFULNESS_EXERCISE_1_DESC ||
        DEFAULT_TEXTS.EXERCISE_1_DESC,
      EXERCISE_1_DURATION:
        translated?.MINDFULNESS_EXERCISE_1_DURATION || DEFAULT_TEXTS.EXERCISE_1_DURATION,
      EXERCISE_2_TITLE:
        translated?.MINDFULNESS_EXERCISE_2_TITLE || DEFAULT_TEXTS.EXERCISE_2_TITLE,
      EXERCISE_2_DESC:
        translated?.MINDFULNESS_EXERCISE_2_DESC ||
        DEFAULT_TEXTS.EXERCISE_2_DESC,
      EXERCISE_2_DURATION:
        translated?.MINDFULNESS_EXERCISE_2_DURATION || DEFAULT_TEXTS.EXERCISE_2_DURATION,
      EXERCISE_3_TITLE:
        translated?.MINDFULNESS_EXERCISE_3_TITLE || DEFAULT_TEXTS.EXERCISE_3_TITLE,
      EXERCISE_3_DESC:
        translated?.MINDFULNESS_EXERCISE_3_DESC ||
        DEFAULT_TEXTS.EXERCISE_3_DESC,
      EXERCISE_3_DURATION:
        translated?.MINDFULNESS_EXERCISE_3_DURATION || DEFAULT_TEXTS.EXERCISE_3_DURATION,
      EXERCISE_4_TITLE:
        translated?.MINDFULNESS_EXERCISE_4_TITLE || DEFAULT_TEXTS.EXERCISE_4_TITLE,
      EXERCISE_4_DESC:
        translated?.MINDFULNESS_EXERCISE_4_DESC ||
        DEFAULT_TEXTS.EXERCISE_4_DESC,
      EXERCISE_4_DURATION:
        translated?.MINDFULNESS_EXERCISE_4_DURATION || DEFAULT_TEXTS.EXERCISE_4_DURATION,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const MINDFULNESS_EXERCISES = useMemo(
    () => [
      {
        id: 1,
        title: TEXTS.EXERCISE_1_TITLE,
        description: TEXTS.EXERCISE_1_DESC,
        duration: TEXTS.EXERCISE_1_DURATION,
        icon: 'weather-windy',
      },
      {
        id: 2,
        title: TEXTS.EXERCISE_2_TITLE,
        description: TEXTS.EXERCISE_2_DESC,
        duration: TEXTS.EXERCISE_2_DURATION,
        icon: 'body',
      },
      {
        id: 3,
        title: TEXTS.EXERCISE_3_TITLE,
        description: TEXTS.EXERCISE_3_DESC,
        duration: TEXTS.EXERCISE_3_DURATION,
        icon: 'thought-bubble',
      },
      {
        id: 4,
        title: TEXTS.EXERCISE_4_TITLE,
        description: TEXTS.EXERCISE_4_DESC,
        duration: TEXTS.EXERCISE_4_DURATION,
        icon: 'walk',
      },
    ],
    [
      TEXTS.EXERCISE_1_TITLE,
      TEXTS.EXERCISE_1_DESC,
      TEXTS.EXERCISE_1_DURATION,
      TEXTS.EXERCISE_2_TITLE,
      TEXTS.EXERCISE_2_DESC,
      TEXTS.EXERCISE_2_DURATION,
      TEXTS.EXERCISE_3_TITLE,
      TEXTS.EXERCISE_3_DESC,
      TEXTS.EXERCISE_3_DURATION,
      TEXTS.EXERCISE_4_TITLE,
      TEXTS.EXERCISE_4_DESC,
      TEXTS.EXERCISE_4_DURATION,
    ]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollView: {
          flex: 1,
        },
        activeCard: {
          alignItems: 'center',
          alignSelf: 'stretch',
          borderColor: colors.primary,
          borderWidth: StyleSheet.hairlineWidth,
        },
        timerBlock: {
          alignItems: 'center',
          marginBottom: 20,
          alignSelf: 'stretch',
        },
        activeCopy: {
          alignSelf: 'stretch',
          marginBottom: 8,
        },
        activeTitle: {
          textAlign: 'center',
          marginBottom: 8,
        },
        activeBody: {
          textAlign: 'center',
          marginBottom: 0,
        },
      }),
    [colors],
  );

  useEffect(() => {
    let interval = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      recordInterventionCompleted('mindfulness_reminder');
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const handleStartExercise = (exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedExercise(exercise);
    const minutes = parseInt(exercise.duration, 10);
    setTimeRemaining(minutes * 60);
    setIsActive(true);
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>{TEXTS.INTRO_KICKER}</Text>
          <Text style={techniqueScreenStyles.introTitle}>{TEXTS.INTRO_TITLE}</Text>
          <Text style={techniqueScreenStyles.introText}>{TEXTS.INTRO_BODY}</Text>
        </View>

        {isActive && selectedExercise ? (
          <View style={[techniqueScreenStyles.card, styles.activeCard]}>
            <View style={styles.timerBlock}>
              <Text style={techniqueScreenStyles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={techniqueScreenStyles.timerLabel}>{TEXTS.TIMER_REMAINING}</Text>
            </View>
            <View style={styles.activeCopy}>
              <Text style={[techniqueScreenStyles.cardTitle, styles.activeTitle]}>
                {selectedExercise.title}
              </Text>
              <Text style={[techniqueScreenStyles.cardBody, styles.activeBody]}>
                {selectedExercise.description}
              </Text>
            </View>
            <TouchableOpacity style={techniqueScreenStyles.stopButton} onPress={handleStop}>
              <Text style={techniqueScreenStyles.stopButtonText}>{TEXTS.STOP}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          MINDFULNESS_EXERCISES.map(exercise => (
            <TouchableOpacity
              key={exercise.id}
              style={techniqueScreenStyles.card}
              onPress={() => handleStartExercise(exercise)}
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
                  <Text style={techniqueScreenStyles.cardMeta}>{exercise.duration}</Text>
                </View>
              </View>
              <Text style={techniqueScreenStyles.cardBody}>{exercise.description}</Text>
              <View style={techniqueScreenStyles.primaryButton}>
                <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.START}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// `styles` se deriva del tema dentro del componente.

export default MindfulnessScreen;

