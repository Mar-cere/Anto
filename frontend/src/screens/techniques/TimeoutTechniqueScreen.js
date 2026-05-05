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
import ParticleBackground from '../../components/ParticleBackground';
import { colors } from '../../styles/globalStyles';
import { techniqueScreenStyles } from './techniqueScreenStyles';

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
  const [timeRemaining, setTimeRemaining] = useState(300);

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
      <ParticleBackground />
      <Header
        title="Técnica de Tiempo Fuera"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>Autorregulación</Text>
          <Text style={techniqueScreenStyles.introTitle}>Técnica de tiempo fuera</Text>
          <Text style={techniqueScreenStyles.introText}>
            Cuando sientes enojo o frustración, tomar un tiempo fuera puede ayudarte a calmarte y responder de manera más constructiva.
          </Text>
        </View>

        {isActive ? (
          <View style={styles.activeBlock}>
            <View style={techniqueScreenStyles.activePanel}>
              <Text style={techniqueScreenStyles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={techniqueScreenStyles.timerLabel}>Tiempo restante</Text>
            </View>

            <View style={techniqueScreenStyles.card}>
              <View style={techniqueScreenStyles.rowHeader}>
                <View style={techniqueScreenStyles.stepIconLarge}>
                  <MaterialCommunityIcons
                    name={step.icon}
                    size={36}
                    color={colors.primary}
                  />
                </View>
                <View style={techniqueScreenStyles.infoColumn}>
                  <Text style={techniqueScreenStyles.stepMeta}>
                    Paso {currentStep + 1} de {TIMEOUT_STEPS.length}
                  </Text>
                  <Text style={techniqueScreenStyles.stepTitle}>{step.title}</Text>
                </View>
              </View>
              <Text style={techniqueScreenStyles.stepDescription}>{step.description}</Text>
            </View>

            <View style={techniqueScreenStyles.navRow}>
              <TouchableOpacity
                style={[
                  techniqueScreenStyles.navButton,
                  currentStep === 0 && techniqueScreenStyles.navButtonDisabled,
                ]}
                onPress={handlePrevious}
                disabled={currentStep === 0}
              >
                <Text style={techniqueScreenStyles.navButtonTextMuted}>Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  techniqueScreenStyles.navButton,
                  techniqueScreenStyles.navButtonPrimary,
                  currentStep === TIMEOUT_STEPS.length - 1 && techniqueScreenStyles.navButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={currentStep === TIMEOUT_STEPS.length - 1}
              >
                <Text style={techniqueScreenStyles.navButtonText}>Siguiente</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={techniqueScreenStyles.stopButton} onPress={() => setIsActive(false)}>
              <Text style={techniqueScreenStyles.stopButtonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={techniqueScreenStyles.ctaHero} onPress={handleStart}>
            <MaterialCommunityIcons name="play-circle" size={48} color={colors.primary} />
            <Text style={techniqueScreenStyles.ctaHeroTitle}>Comenzar tiempo fuera</Text>
            <Text style={techniqueScreenStyles.ctaHeroSub}>5 minutos guiados</Text>
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
  activeBlock: {
    marginTop: 4,
    gap: 14,
  },
});

export default TimeoutTechniqueScreen;
