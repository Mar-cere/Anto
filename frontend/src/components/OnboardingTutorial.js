/**
 * Componente de Tutorial/Onboarding
 * 
 * Muestra un tutorial interactivo para usuarios nuevos que explica
 * las funcionalidades principales de la aplicación.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import {
  getTutorialStorageKey,
  isTutorialCompleted as isTutorialCompletedStorage,
  resetTutorial as resetTutorialStorage,
} from '../utils/tutorialStorage';

const { width } = Dimensions.get('window');

export const isTutorialCompleted = isTutorialCompletedStorage;
export const resetTutorial = resetTutorialStorage;

// Constantes de textos
const DEFAULT_TEXTS = {
  WELCOME: '¡Bienvenido a Anto!',
  WELCOME_SUBTITLE: 'Tu compañero de bienestar emocional',
  WELCOME_DESCRIPTION: 'Te guiaremos por las funcionalidades principales en solo unos segundos.',
  SKIP: 'Omitir',
  NEXT: 'Siguiente',
  PREVIOUS: 'Anterior',
  GET_STARTED: 'Comenzar',
  FINISH: 'Finalizar',
  SWIPE_TO_SKIP: 'Desliza hacia abajo para omitir',
  ARROW_HINT: 'Mira abajo',
  STEP_1_TITLE: 'Dashboard Principal',
  STEP_1_DESCRIPTION:
    'Tu centro de control con resumen de tareas, hábitos y bienestar emocional.',
  STEP_2_TITLE: 'Chat de Apoyo',
  STEP_2_DESCRIPTION:
    'Conversa con nuestro asistente de IA. Recibe apoyo emocional personalizado 24/7.',
  STEP_3_TITLE: 'Tareas y Hábitos',
  STEP_3_DESCRIPTION:
    'Organiza tu día y construye hábitos saludables con seguimiento constante.',
  STEP_4_TITLE: 'Contactos de Emergencia',
  STEP_4_DESCRIPTION:
    'Configura contactos de confianza que recibirán alertas en situaciones de riesgo.',
};

const OnboardingTutorial = ({ visible, onComplete, highlightElement = null, onHighlightChange, userId = null }) => {
  const translated = useSectionTranslations('ONBOARDING');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...translated }),
    [translated],
  );
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(-1); // -1 = pantalla de bienvenida
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  const tutorialSteps = useMemo(
    () => [
      {
        id: 1,
        icon: 'home',
        title: TEXTS.STEP_1_TITLE,
        description: TEXTS.STEP_1_DESCRIPTION,
        color: colors.primary,
        highlightElement: null,
      },
      {
        id: 2,
        icon: 'message-text',
        title: TEXTS.STEP_2_TITLE,
        description: TEXTS.STEP_2_DESCRIPTION,
        color: colors.secondary ?? colors.accentLine,
        highlightElement: 'chat',
      },
      {
        id: 3,
        icon: 'check-circle',
        title: TEXTS.STEP_3_TITLE,
        description: TEXTS.STEP_3_DESCRIPTION,
        color: colors.warning,
        highlightElement: 'tasks-habits',
      },
      {
        id: 4,
        icon: 'alert-circle',
        title: TEXTS.STEP_4_TITLE,
        description: TEXTS.STEP_4_DESCRIPTION,
        color: colors.error,
        highlightElement: 'settings',
      },
    ],
    [TEXTS, colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backdropStrong ?? 'rgba(0, 0, 0, 0.9)',
          paddingTop: Platform.OS === 'ios' ? 50 : 20,
        },
        header: {
          flexDirection: 'column',
          alignItems: 'flex-end',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 10,
          paddingBottom: 20,
        },
        skipButton: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 8,
        },
        skipButtonText: {
          color: colors.text,
          fontSize: 16,
          opacity: 0.75,
        },
        swipeHint: {
          color: colors.text,
          fontSize: 12,
          opacity: 0.55,
          marginTop: 4,
          textAlign: 'center',
        },
        content: {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 30,
          paddingBottom: 100,
        },
        stepContainer: {
          alignItems: 'center',
          width: '100%',
        },
        iconContainer: {
          width: 160,
          height: 160,
          borderRadius: 80,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 40,
        },
        progressContainer: {
          width: '100%',
          marginBottom: 30,
        },
        progressBar: {
          width: '100%',
          height: 6,
          backgroundColor: colors.glassFill,
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.glassOutline,
        },
        progressFill: {
          height: '100%',
          borderRadius: 3,
        },
        progressInfo: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        },
        progressText: {
          color: colors.text,
          fontSize: 12,
          opacity: 0.7,
          fontWeight: '700',
        },
        arrowHint: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        arrowText: {
          fontSize: 12,
          fontWeight: '600',
        },
        title: {
          fontSize: 32,
          fontWeight: 'bold',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 20,
        },
        description: {
          fontSize: 17,
          color: colors.text,
          textAlign: 'center',
          lineHeight: 26,
          opacity: 0.85,
          marginBottom: 40,
          paddingHorizontal: 10,
        },
        dotsContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.glassFill,
          borderWidth: 1,
          borderColor: colors.glassOutline,
          marginHorizontal: 4,
        },
        dotActive: {
          width: 24,
          height: 8,
          borderRadius: 4,
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: Platform.OS === 'ios' ? 40 : 20,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: colors.glassOutline,
        },
        navButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 25,
          minWidth: 120,
        },
        previousButton: {
          backgroundColor: colors.glassFill,
          borderWidth: 1,
          borderColor: colors.glassOutline,
        },
        nextButton: {
          backgroundColor: colors.primary,
        },
        navButtonDisabled: {
          opacity: 0.55,
        },
        navButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '700',
          marginHorizontal: 8,
        },
        navButtonTextDisabled: {
          color: colors.textSecondary,
        },
        welcomeTitle: {
          fontSize: 42,
          fontWeight: 'bold',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 16,
          marginTop: 20,
        },
        welcomeSubtitle: {
          fontSize: 24,
          color: colors.primary,
          textAlign: 'center',
          marginBottom: 20,
          fontWeight: '700',
        },
        welcomeDescription: {
          fontSize: 18,
          color: colors.text,
          textAlign: 'center',
          lineHeight: 28,
          opacity: 0.9,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        welcomeButton: {
          backgroundColor: colors.primary,
          width: '100%',
        },
      }),
    [colors],
  );
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Detectar deslizamiento hacia abajo
        return Math.abs(gestureState.dy) > 10 && gestureState.dy > 0;
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Si se deslizó hacia abajo más de 50px, omitir tutorial
        if (gestureState.dy > 50) {
          handleSkip();
        }
      },
    })
  ).current;

  const totalSteps = tutorialSteps.length;
  const isWelcomeScreen = currentStep === -1;
  const currentStepData = currentStep >= 0 ? tutorialSteps[currentStep] : null;

  const handleNext = () => {
    if (isWelcomeScreen) {
      // Ir al primer paso del tutorial
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(width);
        fadeAnim.setValue(1);
        setCurrentStep(0);
        // Notificar cambio de highlight
        if (onHighlightChange && tutorialSteps[0].highlightElement) {
          onHighlightChange(tutorialSteps[0].highlightElement);
        }
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return;
    }

    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextStep = currentStep + 1;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(width);
        fadeAnim.setValue(1);
        setCurrentStep(nextStep);
        // Notificar cambio de highlight
        if (onHighlightChange) {
          onHighlightChange(tutorialSteps[nextStep]?.highlightElement || null);
        }
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prevStep = currentStep - 1;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(-width);
        fadeAnim.setValue(1);
        setCurrentStep(prevStep);
        // Notificar cambio de highlight
        if (onHighlightChange) {
          onHighlightChange(tutorialSteps[prevStep]?.highlightElement || null);
        }
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (currentStep === 0) {
      // Volver a la pantalla de bienvenida
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(0);
        fadeAnim.setValue(1);
        setCurrentStep(-1);
        if (onHighlightChange) {
          onHighlightChange(null);
        }
      });
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markTutorialAsCompleted(userId);
    onComplete?.();
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markTutorialAsCompleted(userId);
    if (onHighlightChange) {
      onHighlightChange(null);
    }
    onComplete?.();
  };

  const markTutorialAsCompleted = async (userId) => {
    try {
      const key = getTutorialStorageKey(userId);
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error guardando estado del tutorial:', error);
    }
  };

  const progress = isWelcomeScreen ? 0 : ((currentStep + 1) / totalSteps) * 100;

  // Reiniciar el tutorial cuando se muestra
  React.useEffect(() => {
    if (visible) {
      setCurrentStep(-1); // Empezar con la pantalla de bienvenida
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      slideAnim.setValue(0);
      if (onHighlightChange) {
        onHighlightChange(null);
      }
    }
  }, [visible, onHighlightChange, fadeAnim, scaleAnim, slideAnim]);

  // Efecto para animar el icono cuando cambia el paso
  React.useEffect(() => {
    if (!isWelcomeScreen && currentStepData) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep, isWelcomeScreen, currentStepData, scaleAnim]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Header con botón de omitir */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>{TEXTS.SKIP}</Text>
          </TouchableOpacity>
          {isWelcomeScreen && (
            <Text style={styles.swipeHint}>{TEXTS.SWIPE_TO_SKIP}</Text>
          )}
        </View>

        {/* Contenido principal */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isWelcomeScreen ? (
            <Animated.View
              style={[
                styles.stepContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }]
                }
              ]}
            >
              {/* Pantalla de bienvenida */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: `${colors.primary}20`,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name="heart"
                  size={100}
                  color={colors.primary}
                />
              </Animated.View>

              <Text style={styles.welcomeTitle}>{TEXTS.WELCOME}</Text>
              <Text style={styles.welcomeSubtitle}>{TEXTS.WELCOME_SUBTITLE}</Text>
              <Text style={styles.welcomeDescription}>{TEXTS.WELCOME_DESCRIPTION}</Text>
            </Animated.View>
          ) : currentStepData ? (
            <Animated.View
              style={[
                styles.stepContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }]
                }
              ]}
            >
              {/* Icono */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: `${currentStepData.color}20`,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name={currentStepData.icon}
                  size={80}
                  color={currentStepData.color}
                />
              </Animated.View>

              {/* Indicador de progreso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: currentStepData.color
                      }
                    ]}
                  />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    {currentStep + 1} / {totalSteps}
                  </Text>
                  {currentStepData.highlightElement && (
                    <View style={styles.arrowHint}>
                      <MaterialCommunityIcons
                        name="arrow-down"
                        size={16}
                        color={currentStepData.color}
                      />
                      <Text style={[styles.arrowText, { color: currentStepData.color }]}>
                        {TEXTS.ARROW_HINT}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Título y descripción */}
              <Text style={styles.title}>{currentStepData.title}</Text>
              <Text style={styles.description}>{currentStepData.description}</Text>

              {/* Indicadores de pasos */}
              <View style={styles.dotsContainer}>
                {tutorialSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentStep && [
                        styles.dotActive,
                        { backgroundColor: currentStepData.color }
                      ]
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>

        {/* Footer con botones de navegación */}
        <View style={styles.footer}>
          {!isWelcomeScreen && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={[
                styles.navButton,
                styles.previousButton,
                currentStep === 0 && styles.navButtonDisabled
              ]}
              disabled={currentStep === 0}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={currentStep === 0 ? colors.textSecondary : colors.textOnPrimary}
              />
              <Text
                style={[
                  styles.navButtonText,
                  currentStep === 0 && styles.navButtonTextDisabled
                ]}
              >
                {TEXTS.PREVIOUS}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.navButton,
              styles.nextButton,
              isWelcomeScreen && styles.welcomeButton,
              !isWelcomeScreen && { backgroundColor: currentStepData.color }
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonText}>
              {isWelcomeScreen
                ? TEXTS.GET_STARTED
                : currentStep === totalSteps - 1
                ? TEXTS.FINISH
                : TEXTS.NEXT}
            </Text>
            {!isWelcomeScreen && currentStep < totalSteps - 1 && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textOnPrimary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// `styles` se crea por tema dentro del componente.

export default OnboardingTutorial;

