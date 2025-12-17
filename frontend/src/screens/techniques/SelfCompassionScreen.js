/**
 * Pantalla de Ejercicio de Autocompasión
 * Ejercicio interactivo guiado de autocompasión basado en la técnica de Kristin Neff
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
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
import { colors } from '../../styles/globalStyles';

const BACKGROUND_IMAGE = require('../../images/back.png');
const BACKGROUND_OPACITY = 0.1;

const STEPS = [
  {
    id: 1,
    title: 'Reconocimiento',
    description: 'Reconoce que estás pasando por un momento difícil. Es importante ser consciente de tus emociones sin juzgarlas.',
    placeholder: 'Describe lo que estás sintiendo en este momento...',
    icon: 'heart',
    color: colors.primary,
    tips: 'No necesitas tener todas las respuestas. Solo sé honesto contigo mismo.',
  },
  {
    id: 2,
    title: 'Humanidad Común',
    description: 'Recuerda que todos pasamos por momentos difíciles. No estás solo en esto. El sufrimiento es parte de la experiencia humana.',
    placeholder: 'Escribe sobre cómo otros también pasan por momentos similares...',
    icon: 'account-group',
    color: '#A3B8E8',
    tips: 'Piensa en personas que admiras y cómo también enfrentan desafíos.',
  },
  {
    id: 3,
    title: 'Amabilidad',
    description: 'Trátate con la misma amabilidad, cuidado y comprensión que tratarías a un buen amigo o ser querido.',
    placeholder: '¿Qué le dirías a un amigo querido que está pasando por esto?',
    icon: 'hand-heart',
    color: colors.primary,
    tips: 'Imagina que estás hablando con alguien que realmente te importa.',
  },
  {
    id: 4,
    title: 'Reflexión y Compromiso',
    description: 'Reflexiona sobre lo que has escrito y cómo puedes aplicar la autocompasión en tu vida diaria.',
    placeholder: 'Reflexiona sobre lo que has aprendido y cómo puedes ser más compasivo contigo mismo...',
    icon: 'lightbulb-on',
    color: colors.primary,
    tips: 'La autocompasión es una práctica continua, no un destino.',
  },
];

const SelfCompassionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [completed, setCompleted] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentResponse.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setResponses(prev => ({
        ...prev,
        [step.id]: currentResponse.trim(),
      }));
      setCurrentResponse('');

      if (isLastStep) {
        handleComplete();
      } else {
        // Resetear animaciones para el siguiente paso
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Resetear animaciones
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setCurrentStep(prev => prev - 1);
      setCurrentResponse(responses[STEPS[currentStep - 1].id] || '');
    }
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompleted(true);
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  if (completed) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <ImageBackground
          source={BACKGROUND_IMAGE}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <ParticleBackground />
          <View style={styles.completedContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color={colors.primary}
            />
            <Text style={styles.completedTitle}>¡Ejercicio Completado!</Text>
            <Text style={styles.completedText}>
              Has practicado la autocompasión. Recuerda ser amable contigo mismo.
            </Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ParticleBackground />
        <Header
          title="Ejercicio de Autocompasión"
          onBack={() => navigation.goBack()}
        />
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Indicador de progreso */}
            <View style={styles.progressContainer}>
              {STEPS.map((s, index) => (
                <View key={s.id} style={styles.progressStepContainer}>
                  <View
                    style={[
                      styles.progressDot,
                      index <= currentStep && styles.progressDotActive,
                      index === currentStep && styles.progressDotCurrent,
                    ]}
                  />
                  {index < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        index < currentStep && styles.progressLineActive,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Contenido del paso actual */}
            <Animated.View
              style={[
                styles.stepContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${step.color}20` }]}>
                <MaterialCommunityIcons
                  name={step.icon}
                  size={56}
                  color={step.color}
                />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
              
              {step.tips && (
                <View style={styles.tipsContainer}>
                  <MaterialCommunityIcons
                    name="lightbulb-on-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.tipsText}>{step.tips}</Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder={step.placeholder}
                placeholderTextColor={colors.textSecondary}
                value={currentResponse}
                onChangeText={setCurrentResponse}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              {/* Botones de navegación */}
              <View style={styles.buttonContainer}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={handleBack}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={20}
                      color={colors.text}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.backButtonText}>Atrás</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.nextButton,
                    !currentResponse.trim() && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!currentResponse.trim()}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastStep ? 'Completar' : 'Siguiente'}
                  </Text>
                  {!isLastStep && (
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color={colors.white}
                      style={styles.buttonIcon}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: BACKGROUND_OPACITY,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  progressStepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: colors.primary,
  },
  progressDotCurrent: {
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  stepContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.1)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    alignSelf: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonIcon: {
    marginHorizontal: 4,
  },
  backButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

export default SelfCompassionScreen;

