/**
 * Pantalla de Ejercicio de Autocompasión
 * Ejercicio interactivo guiado de autocompasión basado en la técnica de Kristin Neff
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';
import { SPACING } from '../../constants/ui';
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';

const BACKGROUND_IMAGE = require('../../images/back.png');
const BACKGROUND_OPACITY = 0.1;
const DEFAULT_TEXTS = {
  TITLE: 'Ejercicio de Autocompasion',
  COMPLETED_TITLE: 'Ejercicio completado',
  COMPLETED_BODY:
    'Has practicado la autocompasion. Recuerda ser amable contigo mismo.',
  BACK: 'Atras',
  NEXT: 'Siguiente',
  COMPLETE: 'Completar',
  STEP_1_TITLE: 'Reconocimiento',
  STEP_1_DESC:
    'Reconoce que estas pasando por un momento dificil. Es importante ser consciente de tus emociones sin juzgarlas.',
  STEP_1_PLACEHOLDER: 'Describe lo que estas sintiendo en este momento...',
  STEP_1_TIPS:
    'No necesitas tener todas las respuestas. Solo se honesto contigo mismo.',
  STEP_2_TITLE: 'Humanidad Comun',
  STEP_2_DESC:
    'Recuerda que todos pasamos por momentos dificiles. No estas solo en esto. El sufrimiento es parte de la experiencia humana.',
  STEP_2_PLACEHOLDER:
    'Escribe sobre como otros tambien pasan por momentos similares...',
  STEP_2_TIPS:
    'Piensa en personas que admiras y como tambien enfrentan desafios.',
  STEP_3_TITLE: 'Amabilidad',
  STEP_3_DESC:
    'Trata te con la misma amabilidad, cuidado y comprension que tratarias a un buen amigo o ser querido.',
  STEP_3_PLACEHOLDER:
    '¿Que le dirias a un amigo querido que esta pasando por esto?',
  STEP_3_TIPS:
    'Imagina que estas hablando con alguien que realmente te importa.',
  STEP_4_TITLE: 'Reflexion y Compromiso',
  STEP_4_DESC:
    'Reflexiona sobre lo que has escrito y como puedes aplicar la autocompasion en tu vida diaria.',
  STEP_4_PLACEHOLDER:
    'Reflexiona sobre lo que has aprendido y como puedes ser mas compasivo contigo mismo...',
  STEP_4_TIPS: 'La autocompasion es una practica continua, no un destino.',
};

function createStyles(colors, t) {
  return StyleSheet.create({
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
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
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
      backgroundColor: colors.glassFill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
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
      backgroundColor: t.FOCUS_BORDER_SUBTLE,
      marginHorizontal: 4,
    },
    progressLineActive: {
      backgroundColor: colors.primary,
    },
    stepContainer: {
      alignSelf: 'stretch',
      backgroundColor: colors.cardBackground,
      borderRadius: 22,
      padding: SPACING.HERO_INSET,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 72,
      height: 72,
      borderRadius: 22,
      marginBottom: 18,
      alignSelf: 'center',
      backgroundColor: colors.accentLineSoft,
      borderWidth: StyleSheet.hairlineWidth,
    },
    stepTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    stepDescription: {
      fontSize: 15,
      color: t.FOCUS_META,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 22,
    },
    tipsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.chromeInput,
      borderRadius: 14,
      padding: SPACING.CARD_INNER_INSET,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    tipsText: {
      flex: 1,
      fontSize: 14,
      color: t.FOCUS_META,
      marginLeft: 8,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    navButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
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
      padding: SPACING.SCREEN_EDGE_INSET,
    },
    completedTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 20,
      marginBottom: 12,
      textAlign: 'center',
    },
    completedText: {
      fontSize: 15,
      color: t.FOCUS_META,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    },
  });
}

const SelfCompassionScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.SELF_COMPASSION_TITLE || DEFAULT_TEXTS.TITLE,
      COMPLETED_TITLE:
        translated?.SELF_COMPASSION_COMPLETED_TITLE || DEFAULT_TEXTS.COMPLETED_TITLE,
      COMPLETED_BODY:
        translated?.SELF_COMPASSION_COMPLETED_BODY ||
        DEFAULT_TEXTS.COMPLETED_BODY,
      BACK: translated?.SELF_COMPASSION_BACK || DEFAULT_TEXTS.BACK,
      NEXT: translated?.SELF_COMPASSION_NEXT || DEFAULT_TEXTS.NEXT,
      COMPLETE: translated?.SELF_COMPASSION_COMPLETE || DEFAULT_TEXTS.COMPLETE,
      STEP_1_TITLE:
        translated?.SELF_COMPASSION_STEP_1_TITLE || DEFAULT_TEXTS.STEP_1_TITLE,
      STEP_1_DESC:
        translated?.SELF_COMPASSION_STEP_1_DESC ||
        DEFAULT_TEXTS.STEP_1_DESC,
      STEP_1_PLACEHOLDER:
        translated?.SELF_COMPASSION_STEP_1_PLACEHOLDER ||
        DEFAULT_TEXTS.STEP_1_PLACEHOLDER,
      STEP_1_TIPS:
        translated?.SELF_COMPASSION_STEP_1_TIPS ||
        DEFAULT_TEXTS.STEP_1_TIPS,
      STEP_2_TITLE:
        translated?.SELF_COMPASSION_STEP_2_TITLE || DEFAULT_TEXTS.STEP_2_TITLE,
      STEP_2_DESC:
        translated?.SELF_COMPASSION_STEP_2_DESC ||
        DEFAULT_TEXTS.STEP_2_DESC,
      STEP_2_PLACEHOLDER:
        translated?.SELF_COMPASSION_STEP_2_PLACEHOLDER ||
        DEFAULT_TEXTS.STEP_2_PLACEHOLDER,
      STEP_2_TIPS:
        translated?.SELF_COMPASSION_STEP_2_TIPS ||
        DEFAULT_TEXTS.STEP_2_TIPS,
      STEP_3_TITLE:
        translated?.SELF_COMPASSION_STEP_3_TITLE || DEFAULT_TEXTS.STEP_3_TITLE,
      STEP_3_DESC:
        translated?.SELF_COMPASSION_STEP_3_DESC ||
        DEFAULT_TEXTS.STEP_3_DESC,
      STEP_3_PLACEHOLDER:
        translated?.SELF_COMPASSION_STEP_3_PLACEHOLDER ||
        DEFAULT_TEXTS.STEP_3_PLACEHOLDER,
      STEP_3_TIPS:
        translated?.SELF_COMPASSION_STEP_3_TIPS ||
        DEFAULT_TEXTS.STEP_3_TIPS,
      STEP_4_TITLE:
        translated?.SELF_COMPASSION_STEP_4_TITLE || DEFAULT_TEXTS.STEP_4_TITLE,
      STEP_4_DESC:
        translated?.SELF_COMPASSION_STEP_4_DESC ||
        DEFAULT_TEXTS.STEP_4_DESC,
      STEP_4_PLACEHOLDER:
        translated?.SELF_COMPASSION_STEP_4_PLACEHOLDER ||
        DEFAULT_TEXTS.STEP_4_PLACEHOLDER,
      STEP_4_TIPS:
        translated?.SELF_COMPASSION_STEP_4_TIPS ||
        DEFAULT_TEXTS.STEP_4_TIPS,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [completed, setCompleted] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  const steps = useMemo(
    () => [
      {
        id: 1,
        title: TEXTS.STEP_1_TITLE,
        description: TEXTS.STEP_1_DESC,
        placeholder: TEXTS.STEP_1_PLACEHOLDER,
        icon: 'heart',
        color: colors.primary,
        tips: TEXTS.STEP_1_TIPS,
      },
      {
        id: 2,
        title: TEXTS.STEP_2_TITLE,
        description: TEXTS.STEP_2_DESC,
        placeholder: TEXTS.STEP_2_PLACEHOLDER,
        icon: 'account-group',
        color: colors.textSecondary,
        tips: TEXTS.STEP_2_TIPS,
      },
      {
        id: 3,
        title: TEXTS.STEP_3_TITLE,
        description: TEXTS.STEP_3_DESC,
        placeholder: TEXTS.STEP_3_PLACEHOLDER,
        icon: 'hand-heart',
        color: colors.primary,
        tips: TEXTS.STEP_3_TIPS,
      },
      {
        id: 4,
        title: TEXTS.STEP_4_TITLE,
        description: TEXTS.STEP_4_DESC,
        placeholder: TEXTS.STEP_4_PLACEHOLDER,
        icon: 'lightbulb-on',
        color: colors.primary,
        tips: TEXTS.STEP_4_TIPS,
      },
    ],
    [colors, TEXTS],
  );

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

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
  }, [currentStep, fadeAnim, slideAnim]);

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
      setCurrentResponse(responses[steps[currentStep - 1].id] || '');
    }
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompleted(true);
    recordInterventionCompleted('self_compassion_exercise');
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  if (completed) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
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
            <Text style={styles.completedTitle}>{TEXTS.COMPLETED_TITLE}</Text>
            <Text style={styles.completedText}>{TEXTS.COMPLETED_BODY}</Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ParticleBackground />
        <Header
          title={TEXTS.TITLE}
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
              {steps.map((s, index) => (
                <View key={s.id} style={styles.progressStepContainer}>
                  <View
                    style={[
                      styles.progressDot,
                      index <= currentStep && styles.progressDotActive,
                      index === currentStep && styles.progressDotCurrent,
                    ]}
                  />
                  {index < steps.length - 1 && (
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
                    color={colors.textSecondary}
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
                placeholderTextColor={colors.textSecondary}
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
                    <Text style={techniqueScreenStyles.secondaryButtonText}>{TEXTS.BACK}</Text>
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
                    {isLastStep ? TEXTS.COMPLETE : TEXTS.NEXT}
                  </Text>
                  {!isLastStep && (
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color={colors.textOnPrimary}
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

export default SelfCompassionScreen;

