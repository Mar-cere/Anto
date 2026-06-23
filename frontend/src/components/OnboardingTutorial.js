/**
 * Recorrido de bienvenida: estilo alineado al home/resumen y mensaje centrado en beneficios.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import {
  buildOnboardingBenefits,
  buildOnboardingTutorialSteps,
} from '../utils/onboardingSteps';
import { getWelcomeScreenTheme } from '../utils/welcomeScreenTheme';
import {
  isTutorialCompleted as isTutorialCompletedStorage,
  resetTutorial as resetTutorialStorage,
} from '../utils/tutorialStorage';
import OnboardingBenefitList from './onboarding/OnboardingBenefitList';
import OnboardingBrandShell from './onboarding/OnboardingBrandShell';

const { width } = Dimensions.get('window');

export const isTutorialCompleted = isTutorialCompletedStorage;
export const resetTutorial = resetTutorialStorage;

const DEFAULT_TEXTS = {
  WELCOME: 'Bienvenido a Anto',
  WELCOME_SUBTITLE: 'Acompañamiento emocional con evidencia',
  WELCOME_DESCRIPTION:
    'Un espacio privado para hablar, practicar técnicas de bienestar y ver tu proceso — a tu ritmo.',
  BENEFIT_1: 'Chat personalizado según cómo te sientes',
  BENEFIT_2: 'Técnicas de TCC y escalas clínicas (PHQ-9, GAD-7)',
  BENEFIT_3: 'Resumen semanal, hábitos y recursos de crisis',
  BENEFITS_HEADING: 'Lo que obtienes con Anto',
  DISCLAIMER:
    'Anto no diagnostica ni sustituye terapia profesional ni atención de emergencia.',
  SKIP: 'Omitir',
  NEXT: 'Siguiente',
  PREVIOUS: 'Anterior',
  GET_STARTED: 'Ver cómo funciona',
  FINISH: 'Elegir mi foco',
  SWIPE_TO_SKIP: 'Desliza hacia abajo para omitir',
  ARROW_HINT: 'Mira abajo',
  ARROW_HINT_UP: 'Mira arriba',
  STEP_1_TITLE: 'Habla cuando lo necesites',
  STEP_1_DESCRIPTION:
    'El chat es el corazón de Anto: comparte lo que te pasa y recibe apoyo práctico, sin juicios.',
  STEP_1_BENEFIT: 'Respuestas adaptadas a tu ánimo del día y a tu foco inicial.',
  STEP_2_TITLE: 'Herramientas con respaldo',
  STEP_2_DESCRIPTION:
    'Practica ejercicios de TCC (ABC, exposición, activación conductual), psicoeducación y técnicas de enfoque.',
  STEP_2_BENEFIT: 'Basado en métodos con evidencia; Anto te sugiere ejercicios desde el chat.',
  STEP_3_TITLE: 'Tu día en un vistazo',
  STEP_3_DESCRIPTION:
    'Check-in emocional, foco del día, tareas y hábitos con recordatorios suaves.',
  STEP_3_BENEFIT: 'Conecta lo que haces en la app con tu bienestar semanal.',
  STEP_4_TITLE: 'Progreso y seguridad',
  STEP_4_DESCRIPTION:
    'Revisa tu resumen, patrones y contactos de confianza en Perfil y Ajustes.',
  STEP_4_BENEFIT: 'Detección de crisis con recursos inmediatos si los necesitas.',
};

const OnboardingTutorial = ({
  visible,
  onComplete,
  highlightElement = null,
  onHighlightChange,
  userId = null,
}) => {
  const translated = useSectionTranslations('ONBOARDING');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...translated }),
    [translated],
  );
  const { colors, resolvedScheme } = useTheme();
  const welcomeTheme = useMemo(
    () => getWelcomeScreenTheme(resolvedScheme, colors),
    [resolvedScheme, colors],
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  const tutorialSteps = useMemo(
    () => buildOnboardingTutorialSteps(TEXTS, colors),
    [TEXTS, colors],
  );
  const welcomeBenefits = useMemo(
    () => buildOnboardingBenefits(TEXTS),
    [TEXTS],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        topBar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        skipButton: {
          paddingVertical: 6,
          paddingHorizontal: 4,
        },
        skipText: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
        },
        swipeHint: {
          color: colors.textMuted ?? colors.textSecondary,
          fontSize: 11,
          textAlign: 'right',
          flex: 1,
          marginLeft: 12,
        },
        scroll: {
          flexGrow: 1,
        },
        stepBody: {
          alignItems: 'center',
          paddingBottom: 8,
        },
        logoWrap: {
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
          backgroundColor: welcomeTheme.logoGlow,
        },
        logo: {
          width: 64,
          height: 64,
          resizeMode: 'contain',
        },
        iconBadge: {
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        },
        eyebrow: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.primary,
          marginBottom: 8,
        },
        title: {
          fontSize: 26,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 10,
          letterSpacing: -0.3,
        },
        subtitle: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.primary,
          textAlign: 'center',
          marginBottom: 12,
        },
        description: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 4,
        },
        benefitCallout: {
          marginTop: 14,
          width: '100%',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
        },
        benefitCalloutText: {
          flex: 1,
          fontSize: 14,
          lineHeight: 20,
          color: colors.text,
          fontWeight: '600',
        },
        disclaimer: {
          marginTop: 14,
          fontSize: 12,
          lineHeight: 18,
          color: colors.textMuted ?? colors.textSecondary,
          textAlign: 'center',
        },
        progressBar: {
          width: '100%',
          height: 5,
          backgroundColor: colors.glassFill,
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        progressFill: {
          height: '100%',
          borderRadius: 3,
        },
        progressRow: {
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        },
        progressText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
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
        dots: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          marginTop: 18,
        },
        dot: {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.glassFill,
        },
        dotActive: {
          width: 22,
        },
        footer: {
          flexDirection: 'row',
          gap: 10,
        },
        navButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          borderRadius: 16,
          gap: 4,
        },
        previousButton: {
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        nextButton: {
          backgroundColor: colors.primary,
        },
        navButtonDisabled: {
          opacity: 0.45,
        },
        navButtonText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },
        navButtonTextMuted: {
          color: colors.text,
        },
      }),
    [colors, welcomeTheme.logoGlow],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10 && gestureState.dy > 0,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          handleSkip();
        }
      },
    }),
  ).current;

  const totalSteps = tutorialSteps.length;
  const isWelcomeScreen = currentStep === -1;
  const currentStepData = currentStep >= 0 ? tutorialSteps[currentStep] : null;
  const progress = isWelcomeScreen ? 0 : ((currentStep + 1) / totalSteps) * 100;

  const animateTransition = (direction, onMid) => {
    const out = direction === 'forward' ? -width : width;
    const inFrom = direction === 'forward' ? width : -width;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: out,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(inFrom);
      fadeAnim.setValue(1);
      onMid();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const setHighlightForStep = (stepIndex) => {
    if (!onHighlightChange) return;
    if (stepIndex < 0) {
      onHighlightChange(null);
      return;
    }
    onHighlightChange(tutorialSteps[stepIndex]?.highlightElement || null);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isWelcomeScreen) {
      animateTransition('forward', () => {
        setCurrentStep(0);
        setHighlightForStep(0);
      });
      return;
    }
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      animateTransition('forward', () => {
        setCurrentStep(nextStep);
        setHighlightForStep(nextStep);
      });
      return;
    }
    handleFinish();
  };

  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      animateTransition('backward', () => {
        setCurrentStep(prevStep);
        setHighlightForStep(prevStep);
      });
      return;
    }
    if (currentStep === 0) {
      animateTransition('backward', () => {
        setCurrentStep(-1);
        setHighlightForStep(-1);
      });
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.();
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHighlightForStep(-1);
    onComplete?.();
  };

  React.useEffect(() => {
    if (!visible) return;
    setCurrentStep(-1);
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    slideAnim.setValue(0);
    setHighlightForStep(-1);
  }, [visible]);

  React.useEffect(() => {
    if (isWelcomeScreen || !currentStepData) return;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.08,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, isWelcomeScreen, currentStepData, scaleAnim]);

  const renderWelcome = () => (
    <Animated.View
      style={[
        styles.stepBody,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={welcomeTheme.logo} style={styles.logo} accessibilityIgnoresInvertColors />
      </Animated.View>
      <Text style={styles.title}>{TEXTS.WELCOME}</Text>
      <Text style={styles.subtitle}>{TEXTS.WELCOME_SUBTITLE}</Text>
      <Text style={styles.description}>{TEXTS.WELCOME_DESCRIPTION}</Text>
      <OnboardingBenefitList
        heading={TEXTS.BENEFITS_HEADING}
        items={welcomeBenefits}
      />
      <Text style={styles.disclaimer}>{TEXTS.DISCLAIMER}</Text>
    </Animated.View>
  );

  const renderStep = () => {
    if (!currentStepData) return null;
    const accent = currentStepData.color;
    return (
      <Animated.View
        style={[
          styles.stepBody,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <Animated.View
          style={[
            styles.iconBadge,
            {
              backgroundColor: `${accent}22`,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={currentStepData.icon}
            size={36}
            color={accent}
          />
        </Animated.View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: accent },
            ]}
          />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {currentStep + 1} / {totalSteps}
          </Text>
          {currentStepData.highlightElement ? (
            <View style={styles.arrowHint}>
              <MaterialCommunityIcons
                name={
                  currentStepData.highlightElement === 'home-focus'
                    ? 'arrow-up'
                    : 'arrow-down'
                }
                size={15}
                color={accent}
              />
              <Text style={[styles.arrowText, { color: accent }]}>
                {currentStepData.highlightElement === 'home-focus'
                  ? TEXTS.ARROW_HINT_UP
                  : TEXTS.ARROW_HINT}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.eyebrow}>{TEXTS.BENEFITS_HEADING}</Text>
        <Text style={styles.title}>{currentStepData.title}</Text>
        <Text style={styles.description}>{currentStepData.description}</Text>

        {currentStepData.benefit ? (
          <View style={styles.benefitCallout}>
            <MaterialCommunityIcons name="check-circle" size={18} color={accent} />
            <Text style={styles.benefitCalloutText}>{currentStepData.benefit}</Text>
          </View>
        ) : null}

        <View style={styles.dots}>
          {tutorialSteps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.dot,
                index === currentStep && [
                  styles.dotActive,
                  { backgroundColor: accent },
                ],
              ]}
            />
          ))}
        </View>
      </Animated.View>
    );
  };

  const footer = (
    <View style={styles.footer}>
      {!isWelcomeScreen ? (
        <TouchableOpacity
          onPress={handlePrevious}
          style={[
            styles.navButton,
            styles.previousButton,
            currentStep === 0 && styles.navButtonDisabled,
          ]}
          disabled={currentStep === 0}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={colors.text}
          />
          <Text style={[styles.navButtonText, styles.navButtonTextMuted]}>
            {TEXTS.PREVIOUS}
          </Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        onPress={handleNext}
        style={[
          styles.navButton,
          styles.nextButton,
          !isWelcomeScreen && currentStepData
            ? { backgroundColor: currentStepData.color }
            : null,
          isWelcomeScreen ? { flex: 1 } : null,
        ]}
        activeOpacity={0.88}
      >
        <Text style={styles.navButtonText}>
          {isWelcomeScreen
            ? TEXTS.GET_STARTED
            : currentStep === totalSteps - 1
              ? TEXTS.FINISH
              : TEXTS.NEXT}
        </Text>
        {!isWelcomeScreen && currentStep < totalSteps - 1 ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textOnPrimary}
          />
        ) : null}
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.root} {...panResponder.panHandlers}>
        <OnboardingBrandShell footer={footer}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.75}
            >
              <Text style={styles.skipText}>{TEXTS.SKIP}</Text>
            </TouchableOpacity>
            {isWelcomeScreen ? (
              <Text style={styles.swipeHint}>{TEXTS.SWIPE_TO_SKIP}</Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {isWelcomeScreen ? renderWelcome() : renderStep()}
          </ScrollView>
        </OnboardingBrandShell>
      </View>
    </Modal>
  );
};

export default OnboardingTutorial;
