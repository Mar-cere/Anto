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
import {
  FOCUS_ACCENT_BORDER,
  FOCUS_BORDER_SUBTLE,
  FOCUS_META,
} from '../../styles/focusCardTheme';
import { colors } from '../../styles/globalStyles';
import { techniqueScreenStyles } from './techniqueScreenStyles';

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
            <Text style={styles.completedTitle}>Ejercicio completado</Text>
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
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={techniqueScreenStyles.scrollContent}
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
              <View style={[styles.iconContainer, { borderColor: `${step.color}55` }]}>
                <MaterialCommunityIcons
                  name={step.icon}
                  size={48}
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
                    color={FOCUS_META}
                  />
                  <Text style={styles.tipsText}>{step.tips}</Text>
                </View>
              )}

              <TextInput
                style={[
                  techniqueScreenStyles.textInput,
                  techniqueScreenStyles.textInputTall,
                  styles.textInputSpacing,
                ]}
                placeholder={step.placeholder}
                placeholderTextColor={FOCUS_META}
                value={currentResponse}
                onChangeText={setCurrentResponse}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <View style={techniqueScreenStyles.buttonRow}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={[techniqueScreenStyles.secondaryButton, styles.navButtonRow]}
                    onPress={handleBack}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={techniqueScreenStyles.secondaryButtonText}>Atrás</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    techniqueScreenStyles.navButton,
                    techniqueScreenStyles.navButtonPrimary,
                    styles.nextRow,
                    !currentResponse.trim() && techniqueScreenStyles.navButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!currentResponse.trim()}
                >
                  <Text style={techniqueScreenStyles.navButtonText}>
                    {isLastStep ? 'Completar' : 'Siguiente'}
                  </Text>
                  {!isLastStep && (
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color={colors.white}
                      style={styles.nextIcon}
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
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
    backgroundColor: FOCUS_BORDER_SUBTLE,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  stepContainer: {
    alignSelf: 'stretch',
    backgroundColor: colors.cardBackground,
    borderRadius: 22,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    marginBottom: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(26, 221, 219, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 15,
    color: FOCUS_META,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: FOCUS_META,
    marginLeft: 8,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  navButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextIcon: {
    marginLeft: 6,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputSpacing: {
    marginBottom: 18,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 15,
    color: FOCUS_META,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export default SelfCompassionScreen;

