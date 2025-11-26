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
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../styles/globalStyles';

const { width, height } = Dimensions.get('window');

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  TUTORIAL_COMPLETED: 'tutorialCompleted',
};

// Constantes de textos
const TEXTS = {
  WELCOME: '¡Bienvenido a Anto!',
  WELCOME_SUBTITLE: 'Tu compañero de bienestar emocional',
  WELCOME_DESCRIPTION: 'Estamos aquí para acompañarte en tu camino hacia el bienestar. Te guiaremos por las funcionalidades principales.',
  SKIP: 'Omitir',
  NEXT: 'Siguiente',
  PREVIOUS: 'Anterior',
  GET_STARTED: 'Comenzar',
  FINISH: 'Finalizar',
};

// Pasos del tutorial
const TUTORIAL_STEPS = [
  {
    id: 1,
    icon: 'home',
    title: 'Dashboard Principal',
    description: 'Tu centro de control. Aquí verás un resumen de tus tareas, hábitos y el estado de tu bienestar emocional.',
    color: colors.primary,
    highlightElement: null, // No resaltar nada en el dashboard general
  },
  {
    id: 2,
    icon: 'message-text',
    title: 'Chat de Apoyo',
    description: 'Conversa con nuestro asistente de IA. Comparte cómo te sientes y recibe apoyo emocional personalizado las 24 horas.',
    color: '#4ECDC4',
    highlightElement: 'chat', // Resaltar el botón de chat
  },
  {
    id: 3,
    icon: 'check-circle',
    title: 'Tareas y Hábitos',
    description: 'Organiza tu día con tareas pendientes y construye hábitos saludables. El seguimiento constante te ayuda a mantener el equilibrio y alcanzar tus metas.',
    color: '#FFA500',
    highlightElement: 'tasks-habits', // Resaltar las tarjetas de tareas y hábitos
  },
  {
    id: 4,
    icon: 'alert-circle',
    title: 'Contactos de Emergencia',
    description: 'Configura contactos de confianza que recibirán alertas si detectamos situaciones de riesgo. Tu seguridad es nuestra prioridad.',
    color: '#FF6B6B',
    highlightElement: 'settings', // Resaltar el botón de ajustes donde están los contactos
  },
  {
    id: 5,
    icon: 'cog',
    title: 'Configuración',
    description: 'Personaliza tu experiencia: notificaciones, tema, idioma y más. Todo está en tus manos.',
    color: '#95A5A6',
    highlightElement: 'settings', // Resaltar el botón de ajustes
  },
];

const OnboardingTutorial = ({ visible, onComplete, highlightElement = null, onHighlightChange }) => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(-1); // -1 = pantalla de bienvenida
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  const totalSteps = TUTORIAL_STEPS.length;
  const isWelcomeScreen = currentStep === -1;
  const currentStepData = currentStep >= 0 ? TUTORIAL_STEPS[currentStep] : null;

  const handleNext = () => {
    if (isWelcomeScreen) {
      // Ir al primer paso del tutorial
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(0);
      // Notificar cambio de highlight
      if (onHighlightChange && TUTORIAL_STEPS[0].highlightElement) {
        onHighlightChange(TUTORIAL_STEPS[0].highlightElement);
      }
      return;
    }

    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextStep = currentStep + 1;
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(nextStep);
      // Notificar cambio de highlight
      if (onHighlightChange) {
        onHighlightChange(TUTORIAL_STEPS[nextStep]?.highlightElement || null);
      }
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prevStep = currentStep - 1;
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(prevStep);
      // Notificar cambio de highlight
      if (onHighlightChange) {
        onHighlightChange(TUTORIAL_STEPS[prevStep]?.highlightElement || null);
      }
    } else if (currentStep === 0) {
      // Volver a la pantalla de bienvenida
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(-1);
      if (onHighlightChange) {
        onHighlightChange(null);
      }
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markTutorialAsCompleted();
    onComplete?.();
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markTutorialAsCompleted();
    if (onHighlightChange) {
      onHighlightChange(null);
    }
    onComplete?.();
  };

  const markTutorialAsCompleted = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
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
      if (onHighlightChange) {
        onHighlightChange(null);
      }
    }
  }, [visible, onHighlightChange]);

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
  }, [currentStep, isWelcomeScreen]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.container}>
        {/* Header con botón de omitir */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>{TEXTS.SKIP}</Text>
          </TouchableOpacity>
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
                { opacity: fadeAnim }
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
                { opacity: fadeAnim }
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
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress}%`, backgroundColor: currentStepData.color }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentStep + 1} / {totalSteps}
                </Text>
              </View>

              {/* Título y descripción */}
              <Text style={styles.title}>{currentStepData.title}</Text>
              <Text style={styles.description}>{currentStepData.description}</Text>

              {/* Indicadores de pasos */}
              <View style={styles.dotsContainer}>
                {TUTORIAL_STEPS.map((_, index) => (
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
                color={currentStep === 0 ? '#666' : colors.white}
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
                color={colors.white}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: colors.white,
    fontSize: 16,
    opacity: 0.7,
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
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: colors.white,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
    marginBottom: 40,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#666',
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  welcomeSubtitle: {
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  welcomeDescription: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  welcomeButton: {
    backgroundColor: colors.primary,
    width: '100%',
  },
});

// Función helper para verificar si el tutorial ya fue completado
export const isTutorialCompleted = async () => {
  try {
    const completed = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
    return completed === 'true';
  } catch (error) {
    console.error('Error verificando estado del tutorial:', error);
    return false;
  }
};

// Función helper para resetear el tutorial (útil para testing)
export const resetTutorial = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
  } catch (error) {
    console.error('Error reseteando tutorial:', error);
  }
};

export default OnboardingTutorial;

