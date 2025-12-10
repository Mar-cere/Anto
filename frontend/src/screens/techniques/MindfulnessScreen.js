/**
 * Pantalla de Mindfulness
 * Guía al usuario a través de ejercicios de atención plena
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect } from 'react';
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
import { colors } from '../../styles/globalStyles';

const MINDFULNESS_EXERCISES = [
  {
    id: 1,
    title: 'Respiración Consciente',
    description: 'Enfócate en tu respiración. Inhala por 4 segundos, mantén por 4, exhala por 4.',
    duration: '5 minutos',
    icon: 'breathing',
  },
  {
    id: 2,
    title: 'Escaneo Corporal',
    description: 'Lleva tu atención a cada parte de tu cuerpo, desde los dedos de los pies hasta la cabeza.',
    duration: '10 minutos',
    icon: 'body',
  },
  {
    id: 3,
    title: 'Observación de Pensamientos',
    description: 'Observa tus pensamientos sin juzgarlos, como nubes pasando por el cielo.',
    duration: '5 minutos',
    icon: 'thought-bubble',
  },
  {
    id: 4,
    title: 'Caminata Consciente',
    description: 'Camina lentamente, prestando atención a cada paso y a las sensaciones de tu cuerpo.',
    duration: '10 minutos',
    icon: 'walk',
  },
];

const MindfulnessScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const handleStartExercise = (exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedExercise(exercise);
    const minutes = parseInt(exercise.duration);
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
      <StatusBar barStyle="light-content" />
      <Header
        title="Mindfulness"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>🧘 Practica la atención plena</Text>
          <Text style={styles.introText}>
            El mindfulness puede ayudarte a reducir el estrés y mejorar tu bienestar mental.
          </Text>
        </View>

        {isActive && selectedExercise ? (
          <View style={styles.activeExerciseContainer}>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.timerLabel}>Tiempo restante</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseTitle}>{selectedExercise.title}</Text>
              <Text style={styles.exerciseDescription}>{selectedExercise.description}</Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>Detener</Text>
            </TouchableOpacity>
          </View>
        ) : (
          MINDFULNESS_EXERCISES.map(exercise => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => handleStartExercise(exercise)}
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
                  <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                </View>
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              <TouchableOpacity style={styles.startButton}>
                <Text style={styles.startButtonText}>Comenzar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 12,
    color: colors.textSecondary,
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
  activeExerciseContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stopButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  stopButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MindfulnessScreen;

