/**
 * Pantalla de Técnica de Tiempo Fuera
 * Guía para usar la técnica de tiempo fuera cuando se siente enojo o frustración
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

const TIMEOUT_STEPS = [
  {
    id: 1,
    title: 'Reconocer',
    description: 'Reconoce que necesitas un tiempo fuera. No hay nada de malo en tomarte un descanso.',
    icon: 'alert-circle',
  },
  {
    id: 2,
    title: 'Retirarse',
    description: 'Retírate a un lugar tranquilo donde puedas estar solo por unos minutos.',
    icon: 'door-open',
  },
  {
    id: 3,
    title: 'Respirar',
    description: 'Toma respiraciones profundas. Inhala por 4 segundos, mantén por 4, exhala por 4.',
    icon: 'breathing',
  },
  {
    id: 4,
    title: 'Reflexionar',
    description: 'Reflexiona sobre lo que estás sintiendo. ¿Qué desencadenó esta emoción?',
    icon: 'lightbulb-on',
  },
  {
    id: 5,
    title: 'Regresar',
    description: 'Cuando te sientas más calmado, puedes regresar y abordar la situación de manera más constructiva.',
    icon: 'arrow-left',
  },
];

const TimeoutTechniqueScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutos

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

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true);
    setCurrentStep(0);
    setTimeRemaining(300);
  };

  const handleNext = () => {
    if (currentStep < TIMEOUT_STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(prev => prev - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const step = TIMEOUT_STEPS[currentStep];

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Técnica de Tiempo Fuera"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>⏸️ Técnica de Tiempo Fuera</Text>
          <Text style={styles.introText}>
            Cuando sientes enojo o frustración, tomar un tiempo fuera puede ayudarte a calmarte y responder de manera más constructiva.
          </Text>
        </View>

        {isActive ? (
          <View style={styles.activeContainer}>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.timerLabel}>Tiempo restante</Text>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={step.icon}
                    size={40}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.stepNumber}>Paso {currentStep + 1} de {TIMEOUT_STEPS.length}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>

            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
                onPress={handlePrevious}
                disabled={currentStep === 0}
              >
                <Text style={styles.navButtonText}>Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrimary]}
                onPress={handleNext}
                disabled={currentStep === TIMEOUT_STEPS.length - 1}
              >
                <Text style={styles.navButtonText}>Siguiente</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.stopButton} onPress={() => setIsActive(false)}>
              <Text style={styles.stopButtonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <MaterialCommunityIcons name="play-circle" size={48} color={colors.white} />
            <Text style={styles.startButtonText}>Comenzar Tiempo Fuera</Text>
            <Text style={styles.startButtonSubtext}>5 minutos guiados</Text>
          </TouchableOpacity>
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
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  startButtonSubtext: {
    color: colors.white,
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  activeContainer: {
    marginTop: 20,
  },
  timerContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
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
  stepContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumber: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  stopButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TimeoutTechniqueScreen;

