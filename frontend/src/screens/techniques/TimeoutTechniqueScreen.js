/**
 * Pantalla de Técnica de Tiempo Fuera
 * Guía para usar la técnica de tiempo fuera cuando se siente enojo o frustración
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
  TITLE: 'Tecnica de Tiempo Fuera',
  INTRO_KICKER: 'Autorregulacion',
  INTRO_TITLE: 'Tecnica de tiempo fuera',
  INTRO_BODY:
    'Cuando sientes enojo o frustracion, tomar un tiempo fuera puede ayudarte a calmarte y responder de manera mas constructiva.',
  TIMER_REMAINING: 'Tiempo restante',
  STEP_PREFIX: 'Paso',
  OF: 'de',
  PREVIOUS: 'Anterior',
  NEXT: 'Siguiente',
  FINISH: 'Finalizar',
  START_TITLE: 'Comenzar tiempo fuera',
  START_SUB: '5 minutos guiados',
  STEP_1_TITLE: 'Reconocer',
  STEP_1_DESC:
    'Reconoce que necesitas un tiempo fuera. No hay nada de malo en tomarte un descanso.',
  STEP_2_TITLE: 'Retirarse',
  STEP_2_DESC:
    'Retirate a un lugar tranquilo donde puedas estar solo por unos minutos.',
  STEP_3_TITLE: 'Respirar',
  STEP_3_DESC:
    'Toma respiraciones profundas. Inhala por 4 segundos, manten por 4, exhala por 4.',
  STEP_4_TITLE: 'Reflexionar',
  STEP_4_DESC:
    'Reflexiona sobre lo que estas sintiendo. ¿Que desencadeno esta emocion?',
  STEP_5_TITLE: 'Regresar',
  STEP_5_DESC:
    'Cuando te sientas mas calmado, puedes regresar y abordar la situacion de manera mas constructiva.',
};

const TimeoutTechniqueScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.TIMEOUT_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.TIMEOUT_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.TIMEOUT_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.TIMEOUT_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      TIMER_REMAINING:
        translated?.TIMEOUT_TIMER_REMAINING || DEFAULT_TEXTS.TIMER_REMAINING,
      STEP_PREFIX: translated?.TIMEOUT_STEP_PREFIX || DEFAULT_TEXTS.STEP_PREFIX,
      OF: translated?.TIMEOUT_OF || DEFAULT_TEXTS.OF,
      PREVIOUS: translated?.TIMEOUT_PREVIOUS || DEFAULT_TEXTS.PREVIOUS,
      NEXT: translated?.TIMEOUT_NEXT || DEFAULT_TEXTS.NEXT,
      FINISH: translated?.TIMEOUT_FINISH || DEFAULT_TEXTS.FINISH,
      START_TITLE:
        translated?.TIMEOUT_START_TITLE || DEFAULT_TEXTS.START_TITLE,
      START_SUB: translated?.TIMEOUT_START_SUB || DEFAULT_TEXTS.START_SUB,
      STEP_1_TITLE: translated?.TIMEOUT_STEP_1_TITLE || DEFAULT_TEXTS.STEP_1_TITLE,
      STEP_1_DESC:
        translated?.TIMEOUT_STEP_1_DESC ||
        DEFAULT_TEXTS.STEP_1_DESC,
      STEP_2_TITLE: translated?.TIMEOUT_STEP_2_TITLE || DEFAULT_TEXTS.STEP_2_TITLE,
      STEP_2_DESC:
        translated?.TIMEOUT_STEP_2_DESC ||
        DEFAULT_TEXTS.STEP_2_DESC,
      STEP_3_TITLE: translated?.TIMEOUT_STEP_3_TITLE || DEFAULT_TEXTS.STEP_3_TITLE,
      STEP_3_DESC:
        translated?.TIMEOUT_STEP_3_DESC ||
        DEFAULT_TEXTS.STEP_3_DESC,
      STEP_4_TITLE: translated?.TIMEOUT_STEP_4_TITLE || DEFAULT_TEXTS.STEP_4_TITLE,
      STEP_4_DESC:
        translated?.TIMEOUT_STEP_4_DESC ||
        DEFAULT_TEXTS.STEP_4_DESC,
      STEP_5_TITLE: translated?.TIMEOUT_STEP_5_TITLE || DEFAULT_TEXTS.STEP_5_TITLE,
      STEP_5_DESC:
        translated?.TIMEOUT_STEP_5_DESC ||
        DEFAULT_TEXTS.STEP_5_DESC,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const TIMEOUT_STEPS = useMemo(
    () => [
      { id: 1, title: TEXTS.STEP_1_TITLE, description: TEXTS.STEP_1_DESC, icon: 'alert-circle' },
      { id: 2, title: TEXTS.STEP_2_TITLE, description: TEXTS.STEP_2_DESC, icon: 'door-open' },
      { id: 3, title: TEXTS.STEP_3_TITLE, description: TEXTS.STEP_3_DESC, icon: 'breathing' },
      { id: 4, title: TEXTS.STEP_4_TITLE, description: TEXTS.STEP_4_DESC, icon: 'lightbulb-on' },
      { id: 5, title: TEXTS.STEP_5_TITLE, description: TEXTS.STEP_5_DESC, icon: 'arrow-left' },
    ],
    [
      TEXTS.STEP_1_TITLE,
      TEXTS.STEP_1_DESC,
      TEXTS.STEP_2_TITLE,
      TEXTS.STEP_2_DESC,
      TEXTS.STEP_3_TITLE,
      TEXTS.STEP_3_DESC,
      TEXTS.STEP_4_TITLE,
      TEXTS.STEP_4_DESC,
      TEXTS.STEP_5_TITLE,
      TEXTS.STEP_5_DESC,
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
        activeBlock: {
          marginTop: 4,
          gap: 14,
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

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordInterventionCompleted('timeout_technique');
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const step = TIMEOUT_STEPS[currentStep];

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

        {isActive ? (
          <View style={styles.activeBlock}>
            <View style={techniqueScreenStyles.activePanel}>
              <Text style={techniqueScreenStyles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={techniqueScreenStyles.timerLabel}>{TEXTS.TIMER_REMAINING}</Text>
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
                    {TEXTS.STEP_PREFIX} {currentStep + 1} {TEXTS.OF} {TIMEOUT_STEPS.length}
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
                <Text style={techniqueScreenStyles.navButtonTextMuted}>{TEXTS.PREVIOUS}</Text>
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
                <Text style={techniqueScreenStyles.navButtonText}>{TEXTS.NEXT}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={techniqueScreenStyles.stopButton} onPress={handleFinish}>
              <Text style={techniqueScreenStyles.stopButtonText}>{TEXTS.FINISH}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={techniqueScreenStyles.ctaHero} onPress={handleStart}>
            <MaterialCommunityIcons name="play-circle" size={48} color={colors.primary} />
            <Text style={techniqueScreenStyles.ctaHeroTitle}>{TEXTS.START_TITLE}</Text>
            <Text style={techniqueScreenStyles.ctaHeroSub}>{TEXTS.START_SUB}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// `styles` se deriva del tema dentro del componente.

export default TimeoutTechniqueScreen;
