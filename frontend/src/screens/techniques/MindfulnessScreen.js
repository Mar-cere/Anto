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
import ParticleBackground from '../../components/ParticleBackground';
import { colors } from '../../styles/globalStyles';
import { techniqueScreenStyles } from './techniqueScreenStyles';

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
      <StatusBar barStyle="light-content" />
      <ParticleBackground />
      <Header
        title="Mindfulness"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>Mindfulness</Text>
          <Text style={techniqueScreenStyles.introTitle}>Practica la atención plena</Text>
          <Text style={techniqueScreenStyles.introText}>
            El mindfulness puede ayudarte a reducir el estrés y mejorar tu bienestar mental.
          </Text>
        </View>

        {isActive && selectedExercise ? (
          <View style={[techniqueScreenStyles.card, styles.activeCard]}>
            <View style={styles.timerBlock}>
              <Text style={techniqueScreenStyles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={techniqueScreenStyles.timerLabel}>Tiempo restante</Text>
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
              <Text style={techniqueScreenStyles.stopButtonText}>Detener</Text>
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
                <Text style={techniqueScreenStyles.primaryButtonText}>Comenzar</Text>
              </View>
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
});

export default MindfulnessScreen;

