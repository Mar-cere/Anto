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
  WELCOME_SUBTITLE: 'Te guiaremos por las funcionalidades principales',
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
  },
  {
    id: 2,
    icon: 'message-text',
    title: 'Chat de Apoyo',
    description: 'Conversa con nuestro asistente de IA. Comparte cómo te sientes y recibe apoyo emocional personalizado las 24 horas.',
    color: '#4ECDC4',
  },
  {
    id: 3,
    icon: 'check-circle',
    title: 'Tareas y Hábitos',
    description: 'Organiza tu día con tareas y construye hábitos saludables. El seguimiento constante te ayuda a mantener el equilibrio.',
    color: '#FFA500',
  },
  {
    id: 4,
    icon: 'chart-line',
    title: 'Estadísticas',
    description: 'Visualiza tu progreso emocional, completación de tareas y seguimiento de hábitos con gráficos detallados.',
    color: '#9B59B6',
  },
  {
    id: 5,
    icon: 'alert-circle',
    title: 'Contactos de Emergencia',
    description: 'Configura contactos de confianza que recibirán alertas si detectamos situaciones de riesgo. Tu seguridad es nuestra prioridad.',
    color: '#FF6B6B',
  },
  {
    id: 6,
    icon: 'cog',
    title: 'Configuración',
    description: 'Personaliza tu experiencia: notificaciones, tema, idioma y más. Todo está en tus manos.',
    color: '#95A5A6',
  },
];

const OnboardingTutorial = ({ visible, onComplete }) => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  const totalSteps = TUTORIAL_STEPS.length;
  const currentStepData = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      setCurrentStep(currentStep - 1);
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
    onComplete?.();
  };

  const markTutorialAsCompleted = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
    } catch (error) {
      console.error('Error guardando estado del tutorial:', error);
    }
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

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
          <Animated.View
            style={[
              styles.stepContainer,
              { opacity: fadeAnim }
            ]}
          >
            {/* Icono */}
            <View style={[styles.iconContainer, { backgroundColor: `${currentStepData.color}20` }]}>
              <MaterialCommunityIcons
                name={currentStepData.icon}
                size={80}
                color={currentStepData.color}
              />
            </View>

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
        </ScrollView>

        {/* Footer con botones de navegación */}
        <View style={styles.footer}>
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

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: currentStepData.color }
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonText}>
              {currentStep === totalSteps - 1 ? TEXTS.FINISH : TEXTS.NEXT}
            </Text>
            {currentStep < totalSteps - 1 && (
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

