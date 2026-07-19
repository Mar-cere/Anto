/**
 * Recorrido de bienvenida: estilo alineado al home/resumen y mensaje centrado en beneficios.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
  resolveOnboardingBrandAccent,
} from '../utils/onboardingSteps';
import {
  isTutorialCompleted as isTutorialCompletedStorage,
  resetTutorial as resetTutorialStorage,
} from '../utils/tutorialStorage';
import OnboardingBenefitCard from './onboarding/OnboardingBenefitCard';
import OnboardingBenefitList from './onboarding/OnboardingBenefitList';
import OnboardingBrandOrb from './onboarding/OnboardingBrandOrb';
import OnboardingBrandShell from './onboarding/OnboardingBrandShell';
import OnboardingGradientButton from './onboarding/OnboardingGradientButton';
import OnboardingStepHighlights from './onboarding/OnboardingStepHighlights';

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
  DISCLAIMER:
    'Anto no diagnostica ni sustituye terapia profesional ni atención de emergencia.',
  SKIP: 'Omitir',
  NEXT: 'Siguiente',
  PREVIOUS: 'Anterior',
  GET_STARTED: 'Ver cómo funciona',
  FINISH: 'Elegir mi foco',
  SWIPE_TO_SKIP: 'Desliza hacia abajo para omitir',
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
  STEP_HIGHLIGHTS_HEADING: 'Qué puedes hacer aquí',
  STEP_1_LABEL: 'Paso 1 · Chat',
  STEP_1_HIGHLIGHTS: [
    'Comparte cómo te sientes, a tu ritmo',
    'Recibe apoyo práctico sin juicios',
    'Anto recuerda tu foco y tu ánimo del día',
  ],
  STEP_2_LABEL: 'Paso 2 · Técnicas',
  STEP_2_HIGHLIGHTS: [
    'Ejercicios de TCC: ABC, exposición, activación',
    'Psicoeducación y técnicas de enfoque',
    'Sugerencias desde el chat según lo que necesites',
  ],
  STEP_3_LABEL: 'Paso 3 · Tu inicio',
  STEP_3_HIGHLIGHTS: [
    'Check-in emocional y foco del día',
    'Tareas y hábitos con recordatorios',
    'Todo conectado con tu resumen semanal',
  ],
  STEP_4_LABEL: 'Paso 4 · Seguimiento',
  STEP_4_HIGHLIGHTS: [
    'Tu resumen',
    'Patrones',
    'Contactos de confianza',
  ],
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
  const { colors } = useTheme();
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
  const brandAccent = useMemo(
    () => resolveOnboardingBrandAccent(colors),
    [colors],
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
          paddingHorizontal: SPACING.xs,
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
        stepScroll: {
          flex: 1,
        },
        stepBody: {
          width: '100%',
          alignItems: 'center',
        },
        title: {
          fontSize: 26,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 12,
          letterSpacing: -0.3,
        },
        subtitle: {
          fontSize: 15,
          fontWeight: '500',
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 8,
        },
        description: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 4,
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
          height: 4,
          backgroundColor: colors.glassFill,
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: 4,
          marginBottom: 4,
        },
        progressFill: {
          height: '100%',
          borderRadius: 2,
        },
        progressRow: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        },
        progressText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
        },
        footer: {
          flexDirection: 'row',
          gap: SPACING.CARD_INNER_INSET,
          alignItems: 'stretch',
        },
        backButton: {
          width: 52,
          minHeight: 52,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        backButtonDisabled: {
          opacity: 0.4,
        },
      }),
    [colors],
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
      <OnboardingBrandOrb scale={scaleAnim} />
      <Text style={styles.title}>{TEXTS.WELCOME}</Text>
      <Text style={styles.subtitle}>{TEXTS.WELCOME_SUBTITLE}</Text>
      <Text style={styles.description}>{TEXTS.WELCOME_DESCRIPTION}</Text>
      <OnboardingBenefitList items={welcomeBenefits} />
      <Text style={styles.disclaimer}>{TEXTS.DISCLAIMER}</Text>
    </Animated.View>
  );

  const renderStep = () => {
    if (!currentStepData) return null;
    const progressAccent = colors.primaryBright || brandAccent;
    return (
      <Animated.View
        style={[
          styles.stepBody,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <OnboardingBrandOrb
          stepIcon={currentStepData.icon}
          scale={scaleAnim}
          size="compact"
        />

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {currentStep + 1} / {totalSteps}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: progressAccent },
            ]}
          />
        </View>

        <Text style={styles.title}>{currentStepData.title}</Text>
        <Text style={styles.description}>{currentStepData.description}</Text>

        <OnboardingBenefitCard text={currentStepData.benefit} />

        <OnboardingStepHighlights
          heading={TEXTS.STEP_HIGHLIGHTS_HEADING}
          items={currentStepData.highlights}
        />
      </Animated.View>
    );
  };

  const footer = (
    <View style={styles.footer}>
      {!isWelcomeScreen ? (
        <TouchableOpacity
          onPress={handlePrevious}
          style={[
            styles.backButton,
            currentStep === 0 && styles.backButtonDisabled,
          ]}
          disabled={currentStep === 0}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.PREVIOUS}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      ) : null}

      <OnboardingGradientButton
        label={
          isWelcomeScreen
            ? TEXTS.GET_STARTED
            : currentStep === totalSteps - 1
              ? TEXTS.FINISH
              : TEXTS.NEXT
        }
        onPress={handleNext}
        flex={1}
        showChevron={!isWelcomeScreen && currentStep < totalSteps - 1}
        variant={currentStep === totalSteps - 1 ? 'commit' : 'default'}
      />
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
          <View style={styles.stepScroll}>
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
              style={styles.stepScroll}
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {isWelcomeScreen ? renderWelcome() : renderStep()}
            </ScrollView>
          </View>
        </OnboardingBrandShell>
      </View>
    </Modal>
  );
};

export default OnboardingTutorial;
